package de.gebiter.knowledge.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.params.CommonParams;
import org.apache.solr.common.params.ModifiableSolrParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import de.gebiter.knowledge.KnowledgeSolrFieldNames;
import de.gebiter.knowledge.dto.KnowledgePageResolveRequest;
import de.gebiter.knowledge.dto.KnowledgeSolrFieldNameSet;
import de.gebiter.knowledge.model.KnowledgePageStatus;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.solr.service.SolrDocumentFieldService;
import de.gebiter.solr.service.SolrDocumentService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Die Seiten der Wissensdatenbank: je Seite und Sprache ein Dokument im Solr-Kern {@code KNOWLEDGE}
 * ({@code gebiter.knowledge.solr-core-key}). „Mini-Wikipedia“ (Nutzer 2026-11-27): Nur der Admin schreibt, alle dürfen
 * lesen, auch ohne Anmeldung, aber nur veröffentlichte Seiten.
 * <p>
 * Keine Sonderlösung neben dem Kern FILE (Nutzer 2026-11-27): Die Felder des Dokuments führt der SolrManager. Eine Seite
 * geht als Feld-Map zum Client und kommt als Feld-Map zurück; welche Felder ein Leser bekommt, entscheidet „Wer liest“
 * je Feld, welche der Admin setzen darf, „vom Client“ ({@link SolrDocumentFieldService}). Ein Besucher ohne Anmeldung
 * bekommt genau die Felder, deren „Wer liest“ auf „jeder“ steht. Ein neues Feld im SolrManager geht damit ohne Änderung
 * am Code mit.
 * <p>
 * Dieser Service kennt nur die Felder, an denen Regeln hängen: Platz in der Gliederung
 * ({@link KnowledgeSectionService}), {@code pageKey} (eindeutig je Kapitel und Sprache), Titel, Inhalt (ein JSON-Objekt,
 * das nie durchsucht wird), Status, Schlagwörter, Verweise und was das Backend selbst setzt.
 * <p>
 * Doku: {@code docu/solr-cores/KNOWLEDGE.md}.
 */
@Service
public class KnowledgePageService {

	private final SolrDocumentService solrDocumentService;

	private final SolrDocumentFieldService solrDocumentFieldService;

	private final KnowledgeSolrFieldNames knowledgeSolrFieldNames;

	private final KnowledgeSectionService knowledgeSectionService;

	private final CurrentUsersProvider currentUsersProvider;

	private final ObjectMapper objectMapper;

	private final String solrCoreKey;

	/** In dieser Fassung des Formats gilt der Inhalt als geschrieben ({@code gebiter.knowledge.content-format-version}). */
	private final long contentFormatVersion;

	private final int contentMaxCharacters;

	private final int resolveMaxRows;

	/** Die Sprachen, in denen es Seiten geben darf ({@code gebiter.language.active-codes}). */
	private final List<String> activeLanguageCodes;

	public KnowledgePageService(SolrDocumentService solrDocumentService,
			SolrDocumentFieldService solrDocumentFieldService, KnowledgeSolrFieldNames knowledgeSolrFieldNames,
			KnowledgeSectionService knowledgeSectionService, CurrentUsersProvider currentUsersProvider,
			ObjectMapper objectMapper, @Value("${gebiter.knowledge.solr-core-key}") String solrCoreKey,
			@Value("${gebiter.knowledge.content-format-version}") long contentFormatVersion,
			@Value("${gebiter.knowledge.content-max-characters}") int contentMaxCharacters,
			@Value("${gebiter.knowledge.resolve-max-rows}") int resolveMaxRows,
			@Value("${gebiter.language.active-codes}") List<String> activeLanguageCodes) {
		this.solrDocumentService = solrDocumentService;
		this.solrDocumentFieldService = solrDocumentFieldService;
		this.knowledgeSolrFieldNames = knowledgeSolrFieldNames;
		this.knowledgeSectionService = knowledgeSectionService;
		this.currentUsersProvider = currentUsersProvider;
		this.objectMapper = objectMapper;
		this.solrCoreKey = solrCoreKey;
		this.contentFormatVersion = contentFormatVersion;
		this.contentMaxCharacters = contentMaxCharacters;
		this.resolveMaxRows = resolveMaxRows;
		this.activeLanguageCodes = activeLanguageCodes;
	}

