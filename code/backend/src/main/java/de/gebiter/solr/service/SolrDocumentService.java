package de.gebiter.solr.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.response.FacetField;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.SolrException;
import org.apache.solr.common.SolrInputDocument;
import org.apache.solr.common.params.CommonParams;
import org.apache.solr.common.params.FacetParams;
import org.apache.solr.common.params.ModifiableSolrParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import de.gebiter.solr.SolrUnavailableException;
import de.gebiter.solr.dto.SolrCursorPage;
import jakarta.persistence.EntityNotFoundException;

/**
 * Die rohe Schicht zu den Solr-Dokumenten, ohne Fachwissen: anlegen, abfragen, zählen. Wer was darf, welche Felder und
 * welche Filter gelten, entscheidet der Service des Kerns (z. B. {@code FileDocumentResolveService}), nie diese Klasse.
 * <p>
 * Fehler: Solr nicht erreichbar heißt {@link SolrUnavailableException} (503). Ein abgelehntes Anlegen, weil es die id schon
 * gibt, heißt {@link DuplicateKeyException} (409).
 */
@Service
public class SolrDocumentService {

	private static final Logger LOGGER = LoggerFactory.getLogger(SolrDocumentService.class);

	private final SolrClientRegistry solrClientRegistry;

	public SolrDocumentService(SolrClientRegistry solrClientRegistry) {
		this.solrClientRegistry = solrClientRegistry;
	}

	/**
	 * CREATE: Legt ein neues Dokument an, aber nur, wenn es seine id im Kern noch nicht gibt. Danach ein Soft-Commit, damit
	 * es sofort auffindbar ist. Werte, die eine Liste sind, werden zu einem mehrwertigen Feld.
	 *
	 * @param fieldValuesByFieldName alle Felder des Dokuments, die id eingeschlossen
	 * @throws DuplicateKeyException wenn es die id schon gibt
	 * @throws SolrUnavailableException wenn Solr nicht antwortet
	 */
	public void createSolrDocument(String solrCoreKey, Map<String, Object> fieldValuesByFieldName) {
		SolrInputDocument newSolrDocument = new SolrInputDocument();
		for (Map.Entry<String, Object> fieldValueEntry : fieldValuesByFieldName.entrySet()) {
			String fieldName = fieldValueEntry.getKey();
			Object fieldValue = fieldValueEntry.getValue();
			newSolrDocument.setField(fieldName, fieldValue);
		}
		// _version_ ist Solrs eigenes Feld (fester Name in jedem Kern). -1 heißt: nur anlegen, wenn es die id noch nicht
		// gibt, sonst lehnt Solr mit 409 ab. So überschreibt ein Upload nie ein vorhandenes Dokument.
		newSolrDocument.setField("_version_", -1L);

		SolrClient solrClient = solrClientRegistry.getSolrClient(solrCoreKey);
		try {
			solrClient.add(newSolrDocument);
			// waitFlush nein, waitSearcher ja, softCommit ja: Das Dokument ist sichtbar, wenn die Methode zurückkehrt.
			solrClient.commit(false, true, true);
		} catch (SolrException solrException) {
			int conflictStatusCode = 409;
			boolean documentAlreadyExists = solrException.code() == conflictStatusCode;
			if (documentAlreadyExists) {
				throw new DuplicateKeyException("Das Dokument gibt es im Kern " + solrCoreKey + " schon.");
			}
			throw solrException;
		} catch (SolrServerException | IOException exception) {
			LOGGER.warn("Solr: Anlegen im Kern {} fehlgeschlagen", solrCoreKey, exception);
			throw new SolrUnavailableException("Die Suche ist gerade nicht erreichbar.", exception);
		}
	}

	/**
	 * UPDATE: Setzt die genannten Felder eines vorhandenen Dokuments (Atomic Update {@code set}), alle anderen bleiben, wie
	 * sie sind. Ein Wert {@code null} nimmt das Feld heraus. Danach ein Soft-Commit.
	 *
	 * @throws jakarta.persistence.EntityNotFoundException wenn es das Dokument nicht (mehr) gibt
	 * @throws SolrUnavailableException wenn Solr nicht antwortet
	 */
	public void setSolrDocumentFieldValues(String solrCoreKey, String id, String idFieldName,
			Map<String, Object> newValuesByFieldName) {
		SolrInputDocument atomicUpdateDocument = createAtomicUpdateDocument(id, idFieldName, newValuesByFieldName);
		List<SolrInputDocument> atomicUpdateDocuments = List.of(atomicUpdateDocument);
		doAddAtomicUpdateDocuments(solrCoreKey, atomicUpdateDocuments);
	}

