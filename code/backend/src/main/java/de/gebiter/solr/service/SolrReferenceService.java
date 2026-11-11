package de.gebiter.solr.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.solr.model.SolrReference;
import de.gebiter.solr.repository.SolrReferenceRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link SolrReference} (die Hooks der Vorlage). Er nutzt nur sein eigenes
 * {@link SolrReferenceRepository}; die Zeilen der Referenz in jedem Kern legt der {@link SolrFieldService} an und
 * löscht sie. Anlegen, Ändern und Löschen darf nur der Admin.
 */
@Service
public class SolrReferenceService {

	private final SolrReferenceRepository solrReferenceRepository;

	private final SolrFieldService solrFieldService;

	/** In dieser Sprache muss jeder Anzeigename Text haben ({@code gebiter.language.default-code}). */
	private final String defaultLanguageCode;

	public SolrReferenceService(SolrReferenceRepository solrReferenceRepository, SolrFieldService solrFieldService,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.solrReferenceRepository = solrReferenceRepository;
		this.solrFieldService = solrFieldService;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt eine Referenz am Ende der Liste an und ihre Zeile in jedem Kern. Danach gleicht das Backend Solr an.
	 *
	 * @throws IllegalArgumentException wenn der Key die Feldnamen-Regel verletzt oder auf die Endung eines Zwillings endet,
	 *         der Anzeigename oder (falls angegeben) die Beschreibung in der Pflichtsprache fehlt
	 * @throws DuplicateKeyException wenn es die Referenz oder ein Feld dieses Namens schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public SolrReference createSolrReference(String solrReferenceKey, Map<String, String> displayName,
			Map<String, String> description) {
		Helper.requireNotNull(solrReferenceKey, "key");
		boolean solrReferenceExists = solrReferenceRepository.existsById(solrReferenceKey);
		if (solrReferenceExists) {
			throw new DuplicateKeyException("Die Referenz " + solrReferenceKey + " gibt es schon.");
		}
		solrFieldService.requireAvailableSolrReferenceFieldName(solrReferenceKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		requireValidDescription(description);
		int newListingPosition = 1;
		Optional<SolrReference> lastSolrReference = solrReferenceRepository.findTopByOrderByListingPositionDesc();
		if (lastSolrReference.isPresent()) {
			int lastListingPosition = lastSolrReference.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		SolrReference newSolrReference = new SolrReference(solrReferenceKey, displayName, description,
				newListingPosition);
		SolrReference savedSolrReference = solrReferenceRepository.save(newSolrReference);
		solrFieldService.createMissingSolrReferenceFields(savedSolrReference);
		return savedSolrReference;
	}

	/** READ: Gibt es die Referenz? */
	@Transactional(readOnly = true)
	public boolean existsSolrReference(String solrReferenceKey) {
		Helper.requireNotNull(solrReferenceKey, "solrReferenceKey");
		return solrReferenceRepository.existsById(solrReferenceKey);
	}

	/**
	 * READ: Eine Referenz über ihren Key.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@Transactional(readOnly = true)
	public SolrReference getSolrReference(String solrReferenceKey) {
		Helper.requireNotNull(solrReferenceKey, "solrReferenceKey");
		return doGetSolrReference(solrReferenceKey);
	}

	/** READ: Alle Referenzen in der Reihenfolge der Anzeige. */
	@Transactional(readOnly = true)
	public List<SolrReference> getAllSolrReference() {
		return solrReferenceRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	/**
	 * UPDATE: Ändert Anzeigename und Beschreibung einer Referenz, auch an ihren Zeilen in den Kernen. Der Key ändert sich
	 * nie.
	 *
	 * @throws IllegalArgumentException wenn der Key oder der Anzeigename in der Pflichtsprache fehlt
	 * @throws EntityNotFoundException wenn es die Referenz nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public SolrReference changeSolrReference(SolrReference changedSolrReference) {
		String solrReferenceKey = changedSolrReference.getKey();
		Helper.requireNotNull(solrReferenceKey, "key");
		Map<String, String> changedDisplayName = changedSolrReference.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);
		Map<String, String> changedDescription = changedSolrReference.getDescription();
		requireValidDescription(changedDescription);
		SolrReference existingSolrReference = doGetSolrReference(solrReferenceKey);
		existingSolrReference.setDisplayName(changedDisplayName);
		existingSolrReference.setDescription(changedDescription);
		SolrReference savedSolrReference = solrReferenceRepository.save(existingSolrReference);
		solrFieldService.changeSolrReferenceFields(savedSolrReference);
		return savedSolrReference;
	}

	/**
	 * DELETE: Löscht eine Referenz samt ihren Zeilen in allen Kernen. In Solr bleibt das Feld stehen, der Abgleich meldet
	 * es als „nur in Solr“; die Werte in den Dokumenten bleiben, bis ein Neuaufbau sie entfernt.
	 *
	 * @throws EntityNotFoundException wenn es die Referenz nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteSolrReference(String solrReferenceKey) {
		Helper.requireNotNull(solrReferenceKey, "key");
		SolrReference existingSolrReference = doGetSolrReference(solrReferenceKey);
		solrFieldService.deleteSolrReferenceFields(solrReferenceKey);
		solrReferenceRepository.delete(existingSolrReference);
	}

	/**
	 * Legt in jedem Kern die Zeilen an, die einer Referenz fehlen, z. B. nachdem ein Kern in die YAML kam. Für den
	 * Start-Runner.
	 *
	 * @return wie viele Zeilen neu angelegt wurden
	 */
	@Transactional
	public int createMissingSolrReferenceFieldsOfAllSolrReferences() {
		List<SolrReference> allSolrReferences = solrReferenceRepository.findAllByOrderByListingPositionAscKeyAsc();
		int createdSolrReferenceFieldCount = 0;
		for (SolrReference solrReference : allSolrReferences) {
			int createdForSolrReference = solrFieldService.createMissingSolrReferenceFields(solrReference);
			createdSolrReferenceFieldCount = createdSolrReferenceFieldCount + createdForSolrReference;
		}
		return createdSolrReferenceFieldCount;
	}

	/** Eine Beschreibung darf fehlen; ist sie da, braucht sie Text in der Pflichtsprache. */
	private void requireValidDescription(Map<String, String> description) {
		if (description == null) {
			return;
		}
		Helper.requireMultilingualText(description, "description", defaultLanguageCode);
	}

	private SolrReference doGetSolrReference(String solrReferenceKey) {
		Optional<SolrReference> foundSolrReference = solrReferenceRepository.findById(solrReferenceKey);
		if (foundSolrReference.isEmpty()) {
			throw new EntityNotFoundException("Die Referenz " + solrReferenceKey + " gibt es nicht.");
		}
		return foundSolrReference.get();
	}
}