	/**
	 * CREATE: Legt eine Seite an, am Ende ihres Kapitels. Übernommen werden die Felder mit „vom Client“. Das Backend
	 * vergibt {@code pageGuid} und {@code id}, trägt den angemeldeten Admin als Autor ein und setzt die Zeitpunkte. Ohne
	 * Status ist die Seite ein Entwurf.
	 *
	 * @param rawClientFieldValues das JSON des Clients, jedes Feld unter seinem Solr-Namen
	 * @return die Seite, so wie der Admin sie lesen darf
	 * @throws IllegalArgumentException wenn ein Wert fehlt oder nicht passt oder es das Kapitel bzw. Unterkapitel nicht gibt
	 * @throws DuplicateKeyException wenn das Kapitel in dieser Sprache schon eine Seite mit dem {@code pageKey} hat
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, Object> createKnowledgePage(Map<String, Object> rawClientFieldValues) {
		Helper.requireNotNull(rawClientFieldValues, "fieldValuesByFieldName");
		Map<String, Object> convertedFieldValues = solrDocumentFieldService.convertClientFieldValues(solrCoreKey,
				rawClientFieldValues);
		Map<String, Object> checkedFieldValues = createCheckedFieldValues(convertedFieldValues);
		requireFreePageKey(checkedFieldValues, null);

		String languageFieldName = knowledgeSolrFieldNames.getLanguage();
		String language = readText(checkedFieldValues, languageFieldName);
		UUID pageGuid = Helper.createUuidVersion7();
		String pageGuidText = pageGuid.toString();
		String id = pageGuidText + "_" + language;
		long knowledgePageCountOfChapter = countKnowledgePagesOfChapter(checkedFieldValues);
		long listingPosition = knowledgePageCountOfChapter + 1;
		UUID authorUsersGuid = currentUsersProvider.currentUsersGuid();
		String authorUsersGuidText = authorUsersGuid.toString();
		Date now = new Date();

		// Ein neues Dokument bekommt nur die Felder, die einen Wert haben; was das Backend setzt, gilt immer
		Map<String, Object> fieldValuesByFieldName = new LinkedHashMap<>();
		for (Map.Entry<String, Object> checkedFieldValue : checkedFieldValues.entrySet()) {
			Object fieldValue = checkedFieldValue.getValue();
			if (fieldValue != null) {
				String fieldName = checkedFieldValue.getKey();
				fieldValuesByFieldName.put(fieldName, fieldValue);
			}
		}
		String idFieldName = knowledgeSolrFieldNames.getId();
		String pageGuidFieldName = knowledgeSolrFieldNames.getPageGuid();
		String listingPositionFieldName = knowledgeSolrFieldNames.getListingPosition();
		String contentFormatVersionFieldName = knowledgeSolrFieldNames.getContentFormatVersion();
		String authorUsersGuidFieldName = knowledgeSolrFieldNames.getAuthorUsersGuid();
		String createdAtFieldName = knowledgeSolrFieldNames.getCreatedAt();
		String lastChangedAtFieldName = knowledgeSolrFieldNames.getLastChangedAt();
		fieldValuesByFieldName.put(idFieldName, id);
		fieldValuesByFieldName.put(pageGuidFieldName, pageGuidText);
		fieldValuesByFieldName.put(listingPositionFieldName, listingPosition);
		fieldValuesByFieldName.put(contentFormatVersionFieldName, contentFormatVersion);
		fieldValuesByFieldName.put(authorUsersGuidFieldName, authorUsersGuidText);
		fieldValuesByFieldName.put(createdAtFieldName, now);
		fieldValuesByFieldName.put(lastChangedAtFieldName, now);
		solrDocumentService.createSolrDocument(solrCoreKey, fieldValuesByFieldName);

		SolrDocument createdSolrDocument = doGetSolrDocument(id);
		List<String> readableFieldNames = getReadableFieldNamesForCurrentUsers();
		return toClientDocument(createdSolrDocument, readableFieldNames);
	}

	/** READ: Wie die Felder einer Seite im Kern heißen, für das Frontend. Für jeden, auch ohne Anmeldung. */
	public KnowledgeSolrFieldNameSet getKnowledgeSolrFieldNameSet() {
		return knowledgeSolrFieldNames.toKnowledgeSolrFieldNameSet();
	}

	/**
	 * READ: Eine Seite samt Inhalt über ihre id ({@code pageGuid_language}), in jedem Status, mit den Feldern, die der
	 * Admin lesen darf.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, Object> getKnowledgePage(String knowledgePageId) {
		Helper.requireNotBlank(knowledgePageId, "knowledgePageId");
		SolrDocument foundSolrDocument = doGetSolrDocument(knowledgePageId);
		List<String> readableFieldNames = getReadableFieldNamesForCurrentUsers();
		return toClientDocument(foundSolrDocument, readableFieldNames);
	}

	/**
	 * READ: Eine veröffentlichte Seite samt Inhalt über ihre id, für jeden, auch ohne Anmeldung, mit den Feldern, die der
	 * Leser lesen darf (ohne Anmeldung: „Wer liest“ = jeder). Ein Entwurf und eine gelöschte Seite gelten hier als nicht
	 * vorhanden.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt oder sie nicht veröffentlicht ist
	 */
	public Map<String, Object> getPublishedKnowledgePage(String knowledgePageId) {
		Helper.requireNotBlank(knowledgePageId, "knowledgePageId");
		SolrDocument foundSolrDocument = doGetSolrDocument(knowledgePageId);
		String statusFieldName = knowledgeSolrFieldNames.getStatus();
		String statusName = readText(foundSolrDocument, statusFieldName);
		String publishedStatusName = KnowledgePageStatus.PUBLISHED.name();
		boolean published = publishedStatusName.equals(statusName);
		if (!published) {
			throw createKnowledgePageNotFoundException(knowledgePageId);
		}
		List<String> readableFieldNames = getReadableFieldNamesForCurrentUsers();
		return toClientDocument(foundSolrDocument, readableFieldNames);
	}