	/**
	 * UPDATE: Setzt Felder in mehreren vorhandenen Dokumenten, je Dokument wie {@link #setSolrDocumentFieldValues}, aber
	 * alle in EINER Anfrage und mit EINEM Soft-Commit am Ende. Für Vorgänge, die viele Dokumente auf einmal ändern, z. B.
	 * die Plätze der Bilder einer Galerie: Ein Commit je Dokument dauerte bei mehreren hundert Dokumenten viel zu lange.
	 * Ohne Dokumente geschieht nichts.
	 * <p>
	 * Solr arbeitet die Dokumente der Reihe nach ab: Fehlt eines, sind die davor schon geändert.
	 *
	 * @param newValuesByFieldNameById je id die Felder, die in diesem Dokument gesetzt werden
	 * @throws jakarta.persistence.EntityNotFoundException wenn es eines der Dokumente nicht (mehr) gibt
	 * @throws SolrUnavailableException wenn Solr nicht antwortet
	 */
	public void setFieldValuesOfSolrDocuments(String solrCoreKey, String idFieldName,
			Map<String, Map<String, Object>> newValuesByFieldNameById) {
		if (newValuesByFieldNameById.isEmpty()) {
			return;
		}
		List<SolrInputDocument> atomicUpdateDocuments = new ArrayList<>();
		for (Map.Entry<String, Map<String, Object>> documentEntry : newValuesByFieldNameById.entrySet()) {
			String id = documentEntry.getKey();
			Map<String, Object> newValuesByFieldName = documentEntry.getValue();
			SolrInputDocument atomicUpdateDocument = createAtomicUpdateDocument(id, idFieldName, newValuesByFieldName);
			atomicUpdateDocuments.add(atomicUpdateDocument);
		}
		doAddAtomicUpdateDocuments(solrCoreKey, atomicUpdateDocuments);
	}

	/** Das Atomic Update für ein Dokument: die id, je Feld der Befehl {@code set} und die Bedingung „gibt es schon“. */
	private static SolrInputDocument createAtomicUpdateDocument(String id, String idFieldName,
			Map<String, Object> newValuesByFieldName) {
		SolrInputDocument atomicUpdateDocument = new SolrInputDocument();
		atomicUpdateDocument.setField(idFieldName, id);
		for (Map.Entry<String, Object> newValueEntry : newValuesByFieldName.entrySet()) {
			String fieldName = newValueEntry.getKey();
			Object newValue = newValueEntry.getValue();
			// "set" ist Solrs Befehl für Atomic Update; Map.of erlaubt kein null, null heißt hier „Feld heraus“
			Map<String, Object> setOperation = new HashMap<>();
			setOperation.put("set", newValue);
			atomicUpdateDocument.setField(fieldName, setOperation);
		}
		// _version_ 1 heißt: nur, wenn es das Dokument gibt. Sonst legte ein Atomic Update ein neues, halbes an.
		atomicUpdateDocument.setField("_version_", 1L);
		return atomicUpdateDocument;
	}

	/**
	 * Schickt die Atomic Updates in einer Anfrage an Solr, danach ein Soft-Commit, der auf den neuen Stand wartet: Kehrt die
	 * Methode zurück, sieht jede folgende Abfrage die Änderungen.
	 */
	private void doAddAtomicUpdateDocuments(String solrCoreKey, List<SolrInputDocument> atomicUpdateDocuments) {
		SolrClient solrClient = solrClientRegistry.getSolrClient(solrCoreKey);
		try {
			solrClient.add(atomicUpdateDocuments);
			solrClient.commit(false, true, true);
		} catch (SolrException solrException) {
			int conflictStatusCode = 409;
			boolean documentMissing = solrException.code() == conflictStatusCode;
			if (documentMissing) {
				throw new EntityNotFoundException("Das Dokument gibt es im Kern " + solrCoreKey + " nicht.");
			}
			throw solrException;
		} catch (SolrServerException | IOException exception) {
			LOGGER.warn("Solr: Ändern im Kern {} fehlgeschlagen", solrCoreKey, exception);
			throw new SolrUnavailableException("Die Suche ist gerade nicht erreichbar.", exception);
		}
	}

	/**
	 * DELETE: Löscht ein Dokument endgültig, danach ein Soft-Commit. Gab es es nicht, gilt das als Erfolg.
	 *
	 * @throws SolrUnavailableException wenn Solr nicht antwortet
	 */
	public void deleteSolrDocument(String solrCoreKey, String id) {
		SolrClient solrClient = solrClientRegistry.getSolrClient(solrCoreKey);
		try {
			solrClient.deleteById(id);
			solrClient.commit(false, true, true);
		} catch (SolrServerException | IOException exception) {
			LOGGER.warn("Solr: Löschen im Kern {} fehlgeschlagen", solrCoreKey, exception);
			throw new SolrUnavailableException("Die Suche ist gerade nicht erreichbar.", exception);
		}
	}

	/**
	 * READ: Eine Abfrage mit fertigen Parametern ({@code q}, {@code fq}, {@code fl}, {@code rows} …), zurück kommen die
	 * Dokumente der Seite samt Gesamtzahl ({@link SolrDocumentList#getNumFound()}).
	 *
	 * @throws SolrUnavailableException wenn Solr nicht antwortet
	 */
	public SolrDocumentList querySolrDocuments(String solrCoreKey, ModifiableSolrParams queryParams) {
		SolrClient solrClient = solrClientRegistry.getSolrClient(solrCoreKey);
		try {
			QueryResponse queryResponse = solrClient.query(queryParams);
			return queryResponse.getResults();
		} catch (SolrServerException | IOException exception) {
			LOGGER.warn("Solr: Abfrage im Kern {} fehlgeschlagen", solrCoreKey, exception);
			throw new SolrUnavailableException("Die Suche ist gerade nicht erreichbar.", exception);
		}
	}

