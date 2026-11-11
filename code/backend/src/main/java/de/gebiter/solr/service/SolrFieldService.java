package de.gebiter.solr.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import de.gebiter.access.service.AccessRoleService;
import de.gebiter.solr.SolrConfig;
import de.gebiter.solr.dto.SolrDefinitionChangedEvent;
import de.gebiter.solr.model.SolrField;
import de.gebiter.solr.model.SolrFieldType;
import de.gebiter.solr.model.SolrReference;
import de.gebiter.solr.repository.SolrFieldRepository;
import de.gebiter.util.Helper;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link SolrField}: die Felder eines Kerns, wie wir sie in Postgres definieren. Er nutzt nur sein
 * eigenes {@link SolrFieldRepository}. Ob es den Kern und die Rechte gibt, prüft er über den {@link SolrCoreService} und
 * den {@link AccessRoleService}. Anlegen, Ändern und Löschen darf nur der Admin.
 * <p>
 * Alle Felder liegen als Kopie im Speicher: Gelesen wird nur von dort, nie je Anfrage aus Postgres. Nach jedem
 * Anlegen, Ändern und Löschen lädt der Service die Kopie neu, erst nach dem Commit, damit sie nie einen Stand zeigt,
 * den es in Postgres nicht gibt.
 * <p>
 * Nur die Definition in Postgres: Nach Solr schreibt dieser Service nichts selbst. Nach jedem Commit meldet er die
 * Änderung ({@link SolrDefinitionChangedEvent}), daraufhin gleicht der {@link SolrSchemaSyncService} Solr an. Ein
 * geänderter Typ wird dort nur gemeldet (Neuaufbau des Kerns), gelöscht wird in Solr nie.
 * <p>
 * Die Zeilen der Referenzen ({@link SolrReference}) legt er an und löscht er nur über die eigenen Methoden dafür; an
 * einer solchen Zeile ändern sich über {@link #changeSolrField(SolrField)} nur Leserollen und Suchgewicht.
 */
@Service
public class SolrFieldService {

	private static final Logger LOGGER = LoggerFactory.getLogger(SolrFieldService.class);

	private final SolrFieldRepository solrFieldRepository;

	private final SolrCoreService solrCoreService;

	private final AccessRoleService accessRoleService;

	/** Für die Endungen der Zwillinge: So darf kein Feldname enden. */
	private final SolrConfig solrConfig;

	/** In dieser Sprache muss jeder Anzeigename Text haben ({@code gebiter.language.default-code}). */
	private final String defaultLanguageCode;

	/** Meldet nach dem Commit, dass ein Kern abgeglichen werden muss. */
	private final ApplicationEventPublisher applicationEventPublisher;

	/**
	 * Die Kopie aller Felder im Speicher: je Kern die Felder nach Namen, in der Reihenfolge der Feldtabelle. Wird nach
	 * jeder Änderung als Ganzes ersetzt und selbst nie verändert, deshalb reicht {@code volatile}. Die Felder darin sind
	 * von JPA gelöst: Niemand darf sie ändern, Änderungen laufen über die Methoden dieses Service.
	 */
	private volatile Map<String, Map<String, SolrField>> solrFieldsByNameBySolrCoreKey = Map.of();

	public SolrFieldService(SolrFieldRepository solrFieldRepository, SolrCoreService solrCoreService,
			AccessRoleService accessRoleService, SolrConfig solrConfig,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode,
			ApplicationEventPublisher applicationEventPublisher) {
		this.solrFieldRepository = solrFieldRepository;
		this.solrCoreService = solrCoreService;
		this.accessRoleService = accessRoleService;
		this.solrConfig = solrConfig;
		this.defaultLanguageCode = defaultLanguageCode;
		this.applicationEventPublisher = applicationEventPublisher;
	}

	/** Lädt die Kopie im Speicher beim Start. */
	@PostConstruct
	void loadSolrFieldsAtStart() {
		reloadSolrFields();
	}

	/**
	 * CREATE: Legt ein Feld in einem Kern an. Aus dem Body zählen Kern, Name, Typ, die Schalter, die Zwillinge, die Rechte
	 * zum Lesen, die Schreibregel, das Suchgewicht, Anzeigename, Beschreibung und Position.
	 *
	 * @throws IllegalArgumentException wenn der Kern fehlt oder es ihn nicht gibt, der Name ungültig ist, der Typ, die
	 *         Schreibregel oder der Anzeigename fehlt, ein Zwilling oder das Suchgewicht nicht passt oder ein Recht nicht
	 *         existiert
	 * @throws DuplicateKeyException wenn der Kern schon ein Feld mit diesem Namen hat
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public SolrField createSolrField(SolrField newSolrField) {
		String solrCoreKey = newSolrField.getSolrCoreKey();
		Helper.requireNotNull(solrCoreKey, "solrCoreKey");
		boolean solrCoreExists = solrCoreService.existsSolrCore(solrCoreKey);
		if (!solrCoreExists) {
			throw new IllegalArgumentException("Den Kern " + solrCoreKey + " gibt es nicht.");
		}
		String name = newSolrField.getName();
		Helper.requireValidSolrFieldName(name);
		requireSolrFieldNameWithoutTwinSuffix(name);
		boolean nameTaken = solrFieldRepository.existsBySolrCoreKeyAndName(solrCoreKey, name);
		if (nameTaken) {
			throw new DuplicateKeyException("Der Kern " + solrCoreKey + " hat schon ein Feld " + name + ".");
		}
		SolrFieldType type = newSolrField.getType();
		Helper.requireNotNull(type, "type");

		SolrField createdSolrField = new SolrField(solrCoreKey, name, type);
		copyChangeableValues(newSolrField, createdSolrField);
		SolrField savedSolrField = solrFieldRepository.save(createdSolrField);
		reloadSolrFieldsAfterCommit(solrCoreKey);
		return savedSolrField;
	}

	/**
	 * READ: Ein Feld über seine {@code id}, aus dem Speicher.
	 *
	 * @throws EntityNotFoundException wenn es das Feld nicht gibt
	 */
	public SolrField getSolrField(Long id) {
		Helper.requireNotNull(id, "id");
		Map<String, Map<String, SolrField>> currentSolrFields = solrFieldsByNameBySolrCoreKey;
		for (Map<String, SolrField> solrFieldsByName : currentSolrFields.values()) {
			for (SolrField solrField : solrFieldsByName.values()) {
				Long solrFieldId = solrField.getId();
				if (solrFieldId.equals(id)) {
					return solrField;
				}
			}
		}
		throw new EntityNotFoundException("Es gibt kein Feld mit der id " + id + ".");
	}

	/** READ: Alle Felder eines Kerns, in der Reihenfolge der Feldtabelle (Position, dann Name), aus dem Speicher. */
	public List<SolrField> getSolrFieldBySolrCoreKey(String solrCoreKey) {
		Helper.requireNotNull(solrCoreKey, "solrCoreKey");
		Map<String, Map<String, SolrField>> currentSolrFields = solrFieldsByNameBySolrCoreKey;
		Map<String, SolrField> solrFieldsByName = currentSolrFields.get(solrCoreKey);
		if (solrFieldsByName == null) {
			return List.of();
		}
		Collection<SolrField> solrFieldsOfCore = solrFieldsByName.values();
		return List.copyOf(solrFieldsOfCore);
	}

	/** READ: Alle Felder aller Kerne, je Kern in der Reihenfolge der Feldtabelle, aus dem Speicher. */
	public List<SolrField> getAllSolrField() {
		Map<String, Map<String, SolrField>> currentSolrFields = solrFieldsByNameBySolrCoreKey;
		List<SolrField> allSolrFields = new ArrayList<>();
		for (Map<String, SolrField> solrFieldsByName : currentSolrFields.values()) {
			Collection<SolrField> solrFieldsOfCore = solrFieldsByName.values();
			allSolrFields.addAll(solrFieldsOfCore);
		}
		return List.copyOf(allSolrFields);
	}

	/**
	 * UPDATE: Ändert ein Feld. Maßgeblich ist {@code id}, der Kern ändert sich nie. Übernommen werden Name, Typ, die
	 * Schalter, die Zwillinge, die Rechte zum Lesen, die Schreibregel, das Suchgewicht, Anzeigename, Beschreibung und
	 * Position. An der Zeile einer Referenz nur die Rechte zum Lesen und das Suchgewicht.
	 *
	 * @throws IllegalArgumentException wenn die {@code id} fehlt, der Name ungültig ist, der Typ, die Schreibregel oder der
	 *         Anzeigename fehlt, ein Zwilling oder das Suchgewicht nicht passt oder ein Recht nicht existiert
	 * @throws EntityNotFoundException wenn es das Feld nicht gibt
	 * @throws DuplicateKeyException wenn ein anderes Feld des Kerns den Namen schon hat
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public SolrField changeSolrField(SolrField changedSolrField) {
		Long id = changedSolrField.getId();
		Helper.requireNotNull(id, "id");
		SolrField existingSolrField = doGetSolrField(id);
		String solrCoreKey = existingSolrField.getSolrCoreKey();
		boolean solrReferenceField = existingSolrField.isSolrReferenceField();
		if (solrReferenceField) {
			return doChangeSolrReferenceFieldReadersAndSearchWeight(existingSolrField, changedSolrField);
		}

		String changedName = changedSolrField.getName();
		Helper.requireValidSolrFieldName(changedName);
		requireSolrFieldNameWithoutTwinSuffix(changedName);
		boolean nameTakenByOtherSolrField = solrFieldRepository.existsBySolrCoreKeyAndNameAndIdNot(solrCoreKey,
				changedName, id);
		if (nameTakenByOtherSolrField) {
			throw new DuplicateKeyException("Der Kern " + solrCoreKey + " hat schon ein Feld " + changedName + ".");
		}
		SolrFieldType changedType = changedSolrField.getType();
		Helper.requireNotNull(changedType, "type");

		existingSolrField.setName(changedName);
		existingSolrField.setType(changedType);
		copyChangeableValues(changedSolrField, existingSolrField);
		SolrField savedSolrField = solrFieldRepository.save(existingSolrField);
		reloadSolrFieldsAfterCommit(solrCoreKey);
		return savedSolrField;
	}

	/**
	 * UPDATE: Die neue Reihenfolge der Felder eines Kerns nach Drag and Drop im Kern-Tab. Das erste Feld bekommt Platz 1,
	 * das nächste 2 usw. Auch die Zeilen der Referenzen bekommen so ihren Platz in diesem Kern.
	 *
	 * @param solrFieldNamesInOrder jedes Feld des Kerns genau einmal, von oben nach unten
	 * @return die Felder des Kerns in der neuen Reihenfolge
	 * @throws IllegalArgumentException wenn der Kern fehlt oder ein Name fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<SolrField> changeSolrFieldListingPositions(String solrCoreKey, List<String> solrFieldNamesInOrder) {
		Helper.requireNotNull(solrCoreKey, "solrCoreKey");
		List<SolrField> solrFieldsOfCore = solrFieldRepository.findAllBySolrCoreKey(solrCoreKey);
		List<String> existingSolrFieldNames = new ArrayList<>();
		for (SolrField solrField : solrFieldsOfCore) {
			String existingSolrFieldName = solrField.getName();
			existingSolrFieldNames.add(existingSolrFieldName);
		}
		Helper.requireCompleteKeyOrder(solrFieldNamesInOrder, existingSolrFieldNames, "solrFieldNamesInOrder");
		SolrField[] reorderedSolrFields = new SolrField[solrFieldsOfCore.size()];
		for (SolrField solrField : solrFieldsOfCore) {
			String solrFieldName = solrField.getName();
			int newIndex = solrFieldNamesInOrder.indexOf(solrFieldName);
			int newListingPosition = newIndex + 1;
			// verwaltet in dieser Transaktion: Hibernate schreibt die Änderung beim Commit (Dirty Checking)
			solrField.setListingPosition(newListingPosition);
			reorderedSolrFields[newIndex] = solrField;
		}
		solrFieldRepository.saveAll(solrFieldsOfCore);
		reloadSolrFieldsAfterCommit(solrCoreKey);
		return List.of(reorderedSolrFields);
	}

	/**
	 * DELETE: Löscht ein Feld aus der Definition. In Solr bleibt es stehen, der Abgleich meldet es als „nur in Solr“.
	 *
	 * @throws IllegalArgumentException wenn die {@code id} fehlt oder es die Zeile einer Referenz ist (die verschwindet
	 *         nur mit der Referenz)
	 * @throws EntityNotFoundException wenn es das Feld nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteSolrField(Long id) {
		Helper.requireNotNull(id, "id");
		SolrField existingSolrField = doGetSolrField(id);
		boolean solrReferenceField = existingSolrField.isSolrReferenceField();
		if (solrReferenceField) {
			throw new IllegalArgumentException("Das Feld " + existingSolrField.getName()
					+ " gehört zu einer Referenz und verschwindet nur mit ihr.");
		}
		String solrCoreKey = existingSolrField.getSolrCoreKey();
		solrFieldRepository.delete(existingSolrField);
		reloadSolrFieldsAfterCommit(solrCoreKey);
	}

	/**
	 * Prüft den Key einer neuen Referenz: Feldnamen-Regel, keine Endung eines Zwillings, und kein Kern hat schon ein Feld
	 * mit diesem Namen.
	 *
	 * @throws IllegalArgumentException wenn der Name die Regel verletzt
	 * @throws DuplicateKeyException wenn es den Namen schon gibt
	 */
	@Transactional(readOnly = true)
	public void requireAvailableSolrReferenceFieldName(String solrReferenceKey) {
		Helper.requireValidSolrFieldName(solrReferenceKey);
		requireSolrFieldNameWithoutTwinSuffix(solrReferenceKey);
		boolean nameTaken = solrFieldRepository.existsByName(solrReferenceKey);
		if (nameTaken) {
			throw new DuplicateKeyException("Ein Kern hat schon ein Feld " + solrReferenceKey + ".");
		}
	}

	/**
	 * CREATE: Legt die Zeile einer Referenz in jedem Kern an, der sie noch nicht hat, mit den festen Einstellungen aus
	 * {@code gebiter.solr.reference-field.*}, ohne Leserolle. Für eine neue Referenz und beim Start (ein neuer Kern in der
	 * YAML bekommt so alle Referenzen).
	 *
	 * @return wie viele Zeilen neu angelegt wurden
	 */
	@Transactional
	public int createMissingSolrReferenceFields(SolrReference solrReference) {
		String solrReferenceKey = solrReference.getKey();
		List<String> allSolrCoreKeys = solrCoreService.getAllSolrCoreKey();
		int createdSolrReferenceFieldCount = 0;
		for (String solrCoreKey : allSolrCoreKeys) {
			boolean solrReferenceFieldExists = solrFieldRepository.existsBySolrCoreKeyAndName(solrCoreKey,
					solrReferenceKey);
			if (solrReferenceFieldExists) {
				continue;
			}
			SolrField solrReferenceField = createSolrReferenceField(solrCoreKey, solrReference);
			solrFieldRepository.save(solrReferenceField);
			createdSolrReferenceFieldCount = createdSolrReferenceFieldCount + 1;
		}
		if (createdSolrReferenceFieldCount > 0) {
			reloadSolrFieldsAfterCommit(null);
		}
		return createdSolrReferenceFieldCount;
	}

	/** UPDATE: Übernimmt Anzeigename, Beschreibung und Platz einer geänderten Referenz in ihre Zeilen. */
	@Transactional
	public void changeSolrReferenceFields(SolrReference changedSolrReference) {
		String solrReferenceKey = changedSolrReference.getKey();
		List<SolrField> solrReferenceFields = solrFieldRepository.findAllBySolrReferenceKey(solrReferenceKey);
		Map<String, String> displayName = changedSolrReference.getDisplayName();
		Map<String, String> description = changedSolrReference.getDescription();
		int listingPosition = changedSolrReference.getListingPosition();
		for (SolrField solrReferenceField : solrReferenceFields) {
			solrReferenceField.setDisplayName(displayName);
			solrReferenceField.setDescription(description);
			solrReferenceField.setListingPosition(listingPosition);
		}
		solrFieldRepository.saveAll(solrReferenceFields);
		reloadSolrFieldsAfterCommit(null);
	}

	/** DELETE: Löscht die Zeilen einer Referenz in allen Kernen. In Solr bleiben die Felder stehen. */
	@Transactional
	public void deleteSolrReferenceFields(String solrReferenceKey) {
		List<SolrField> solrReferenceFields = solrFieldRepository.findAllBySolrReferenceKey(solrReferenceKey);
		solrFieldRepository.deleteAll(solrReferenceFields);
		reloadSolrFieldsAfterCommit(null);
	}

	/** Die Zeile einer Referenz in einem Kern, mit den festen Einstellungen. */
	private SolrField createSolrReferenceField(String solrCoreKey, SolrReference solrReference) {
		String solrReferenceKey = solrReference.getKey();
		SolrFieldType referenceFieldType = solrConfig.referenceFieldType();
		SolrField solrReferenceField = new SolrField(solrCoreKey, solrReferenceKey, referenceFieldType);
		boolean indexed = solrConfig.referenceFieldIndexed();
		boolean stored = solrConfig.referenceFieldStored();
		boolean multiValued = solrConfig.referenceFieldMultiValued();
		boolean docValues = solrConfig.referenceFieldDocValues();
		boolean suggestTwin = solrConfig.referenceFieldSuggestTwin();
		boolean clientValueAccepted = solrConfig.referenceFieldClientValueAccepted();
		int startSearchWeight = solrConfig.referenceFieldStartSearchWeight();
		Map<String, String> displayName = solrReference.getDisplayName();
		Map<String, String> description = solrReference.getDescription();
		int listingPosition = solrReference.getListingPosition();
		solrReferenceField.setIndexed(indexed);
		solrReferenceField.setStored(stored);
		solrReferenceField.setMultiValued(multiValued);
		solrReferenceField.setDocValues(docValues);
		solrReferenceField.setRequired(false);
		solrReferenceField.setSuggestTwin(suggestTwin);
		solrReferenceField.setNgramTwin(false);
		solrReferenceField.setClientValueAccepted(clientValueAccepted);
		solrReferenceField.setSearchWeight(startSearchWeight);
		solrReferenceField.setReaderAccessRoleKey(null);
		solrReferenceField.setDisplayName(displayName);
		solrReferenceField.setDescription(description);
		solrReferenceField.setListingPosition(listingPosition);
		solrReferenceField.setSolrReferenceKey(solrReferenceKey);
		return solrReferenceField;
	}

	/** An der Zeile einer Referenz: nur Leserollen und Suchgewicht, alles andere steht fest. */
	private SolrField doChangeSolrReferenceFieldReadersAndSearchWeight(SolrField existingSolrReferenceField,
			SolrField changedSolrField) {
		String readerAccessRoleKey = changedSolrField.getReaderAccessRoleKey();
		requireExistingAccessRoleKeyOrNull(readerAccessRoleKey);
		int searchWeight = changedSolrField.getSearchWeight();
		boolean indexed = existingSolrReferenceField.isIndexed();
		requireValidSearchWeight(searchWeight, indexed);
		existingSolrReferenceField.setReaderAccessRoleKey(readerAccessRoleKey);
		existingSolrReferenceField.setSearchWeight(searchWeight);
		SolrField savedSolrField = solrFieldRepository.save(existingSolrReferenceField);
		String solrCoreKey = existingSolrReferenceField.getSolrCoreKey();
		reloadSolrFieldsAfterCommit(solrCoreKey);
		return savedSolrField;
	}

	/**
	 * Übernimmt die Werte, die beim Anlegen und Ändern gleich behandelt werden: die Schalter, die Zwillinge, die Rechte
	 * zum Lesen, die Schreibregel, das Suchgewicht, Anzeigename, Beschreibung und Position. Prüft sie dabei; die Zwillinge
	 * gegen den Typ, der im Ziel schon steht.
	 */
	private void copyChangeableValues(SolrField sourceSolrField, SolrField targetSolrField) {
		Map<String, String> displayName = sourceSolrField.getDisplayName();
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		String readerAccessRoleKey = sourceSolrField.getReaderAccessRoleKey();
		requireExistingAccessRoleKeyOrNull(readerAccessRoleKey);
		boolean clientValueAccepted = sourceSolrField.isClientValueAccepted();
		SolrFieldType type = targetSolrField.getType();
		boolean suggestTwin = sourceSolrField.isSuggestTwin();
		requireSuggestTwinAllowed(suggestTwin, type);
		boolean ngramTwin = sourceSolrField.isNgramTwin();
		requireNgramTwinAllowed(ngramTwin, type);
		boolean indexed = sourceSolrField.isIndexed();
		int searchWeight = sourceSolrField.getSearchWeight();
		requireValidSearchWeight(searchWeight, indexed);
		boolean stored = sourceSolrField.isStored();
		boolean multiValued = sourceSolrField.isMultiValued();
		boolean docValues = sourceSolrField.isDocValues();
		boolean required = sourceSolrField.isRequired();
		Map<String, String> description = sourceSolrField.getDescription();
		int listingPosition = sourceSolrField.getListingPosition();

		targetSolrField.setIndexed(indexed);
		targetSolrField.setStored(stored);
		targetSolrField.setMultiValued(multiValued);
		targetSolrField.setDocValues(docValues);
		targetSolrField.setRequired(required);
		targetSolrField.setSuggestTwin(suggestTwin);
		targetSolrField.setNgramTwin(ngramTwin);
		targetSolrField.setClientValueAccepted(clientValueAccepted);
		targetSolrField.setSearchWeight(searchWeight);
		targetSolrField.setReaderAccessRoleKey(readerAccessRoleKey);
		targetSolrField.setDisplayName(displayName);
		targetSolrField.setDescription(description);
		targetSolrField.setListingPosition(listingPosition);
	}

	/**
	 * Ein Feldname darf nicht auf die Endung eines Zwillings enden, sonst stieße er später in Solr mit dem Zwilling eines
	 * anderen Feldes zusammen.
	 *
	 * @throws IllegalArgumentException wenn er so endet
	 */
	private void requireSolrFieldNameWithoutTwinSuffix(String name) {
		String suggestTwinSuffix = solrConfig.suggestTwinSuffix();
		String ngramTwinSuffix = solrConfig.ngramTwinSuffix();
		boolean endsWithSuggestTwinSuffix = name.endsWith(suggestTwinSuffix);
		boolean endsWithNgramTwinSuffix = name.endsWith(ngramTwinSuffix);
		if (endsWithSuggestTwinSuffix || endsWithNgramTwinSuffix) {
			throw new IllegalArgumentException("Ein Feldname darf nicht auf " + suggestTwinSuffix + " oder "
					+ ngramTwinSuffix + " enden, so heißen die Zwillinge.");
		}
	}

	/** @throws IllegalArgumentException wenn der Zwilling für die Vervollständigung an, der Typ ihn aber nicht erlaubt */
	private void requireSuggestTwinAllowed(boolean suggestTwin, SolrFieldType type) {
		boolean suggestTwinAllowed = type.isSuggestTwinAllowed();
		if (suggestTwin && !suggestTwinAllowed) {
			throw new IllegalArgumentException("Ein Feld vom Typ " + type
					+ " bekommt keinen Zwilling für die Vervollständigung, nur STRING, LONG und DOUBLE.");
		}
	}

	/** @throws IllegalArgumentException wenn der Ngram-Zwilling an, der Typ ihn aber nicht erlaubt */
	private void requireNgramTwinAllowed(boolean ngramTwin, SolrFieldType type) {
		boolean ngramTwinAllowed = type.isNgramTwinAllowed();
		if (ngramTwin && !ngramTwinAllowed) {
			throw new IllegalArgumentException("Ein Feld vom Typ " + type
					+ " bekommt keinen Ngram-Zwilling, nur STRING, TEXT_EDGE und TEXT_SUCHE.");
		}
	}

	/**
	 * Das Suchgewicht liegt im Bereich {@code gebiter.solr.search-weight.min} bis {@code max} (-1 nicht durchsucht, 0
	 * durchsucht ohne Punkte, sonst der Faktor). Ab 0 braucht das Feld {@code indexed}, sonst hat Solr nichts zum
	 * Durchsuchen.
	 *
	 * @throws IllegalArgumentException wenn eins davon nicht stimmt
	 */
	private void requireValidSearchWeight(int searchWeight, boolean indexed) {
		int searchWeightMin = solrConfig.searchWeightMin();
		int searchWeightMax = solrConfig.searchWeightMax();
		boolean outsideRange = searchWeight < searchWeightMin || searchWeight > searchWeightMax;
		if (outsideRange) {
			throw new IllegalArgumentException("Das Suchgewicht liegt zwischen " + searchWeightMin + " (nicht durchsucht) "
					+ "und " + searchWeightMax + ".");
		}
		boolean searchedWithoutIndex = searchWeight >= 0 && !indexed;
		if (searchedWithoutIndex) {
			throw new IllegalArgumentException("Durchsucht werden kann nur ein Feld mit indexed.");
		}
	}

	/**
	 * Das Recht für „Wer liest“ muss es geben. {@code null} ist erlaubt: Dann bekommt kein User das Feld.
	 *
	 * @throws IllegalArgumentException wenn es das Recht nicht gibt
	 */
	private void requireExistingAccessRoleKeyOrNull(String accessRoleKey) {
		if (accessRoleKey == null) {
			return;
		}
		boolean accessRoleExists = accessRoleService.existsAccessRole(accessRoleKey);
		if (!accessRoleExists) {
			throw new IllegalArgumentException("Das Recht " + accessRoleKey + " gibt es nicht.");
		}
	}

	/**
	 * Lädt die Kopie im Speicher neu, sobald die laufende Transaktion festgeschrieben ist, und meldet danach den Kern zum
	 * Abgleich mit Solr. Wird sie zurückgerollt, bleibt alles, wie es ist. Ohne Transaktion sofort.
	 *
	 * @param changedSolrCoreKey der geänderte Kern; {@code null}: alle Kerne (Referenzen)
	 */
	private void reloadSolrFieldsAfterCommit(String changedSolrCoreKey) {
		boolean insideTransaction = TransactionSynchronizationManager.isSynchronizationActive();
		if (!insideTransaction) {
			reloadSolrFieldsAndPublishChange(changedSolrCoreKey);
			return;
		}
		TransactionSynchronization reloadAfterCommit = new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				reloadSolrFieldsAndPublishChange(changedSolrCoreKey);
			}
		};
		TransactionSynchronizationManager.registerSynchronization(reloadAfterCommit);
	}

	private void reloadSolrFieldsAndPublishChange(String changedSolrCoreKey) {
		reloadSolrFields();
		SolrDefinitionChangedEvent solrDefinitionChangedEvent = new SolrDefinitionChangedEvent(changedSolrCoreKey);
		applicationEventPublisher.publishEvent(solrDefinitionChangedEvent);
	}

	/** Liest alle Felder aus Postgres und ersetzt die Kopie im Speicher als Ganzes. */
	private void reloadSolrFields() {
		List<SolrField> allSolrFields = solrFieldRepository.findAllByOrderBySolrCoreKeyAscListingPositionAscNameAsc();
		Map<String, Map<String, SolrField>> loadedSolrFields = new LinkedHashMap<>();
		for (SolrField solrField : allSolrFields) {
			String solrCoreKey = solrField.getSolrCoreKey();
			Map<String, SolrField> solrFieldsByName = loadedSolrFields.get(solrCoreKey);
			if (solrFieldsByName == null) {
				solrFieldsByName = new LinkedHashMap<>();
				loadedSolrFields.put(solrCoreKey, solrFieldsByName);
			}
			String name = solrField.getName();
			solrFieldsByName.put(name, solrField);
		}
		Map<String, Map<String, SolrField>> unchangeableSolrFields = new LinkedHashMap<>();
		for (Map.Entry<String, Map<String, SolrField>> loadedCoreEntry : loadedSolrFields.entrySet()) {
			String solrCoreKey = loadedCoreEntry.getKey();
			Map<String, SolrField> solrFieldsByName = loadedCoreEntry.getValue();
			Map<String, SolrField> unchangeableSolrFieldsByName = Collections.unmodifiableMap(solrFieldsByName);
			unchangeableSolrFields.put(solrCoreKey, unchangeableSolrFieldsByName);
		}
		solrFieldsByNameBySolrCoreKey = Collections.unmodifiableMap(unchangeableSolrFields);
		int loadedSolrFieldCount = allSolrFields.size();
		int loadedSolrCoreCount = unchangeableSolrFields.size();
		LOGGER.info("Solr-Felder in den Speicher geladen: {} Felder in {} Kernen.", loadedSolrFieldCount,
				loadedSolrCoreCount);
	}

	private SolrField doGetSolrField(Long id) {
		Optional<SolrField> foundSolrField = solrFieldRepository.findById(id);
		if (foundSolrField.isEmpty()) {
			throw new EntityNotFoundException("Es gibt kein Feld mit der id " + id + ".");
		}
		return foundSolrField.get();
	}
}