	/**
	 * READ: Löst Seiten auf: alle, die auf die genannten Werte passen, in jedem Status, nach ihrem Platz sortiert, mit
	 * den Feldern, die der Admin lesen darf, aber ohne den Inhalt. Für die Liste im Wissensmanager.
	 *
	 * @throws IllegalArgumentException wenn ein genannter Wert kein Key bzw. keine aktive Sprache ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public List<Map<String, Object>> resolveKnowledgePages(KnowledgePageResolveRequest resolveRequest) {
		return doResolveKnowledgePages(resolveRequest, false);
	}

	/**
	 * READ: Löst veröffentlichte Seiten auf, für jeden, auch ohne Anmeldung: alle, die auf die genannten Werte passen,
	 * nach ihrem Platz sortiert, mit den Feldern, die der Leser lesen darf, aber ohne den Inhalt. Für die Übersicht der
	 * Wissensdatenbank und um eine Seite über ihre Adresse zu finden; den Inhalt holt danach
	 * {@link #getPublishedKnowledgePage}.
	 *
	 * @throws IllegalArgumentException wenn ein genannter Wert kein Key bzw. keine aktive Sprache ist
	 */
	public List<Map<String, Object>> resolvePublishedKnowledgePages(KnowledgePageResolveRequest resolveRequest) {
		return doResolveKnowledgePages(resolveRequest, true);
	}

	/**
	 * UPDATE: Ändert eine Seite. Nur die genannten Felder, soweit sie „vom Client“ tragen; ein leerer Wert nimmt das
	 * Feld heraus. So lässt sich eine Seite veröffentlichen, weich löschen ({@code status}), umbenennen ({@code pageKey})
	 * oder verschieben (Keys der Gliederung; in einem anderen Kapitel kommt sie ans Ende). {@code pageGuid} und Sprache
	 * bleiben, sie bestimmen die id. Geprüft wird der Stand, der sich ergibt: Eine Seite ohne Titel oder mit einem
	 * {@code pageKey}, den das Kapitel schon hat, entsteht auch durch Ändern nicht.
	 *
	 * @return die Seite, so wie der Admin sie lesen darf
	 * @throws IllegalArgumentException wenn die id fehlt, ein Wert nicht passt oder es das Kapitel bzw. Unterkapitel nicht gibt
	 * @throws EntityNotFoundException wenn es die Seite nicht gibt
	 * @throws DuplicateKeyException wenn das Kapitel in dieser Sprache schon eine andere Seite mit dem {@code pageKey} hat
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, Object> changeKnowledgePage(String knowledgePageId, Map<String, Object> rawClientFieldValues) {
		Helper.requireNotBlank(knowledgePageId, "id");
		Helper.requireNotNull(rawClientFieldValues, "fieldValuesByFieldName");
		SolrDocument existingSolrDocument = doGetSolrDocument(knowledgePageId);

		// änderbar ist, was „vom Client“ trägt, außer dem, was das Backend setzt oder was die id bestimmt
		Set<String> clientValueAcceptedFieldNames = solrDocumentFieldService
				.getClientValueAcceptedSolrFieldNames(solrCoreKey);
		Set<String> changeableFieldNames = new LinkedHashSet<>(clientValueAcceptedFieldNames);
		Set<String> backendOwnedFieldNames = getBackendOwnedFieldNames();
		changeableFieldNames.removeAll(backendOwnedFieldNames);
		String languageFieldName = knowledgeSolrFieldNames.getLanguage();
		changeableFieldNames.remove(languageFieldName);

		Map<String, Object> convertedFieldValues = solrDocumentFieldService.convertClientFieldValues(solrCoreKey,
				rawClientFieldValues);
		Set<String> changedFieldNames = new LinkedHashSet<>();
		for (String rawFieldName : rawClientFieldValues.keySet()) {
			boolean changeable = changeableFieldNames.contains(rawFieldName);
			if (changeable) {
				changedFieldNames.add(rawFieldName);
			}
		}
		List<String> readableFieldNames = getReadableFieldNamesForCurrentUsers();
		if (changedFieldNames.isEmpty()) {
			return toClientDocument(existingSolrDocument, readableFieldNames);
		}

		// der Stand, der sich ergibt: die Seite, wie sie ist, darüber die genannten Felder (ohne Wert: heraus)
		Map<String, Object> resultingFieldValues = createFieldValuesWithRules(existingSolrDocument);
		for (String changedFieldName : changedFieldNames) {
			Object convertedFieldValue = convertedFieldValues.get(changedFieldName);
			resultingFieldValues.put(changedFieldName, convertedFieldValue);
		}
		Map<String, Object> checkedFieldValues = createCheckedFieldValues(resultingFieldValues);
		requireFreePageKey(checkedFieldValues, knowledgePageId);

		Map<String, Object> newValuesByFieldName = new LinkedHashMap<>();
		for (String changedFieldName : changedFieldNames) {
			Object checkedFieldValue = checkedFieldValues.get(changedFieldName);
			newValuesByFieldName.put(changedFieldName, checkedFieldValue);
		}
		String rubricKeyFieldName = knowledgeSolrFieldNames.getRubricKey();
		String chapterKeyFieldName = knowledgeSolrFieldNames.getChapterKey();
		String existingRubricKey = readText(existingSolrDocument, rubricKeyFieldName);
		String existingChapterKey = readText(existingSolrDocument, chapterKeyFieldName);
		String resultingRubricKey = readText(checkedFieldValues, rubricKeyFieldName);
		String resultingChapterKey = readText(checkedFieldValues, chapterKeyFieldName);
		boolean sameRubric = Objects.equals(resultingRubricKey, existingRubricKey);
		boolean sameChapter = Objects.equals(resultingChapterKey, existingChapterKey);
		boolean chapterChanged = !sameRubric || !sameChapter;
		if (chapterChanged) {
			long knowledgePageCountOfChapter = countKnowledgePagesOfChapter(checkedFieldValues);
			long listingPosition = knowledgePageCountOfChapter + 1;
			String listingPositionFieldName = knowledgeSolrFieldNames.getListingPosition();
			newValuesByFieldName.put(listingPositionFieldName, listingPosition);
		}
		String contentFieldName = knowledgeSolrFieldNames.getContent();
		boolean contentChanged = changedFieldNames.contains(contentFieldName);
		if (contentChanged) {
			String contentFormatVersionFieldName = knowledgeSolrFieldNames.getContentFormatVersion();
			newValuesByFieldName.put(contentFormatVersionFieldName, contentFormatVersion);
		}
		Date now = new Date();
		String lastChangedAtFieldName = knowledgeSolrFieldNames.getLastChangedAt();
		newValuesByFieldName.put(lastChangedAtFieldName, now);
		String idFieldName = knowledgeSolrFieldNames.getId();
		solrDocumentService.setSolrDocumentFieldValues(solrCoreKey, knowledgePageId, idFieldName, newValuesByFieldName);

		SolrDocument changedSolrDocument = doGetSolrDocument(knowledgePageId);
		return toClientDocument(changedSolrDocument, readableFieldNames);
	}

	/** Die Felder, die nur das Backend setzt, gleich was in der Feldtabelle bei „vom Client“ steht. */
	private Set<String> getBackendOwnedFieldNames() {
		String idFieldName = knowledgeSolrFieldNames.getId();
		String pageGuidFieldName = knowledgeSolrFieldNames.getPageGuid();
		String listingPositionFieldName = knowledgeSolrFieldNames.getListingPosition();
		String contentFormatVersionFieldName = knowledgeSolrFieldNames.getContentFormatVersion();
		String authorUsersGuidFieldName = knowledgeSolrFieldNames.getAuthorUsersGuid();
		String createdAtFieldName = knowledgeSolrFieldNames.getCreatedAt();
		String lastChangedAtFieldName = knowledgeSolrFieldNames.getLastChangedAt();
		Set<String> backendOwnedFieldNames = new LinkedHashSet<>();
		backendOwnedFieldNames.add(idFieldName);
		backendOwnedFieldNames.add(pageGuidFieldName);
		backendOwnedFieldNames.add(listingPositionFieldName);
		backendOwnedFieldNames.add(contentFormatVersionFieldName);
		backendOwnedFieldNames.add(authorUsersGuidFieldName);
		backendOwnedFieldNames.add(createdAtFieldName);
		backendOwnedFieldNames.add(lastChangedAtFieldName);
		return backendOwnedFieldNames;
	}