	/**
	 * READ: Eine Seite einer Abfrage mit Cursor ({@code cursorMark} in den Parametern, Sortierung eindeutig), z. B. für
	 * den Export eines ganzen Kerns: die Dokumente und der Cursor der nächsten Seite. Ist er gleich dem alten, ist Schluss.
	 *
	 * @throws SolrUnavailableException wenn Solr nicht antwortet
	 */
	public SolrCursorPage querySolrDocumentsWithCursor(String solrCoreKey, ModifiableSolrParams queryParams) {
		SolrClient solrClient = solrClientRegistry.getSolrClient(solrCoreKey);
		try {
			QueryResponse queryResponse = solrClient.query(queryParams);
			SolrDocumentList documents = queryResponse.getResults();
			String nextCursorMark = queryResponse.getNextCursorMark();
			return new SolrCursorPage(documents, nextCursorMark);
		} catch (SolrServerException | IOException exception) {
			LOGGER.warn("Solr: Abfrage mit Cursor im Kern {} fehlgeschlagen", solrCoreKey, exception);
			throw new SolrUnavailableException("Die Suche ist gerade nicht erreichbar.", exception);
		}
	}

	/**
	 * READ: Die Werte eines Feldes mit ihrer Anzahl unter den Dokumenten, die auf die Parameter passen (eine Facette),
	 * häufigste zuerst, höchstens {@code facetLimit}. Lädt keine Dokumente. Das Feld braucht docValues.
	 *
	 * @throws SolrUnavailableException wenn Solr nicht antwortet
	 */
	public Map<String, Long> countSolrFieldValues(String solrCoreKey, ModifiableSolrParams queryParams,
			String facetFieldName, int facetLimit) {
		queryParams.set(CommonParams.ROWS, 0);
		queryParams.set(FacetParams.FACET, true);
		queryParams.set(FacetParams.FACET_FIELD, facetFieldName);
		queryParams.set(FacetParams.FACET_LIMIT, facetLimit);
		queryParams.set(FacetParams.FACET_MINCOUNT, 1);
		queryParams.set(FacetParams.FACET_SORT, FacetParams.FACET_SORT_COUNT);
		SolrClient solrClient = solrClientRegistry.getSolrClient(solrCoreKey);
		QueryResponse queryResponse;
		try {
			queryResponse = solrClient.query(queryParams);
		} catch (SolrServerException | IOException exception) {
			LOGGER.warn("Solr: Facette im Kern {} fehlgeschlagen", solrCoreKey, exception);
			throw new SolrUnavailableException("Die Suche ist gerade nicht erreichbar.", exception);
		}
		Map<String, Long> valueCounts = new LinkedHashMap<>();
		FacetField facetField = queryResponse.getFacetField(facetFieldName);
		if (facetField == null) {
			return valueCounts;
		}
		List<FacetField.Count> facetFieldCounts = facetField.getValues();
		for (FacetField.Count facetFieldCount : facetFieldCounts) {
			String fieldValue = facetFieldCount.getName();
			long fieldValueCount = facetFieldCount.getCount();
			valueCounts.put(fieldValue, fieldValueCount);
		}
		return valueCounts;
	}

	/**
	 * READ: Wie viele Dokumente passen auf alle {@code fq}? Lädt keine Dokumente.
	 *
	 * @throws SolrUnavailableException wenn Solr nicht antwortet
	 */
	public long countSolrDocuments(String solrCoreKey, Collection<String> filterQueries) {
		ModifiableSolrParams countParams = createFilterOnlyQueryParams();
		for (String filterQuery : filterQueries) {
			countParams.add(CommonParams.FQ, filterQuery);
		}
		countParams.set(CommonParams.ROWS, 0);
		SolrDocumentList emptyPage = querySolrDocuments(solrCoreKey, countParams);
		return emptyPage.getNumFound();
	}

	/**
	 * Die Grundparameter einer Abfrage, die nur über Filter ({@code fq}) auswählt, z. B. beim Auflösen: {@code q} sind alle
	 * Dokumente, die Auswahl steckt ganz in den Filtern, die Solr zwischenspeichert. Der Aufrufer ergänzt fq, fl, rows.
	 */
	public ModifiableSolrParams createFilterOnlyQueryParams() {
		ModifiableSolrParams filterOnlyQueryParams = new ModifiableSolrParams();
		// "*:*" ist Solrs feste Schreibweise für „alle Dokumente“, Teil der Abfragesprache, keine Einstellung
		filterOnlyQueryParams.set(CommonParams.Q, "*:*");
		return filterOnlyQueryParams;
	}
}