	/** Die Werte der Felder einer vorhandenen Seite, an denen Regeln hängen: der Ausgang, wenn eine Seite geändert wird. */
	private Map<String, Object> createFieldValuesWithRules(SolrDocument solrDocument) {
		String languageFieldName = knowledgeSolrFieldNames.getLanguage();
		String rubricKeyFieldName = knowledgeSolrFieldNames.getRubricKey();
		String chapterKeyFieldName = knowledgeSolrFieldNames.getChapterKey();
		String subChapterKeyFieldName = knowledgeSolrFieldNames.getSubChapterKey();
		String pageKeyFieldName = knowledgeSolrFieldNames.getPageKey();
		String titleFieldName = knowledgeSolrFieldNames.getTitle();
		String contentFieldName = knowledgeSolrFieldNames.getContent();
		String statusFieldName = knowledgeSolrFieldNames.getStatus();
		String tagsFieldName = knowledgeSolrFieldNames.getTags();
		String relatedPageGuidsFieldName = knowledgeSolrFieldNames.getRelatedPageGuids();
		String language = readText(solrDocument, languageFieldName);
		String rubricKey = readText(solrDocument, rubricKeyFieldName);
		String chapterKey = readText(solrDocument, chapterKeyFieldName);
		String subChapterKey = readText(solrDocument, subChapterKeyFieldName);
		String pageKey = readText(solrDocument, pageKeyFieldName);
		String title = readText(solrDocument, titleFieldName);
		String content = readText(solrDocument, contentFieldName);
		String statusName = readText(solrDocument, statusFieldName);
		List<String> tags = readTexts(solrDocument, tagsFieldName);
		List<String> relatedPageGuids = readTexts(solrDocument, relatedPageGuidsFieldName);

		Map<String, Object> fieldValuesWithRules = new LinkedHashMap<>();
		fieldValuesWithRules.put(languageFieldName, language);
		fieldValuesWithRules.put(rubricKeyFieldName, rubricKey);
		fieldValuesWithRules.put(chapterKeyFieldName, chapterKey);
		fieldValuesWithRules.put(subChapterKeyFieldName, subChapterKey);
		fieldValuesWithRules.put(pageKeyFieldName, pageKey);
		fieldValuesWithRules.put(titleFieldName, title);
		fieldValuesWithRules.put(contentFieldName, content);
		fieldValuesWithRules.put(statusFieldName, statusName);
		fieldValuesWithRules.put(tagsFieldName, tags);
		fieldValuesWithRules.put(relatedPageGuidsFieldName, relatedPageGuids);
		return fieldValuesWithRules;
	}

	/**
	 * Prüft den Stand einer Seite an den Feldern, an denen Regeln hängen, und liefert ihn bereinigt zurück (Schlagwörter
	 * ohne Raute und ohne Doppelte, ohne Status ein Entwurf). Alle anderen Felder gehen unverändert durch.
	 *
	 * @param fieldValues der Stand der Seite, jedes Feld unter seinem Solr-Namen; ein Feld ohne Wert fehlt oder ist {@code null}
	 */
	private Map<String, Object> createCheckedFieldValues(Map<String, Object> fieldValues) {
		String languageFieldName = knowledgeSolrFieldNames.getLanguage();
		String rubricKeyFieldName = knowledgeSolrFieldNames.getRubricKey();
		String chapterKeyFieldName = knowledgeSolrFieldNames.getChapterKey();
		String subChapterKeyFieldName = knowledgeSolrFieldNames.getSubChapterKey();
		String pageKeyFieldName = knowledgeSolrFieldNames.getPageKey();
		String titleFieldName = knowledgeSolrFieldNames.getTitle();
		String contentFieldName = knowledgeSolrFieldNames.getContent();
		String statusFieldName = knowledgeSolrFieldNames.getStatus();
		String tagsFieldName = knowledgeSolrFieldNames.getTags();
		String relatedPageGuidsFieldName = knowledgeSolrFieldNames.getRelatedPageGuids();

		String language = readText(fieldValues, languageFieldName);
		Helper.requireNotBlank(language, languageFieldName);
		boolean languageActive = activeLanguageCodes.contains(language);
		if (!languageActive) {
			throw new IllegalArgumentException("Die Sprache " + language + " ist nicht aktiv.");
		}
		String rubricKey = readText(fieldValues, rubricKeyFieldName);
		String chapterKey = readText(fieldValues, chapterKeyFieldName);
		String subChapterKey = readText(fieldValues, subChapterKeyFieldName);
		String pageKey = readText(fieldValues, pageKeyFieldName);
		Helper.requireNotNull(rubricKey, rubricKeyFieldName);
		Helper.requireNotNull(chapterKey, chapterKeyFieldName);
		Helper.requireNotNull(pageKey, pageKeyFieldName);
		Helper.requireValidKey(rubricKey);
		Helper.requireValidKey(chapterKey);
		if (subChapterKey != null) {
			Helper.requireValidKey(subChapterKey);
		}
		Helper.requireValidKey(pageKey);
		knowledgeSectionService.requireExistingKnowledgeSection(rubricKey, chapterKey, subChapterKey);

		String title = readText(fieldValues, titleFieldName);
		Helper.requireNotBlank(title, titleFieldName);
		String content = readText(fieldValues, contentFieldName);
		requireValidContent(content);

		String statusName = readText(fieldValues, statusFieldName);
		KnowledgePageStatus status = KnowledgePageStatus.DRAFT;
		if (statusName != null) {
			status = parseKnowledgePageStatus(statusName);
		}
		String checkedStatusName = status.name();
		List<String> givenTags = readTexts(fieldValues, tagsFieldName);
		List<String> tags = createNormalizedTags(givenTags);
		List<String> givenRelatedPageGuids = readTexts(fieldValues, relatedPageGuidsFieldName);
		List<String> relatedPageGuids = createCheckedRelatedPageGuids(givenRelatedPageGuids);

		Map<String, Object> checkedFieldValues = new LinkedHashMap<>(fieldValues);
		checkedFieldValues.put(statusFieldName, checkedStatusName);
		// eine leere Liste heißt wie ein fehlender Wert: Das Feld hat nichts
		Object tagsValue = null;
		if (!tags.isEmpty()) {
			tagsValue = tags;
		}
		checkedFieldValues.put(tagsFieldName, tagsValue);
		Object relatedPageGuidsValue = null;
		if (!relatedPageGuids.isEmpty()) {
			relatedPageGuidsValue = relatedPageGuids;
		}
		checkedFieldValues.put(relatedPageGuidsFieldName, relatedPageGuidsValue);
		return checkedFieldValues;
	}

	private static KnowledgePageStatus parseKnowledgePageStatus(String statusName) {
		for (KnowledgePageStatus knowledgePageStatus : KnowledgePageStatus.values()) {
			String knownStatusName = knowledgePageStatus.name();
			if (knownStatusName.equals(statusName)) {
				return knowledgePageStatus;
			}
		}
		throw new IllegalArgumentException("Den Status " + statusName + " gibt es nicht.");
	}

	/** Der Inhalt muss da sein, darf nicht zu lang sein und muss ein JSON-Objekt sein; mehr prüft das Backend nicht. */
	private void requireValidContent(String content) {
		String contentFieldName = knowledgeSolrFieldNames.getContent();
		Helper.requireNotBlank(content, contentFieldName);
		boolean contentTooLong = content.length() > contentMaxCharacters;
		if (contentTooLong) {
			throw new IllegalArgumentException(contentFieldName + " ist zu lang: höchstens " + contentMaxCharacters
					+ " Zeichen.");
		}
		JsonNode contentJson;
		try {
			contentJson = objectMapper.readTree(content);
		} catch (JacksonException jacksonException) {
			String parserMessage = jacksonException.getOriginalMessage();
			throw new IllegalArgumentException(contentFieldName + " ist kein gültiges JSON: " + parserMessage);
		}
		boolean contentIsObject = contentJson != null && contentJson.isObject();
		if (!contentIsObject) {
			throw new IllegalArgumentException(contentFieldName + " muss ein JSON-Objekt sein.");
		}
	}

	/** Schlagwörter ohne Raute, ohne Leere und ohne Doppelte, in ihrer Reihenfolge. */
	private static List<String> createNormalizedTags(List<String> tags) {
		Set<String> normalizedTags = new LinkedHashSet<>();
		for (String tag : tags) {
			String normalizedTag = Helper.normalizeTag(tag);
			if (!normalizedTag.isEmpty()) {
				normalizedTags.add(normalizedTag);
			}
		}
		return new ArrayList<>(normalizedTags);
	}

	/** Die Verweise müssen GUIDs sein; ob es die Seiten gibt, prüft das Backend nicht. */
	private List<String> createCheckedRelatedPageGuids(List<String> relatedPageGuids) {
		String relatedPageGuidsFieldName = knowledgeSolrFieldNames.getRelatedPageGuids();
		Set<String> checkedRelatedPageGuids = new LinkedHashSet<>();
		for (String relatedPageGuid : relatedPageGuids) {
			String strippedRelatedPageGuid = relatedPageGuid.strip();
			UUID parsedRelatedPageGuid;
			try {
				parsedRelatedPageGuid = UUID.fromString(strippedRelatedPageGuid);
			} catch (IllegalArgumentException illegalArgumentException) {
				throw new IllegalArgumentException(relatedPageGuidsFieldName + ": " + relatedPageGuid + " ist keine GUID.");
			}
			String checkedRelatedPageGuid = parsedRelatedPageGuid.toString();
			checkedRelatedPageGuids.add(checkedRelatedPageGuid);
		}
		return new ArrayList<>(checkedRelatedPageGuids);
	}

	/**
	 * Der {@code pageKey} ist je Kapitel und Sprache eindeutig, denn er steht in der Adresse der Seite. Weich gelöschte
	 * Seiten halten ihren Key nicht fest.
	 *
	 * @param ownId die id der Seite, die gerade geändert wird (sie selbst zählt nicht); {@code null} beim Anlegen
	 * @throws DuplicateKeyException wenn eine andere Seite den Key trägt
	 */
	private void requireFreePageKey(Map<String, Object> checkedFieldValues, String ownId) {
		String idFieldName = knowledgeSolrFieldNames.getId();
		String statusFieldName = knowledgeSolrFieldNames.getStatus();
		String rubricKeyFieldName = knowledgeSolrFieldNames.getRubricKey();
		String chapterKeyFieldName = knowledgeSolrFieldNames.getChapterKey();
		String pageKeyFieldName = knowledgeSolrFieldNames.getPageKey();
		String languageFieldName = knowledgeSolrFieldNames.getLanguage();
		String rubricKey = readText(checkedFieldValues, rubricKeyFieldName);
		String chapterKey = readText(checkedFieldValues, chapterKeyFieldName);
		String pageKey = readText(checkedFieldValues, pageKeyFieldName);
		String language = readText(checkedFieldValues, languageFieldName);
		String rubricFilterQuery = createTermFilterQuery(rubricKeyFieldName, rubricKey);
		String chapterFilterQuery = createTermFilterQuery(chapterKeyFieldName, chapterKey);
		String pageKeyFilterQuery = createTermFilterQuery(pageKeyFieldName, pageKey);
		String languageFilterQuery = createTermFilterQuery(languageFieldName, language);
		// Das Minus davor ist Solrs Schreibweise für „nicht“; der Wert ist der Name eines Enums, also ohne Sonderzeichen
		String deletedStatusName = KnowledgePageStatus.DELETED.name();
		String notDeletedFilterQuery = "-" + statusFieldName + ":" + deletedStatusName;

		ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
		queryParams.add(CommonParams.FQ, rubricFilterQuery);
		queryParams.add(CommonParams.FQ, chapterFilterQuery);
		queryParams.add(CommonParams.FQ, pageKeyFilterQuery);
		queryParams.add(CommonParams.FQ, languageFilterQuery);
		queryParams.add(CommonParams.FQ, notDeletedFilterQuery);
		queryParams.set(CommonParams.FL, idFieldName);
		queryParams.set(CommonParams.ROWS, resolveMaxRows);
		SolrDocumentList pagesWithSameKey = solrDocumentService.querySolrDocuments(solrCoreKey, queryParams);
		for (SolrDocument pageWithSameKey : pagesWithSameKey) {
			String idOfPageWithSameKey = readText(pageWithSameKey, idFieldName);
			boolean otherPage = !Objects.equals(idOfPageWithSameKey, ownId);
			if (otherPage) {
				throw new DuplicateKeyException("Das Kapitel " + chapterKey + " der Rubrik " + rubricKey
						+ " hat schon eine Seite " + pageKey + ".");
			}
		}
	}

	/** Wie viele Seiten das Kapitel in dieser Sprache schon hat, gleich in welchem Status: Daraus wird der nächste Platz. */
	private long countKnowledgePagesOfChapter(Map<String, Object> checkedFieldValues) {
		String rubricKeyFieldName = knowledgeSolrFieldNames.getRubricKey();
		String chapterKeyFieldName = knowledgeSolrFieldNames.getChapterKey();
		String languageFieldName = knowledgeSolrFieldNames.getLanguage();
		String rubricKey = readText(checkedFieldValues, rubricKeyFieldName);
		String chapterKey = readText(checkedFieldValues, chapterKeyFieldName);
		String language = readText(checkedFieldValues, languageFieldName);
		String rubricFilterQuery = createTermFilterQuery(rubricKeyFieldName, rubricKey);
		String chapterFilterQuery = createTermFilterQuery(chapterKeyFieldName, chapterKey);
		String languageFilterQuery = createTermFilterQuery(languageFieldName, language);
		List<String> filterQueries = List.of(rubricFilterQuery, chapterFilterQuery, languageFilterQuery);
		return solrDocumentService.countSolrDocuments(solrCoreKey, filterQueries);
	}

	private List<Map<String, Object>> doResolveKnowledgePages(KnowledgePageResolveRequest resolveRequest,
			boolean publishedOnly) {
		Helper.requireNotNull(resolveRequest, "resolveRequest");
		ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
		String language = resolveRequest.language();
		if (language != null) {
			boolean languageActive = activeLanguageCodes.contains(language);
			if (!languageActive) {
				throw new IllegalArgumentException("Die Sprache " + language + " ist nicht aktiv.");
			}
			String languageFieldName = knowledgeSolrFieldNames.getLanguage();
			String languageFilterQuery = createTermFilterQuery(languageFieldName, language);
			queryParams.add(CommonParams.FQ, languageFilterQuery);
		}
		String rubricKeyFieldName = knowledgeSolrFieldNames.getRubricKey();
		String chapterKeyFieldName = knowledgeSolrFieldNames.getChapterKey();
		String subChapterKeyFieldName = knowledgeSolrFieldNames.getSubChapterKey();
		String pageKeyFieldName = knowledgeSolrFieldNames.getPageKey();
		String rubricKey = resolveRequest.rubricKey();
		String chapterKey = resolveRequest.chapterKey();
		String subChapterKey = resolveRequest.subChapterKey();
		String pageKey = resolveRequest.pageKey();
		addKeyFilterQuery(queryParams, rubricKeyFieldName, rubricKey);
		addKeyFilterQuery(queryParams, chapterKeyFieldName, chapterKey);
		addKeyFilterQuery(queryParams, subChapterKeyFieldName, subChapterKey);
		addKeyFilterQuery(queryParams, pageKeyFieldName, pageKey);
		if (publishedOnly) {
			String statusFieldName = knowledgeSolrFieldNames.getStatus();
			String publishedStatusName = KnowledgePageStatus.PUBLISHED.name();
			String publishedFilterQuery = createTermFilterQuery(statusFieldName, publishedStatusName);
			queryParams.add(CommonParams.FQ, publishedFilterQuery);
		}

		// die Felder, die der Leser lesen darf, aber ohne den Inhalt: Den langen Text braucht keine Liste
		List<String> readableFieldNames = getReadableFieldNamesForCurrentUsers();
		String contentFieldName = knowledgeSolrFieldNames.getContent();
		List<String> listedFieldNames = new ArrayList<>(readableFieldNames);
		listedFieldNames.remove(contentFieldName);
		String idFieldName = knowledgeSolrFieldNames.getId();
		String listingPositionFieldName = knowledgeSolrFieldNames.getListingPosition();
		// Die id kommt immer mit aus Solr (ohne Felder lieferte Solr sonst alle); der Client bekommt nur, was er lesen darf
		List<String> requestedFieldNames = new ArrayList<>(listedFieldNames);
		requestedFieldNames.add(idFieldName);
		String fieldList = String.join(",", requestedFieldNames);
		// " asc" ist Solrs Schreibweise für aufsteigend; die id dahinter macht die Reihenfolge eindeutig
		String listingOrderSort = listingPositionFieldName + " asc," + idFieldName + " asc";
		queryParams.set(CommonParams.FL, fieldList);
		queryParams.set(CommonParams.SORT, listingOrderSort);
		queryParams.set(CommonParams.ROWS, resolveMaxRows);
		SolrDocumentList foundSolrDocuments = solrDocumentService.querySolrDocuments(solrCoreKey, queryParams);

		List<Map<String, Object>> foundKnowledgePages = new ArrayList<>();
		for (SolrDocument foundSolrDocument : foundSolrDocuments) {
			Map<String, Object> foundKnowledgePage = toClientDocument(foundSolrDocument, listedFieldNames);
			foundKnowledgePages.add(foundKnowledgePage);
		}
		return foundKnowledgePages;
	}

	/** Nimmt einen Filter auf einen Key in die Abfrage, wenn der Key genannt ist. */
	private void addKeyFilterQuery(ModifiableSolrParams queryParams, String fieldName, String key) {
		if (key == null) {
			return;
		}
		Helper.requireValidKey(key);
		String keyFilterQuery = createTermFilterQuery(fieldName, key);
		queryParams.add(CommonParams.FQ, keyFilterQuery);
	}

	/**
	 * Die Felder des Kerns, die der Leser dieser Anfrage lesen darf: mit Anmeldung nach seinen Rechten, ohne Anmeldung
	 * nur die Felder, deren „Wer liest“ auf „jeder“ steht.
	 */
	private List<String> getReadableFieldNamesForCurrentUsers() {
		List<String> accessRoleKeys = List.of();
		boolean authenticated = currentUsersProvider.isAuthenticated();
		if (authenticated) {
			accessRoleKeys = currentUsersProvider.currentUsersAccessRoleKeys();
		}
		return solrDocumentFieldService.getReadableSolrFieldNames(solrCoreKey, accessRoleKeys);
	}

	/** Das ganze Dokument einer Seite, für das Backend selbst (mit allen Feldern, auch denen, die kein Leser bekommt). */
	private SolrDocument doGetSolrDocument(String knowledgePageId) {
		String idFieldName = knowledgeSolrFieldNames.getId();
		String idFilterQuery = createTermFilterQuery(idFieldName, knowledgePageId);
		ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
		queryParams.add(CommonParams.FQ, idFilterQuery);
		queryParams.set(CommonParams.ROWS, 1);
		SolrDocumentList foundSolrDocuments = solrDocumentService.querySolrDocuments(solrCoreKey, queryParams);
		if (foundSolrDocuments.isEmpty()) {
			throw createKnowledgePageNotFoundException(knowledgePageId);
		}
		return foundSolrDocuments.get(0);
	}

	private static EntityNotFoundException createKnowledgePageNotFoundException(String knowledgePageId) {
		return new EntityNotFoundException("Die Wissensseite " + knowledgePageId + " gibt es nicht.");
	}

	/**
	 * Ein Dokument für die Antwort: nur die genannten Felder, soweit das Dokument sie hat; Zeitpunkte als ISO-Text (UTC),
	 * Listen als Listen, alles andere unverändert.
	 */
	private static Map<String, Object> toClientDocument(SolrDocument solrDocument, List<String> readableFieldNames) {
		Map<String, Object> clientDocument = new LinkedHashMap<>();
		for (String readableFieldName : readableFieldNames) {
			Object fieldValue = solrDocument.getFieldValue(readableFieldName);
			if (fieldValue == null) {
				continue;
			}
			Object clientFieldValue = toClientFieldValue(fieldValue);
			clientDocument.put(readableFieldName, clientFieldValue);
		}
		return clientDocument;
	}

	private static Object toClientFieldValue(Object fieldValue) {
		if (fieldValue instanceof Date dateValue) {
			Instant instantValue = dateValue.toInstant();
			return instantValue.toString();
		}
		if (fieldValue instanceof Collection<?> fieldValues) {
			List<Object> clientFieldValues = new ArrayList<>();
			for (Object singleFieldValue : fieldValues) {
				Object clientSingleFieldValue = toClientFieldValue(singleFieldValue);
				clientFieldValues.add(clientSingleFieldValue);
			}
			return clientFieldValues;
		}
		return fieldValue;
	}

	private static String readText(SolrDocument solrDocument, String fieldName) {
		Object fieldValue = solrDocument.getFirstValue(fieldName);
		if (fieldValue == null) {
			return null;
		}
		return fieldValue.toString();
	}

	/** Die Werte eines mehrwertigen Feldes, leer, wenn das Dokument das Feld nicht hat. */
	private static List<String> readTexts(SolrDocument solrDocument, String fieldName) {
		Collection<Object> fieldValues = solrDocument.getFieldValues(fieldName);
		List<String> texts = new ArrayList<>();
		if (fieldValues == null) {
			return texts;
		}
		for (Object fieldValue : fieldValues) {
			String text = fieldValue.toString();
			texts.add(text);
		}
		return texts;
	}

	/** Der Wert eines Textfeldes aus einer Feld-Map, {@code null}, wenn es keinen hat. */
	private static String readText(Map<String, Object> fieldValues, String fieldName) {
		Object fieldValue = fieldValues.get(fieldName);
		if (fieldValue == null) {
			return null;
		}
		return fieldValue.toString();
	}

	/** Die Werte eines mehrwertigen Feldes aus einer Feld-Map, leer, wenn es keinen hat. */
	private static List<String> readTexts(Map<String, Object> fieldValues, String fieldName) {
		Object fieldValue = fieldValues.get(fieldName);
		List<String> texts = new ArrayList<>();
		if (fieldValue instanceof Collection<?> singleFieldValues) {
			for (Object singleFieldValue : singleFieldValues) {
				String text = singleFieldValue.toString();
				texts.add(text);
			}
		} else if (fieldValue != null) {
			String text = fieldValue.toString();
			texts.add(text);
		}
		return texts;
	}

	/**
	 * Filter „Feld hat genau diesen Wert“ über den term-Parser: Der Wert geht wörtlich hinein, ohne Escaping und ohne dass
	 * er als Abfrage gelesen wird. So kann kein Wert die Filter aushebeln.
	 */
	private static String createTermFilterQuery(String fieldName, String value) {
		return "{!term f=" + fieldName + "}" + value;
	}
}
