package de.gebiter.solr.service;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.params.CommonParams;
import org.apache.solr.common.params.CursorMarkParams;
import org.apache.solr.common.params.ModifiableSolrParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import de.gebiter.solr.dto.SolrCursorPage;
import de.gebiter.solr.model.SolrField;
import de.gebiter.solr.model.SolrReference;
import de.gebiter.util.Helper;
import tools.jackson.databind.ObjectMapper;

/**
 * Exportiert einen Solr-Kern komplett als JSON (Backup; Nutzer 2026-11-09: später auch wieder einspielen, Recovery).
 * Doku: {@code docu/solr-cores/README.md}.
 * <p>
 * Die Datei: {@code {"formatVersion": 1, "solrCoreKey": "FILE", "exportedAt": "…", "solrFields": […],
 * "solrReferences": […], "documents": […]}}. Die Felddefinitionen kommen aus Postgres ({@code solr_field}), die
 * Referenzen ebenso, die Dokumente aus Solr mit allen Feldern, die eine Definition haben (die Zwillinge und
 * {@code _version_} nicht: Die baut Solr beim Einspielen selbst). Zeitpunkte als ISO-Text.
 * <p>
 * Gelesen wird seitenweise mit Cursor (sortiert nach id) und gleich geschrieben: Der Speicher hängt nicht an der Größe
 * des Kerns. Nur ADMIN.
 */
@Service
public class SolrCoreExportService {

	private static final Logger LOGGER = LoggerFactory.getLogger(SolrCoreExportService.class);

	private final SolrCoreService solrCoreService;

	private final SolrFieldService solrFieldService;

	private final SolrReferenceService solrReferenceService;

	private final SolrDocumentService solrDocumentService;

	private final ObjectMapper objectMapper;

	/** So viele Dokumente je Seite ({@code gebiter.solr.export.batch-size}). */
	private final int exportBatchSize;

	/** Die Fassung des Formats ({@code gebiter.solr.export.format-version}), für das spätere Einspielen. */
	private final int exportFormatVersion;

	public SolrCoreExportService(SolrCoreService solrCoreService, SolrFieldService solrFieldService,
			SolrReferenceService solrReferenceService, SolrDocumentService solrDocumentService, ObjectMapper objectMapper,
			@Value("${gebiter.solr.export.batch-size}") int exportBatchSize,
			@Value("${gebiter.solr.export.format-version}") int exportFormatVersion) {
		this.solrCoreService = solrCoreService;
		this.solrFieldService = solrFieldService;
		this.solrReferenceService = solrReferenceService;
		this.solrDocumentService = solrDocumentService;
		this.objectMapper = objectMapper;
		this.exportBatchSize = exportBatchSize;
		this.exportFormatVersion = exportFormatVersion;
	}

	/**
	 * READ: Schreibt den ganzen Kern als JSON in {@code outputStream}, der Aufrufer schließt den Strom.
	 *
	 * @return wie viele Dokumente exportiert wurden
	 * @throws IllegalArgumentException wenn es den Kern nicht gibt
	 * @throws UncheckedIOException wenn das Schreiben scheitert (z. B. Verbindung abgebrochen)
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public long exportSolrCore(String solrCoreKey, OutputStream outputStream) {
		Helper.requireNotNull(solrCoreKey, "solrCoreKey");
		boolean solrCoreExists = solrCoreService.existsSolrCore(solrCoreKey);
		if (!solrCoreExists) {
			throw new IllegalArgumentException("Den Kern " + solrCoreKey + " gibt es nicht.");
		}
		try {
			return doExportSolrCore(solrCoreKey, outputStream);
		} catch (IOException exception) {
			throw new UncheckedIOException("Der Export des Kerns " + solrCoreKey + " ist abgebrochen.", exception);
		}
	}

	private long doExportSolrCore(String solrCoreKey, OutputStream outputStream) throws IOException {
		List<SolrField> solrFields = solrFieldService.getSolrFieldBySolrCoreKey(solrCoreKey);
		List<SolrReference> solrReferences = solrReferenceService.getAllSolrReference();
		Set<String> exportedFieldNames = new LinkedHashSet<>();
		for (SolrField solrField : solrFields) {
			String fieldName = solrField.getName();
			exportedFieldNames.add(fieldName);
		}
		String exportedAt = Instant.now().toString();

		// Der Kopf, dann die Dokumente einzeln: das Gerüst als Text, jedes Stück von Jackson
		writeText(outputStream, "{\"formatVersion\":" + exportFormatVersion + ",\"solrCoreKey\":");
		writeJson(outputStream, solrCoreKey);
		writeText(outputStream, ",\"exportedAt\":");
		writeJson(outputStream, exportedAt);
		writeText(outputStream, ",\"solrFields\":");
		writeJson(outputStream, solrFields);
		writeText(outputStream, ",\"solrReferences\":");
		writeJson(outputStream, solrReferences);
		writeText(outputStream, ",\"documents\":[");

		long exportedDocumentCount = 0;
		String cursorMark = CursorMarkParams.CURSOR_MARK_START;
		boolean morePages = true;
		while (morePages) {
			ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
			queryParams.set(CommonParams.FL, "*");
			queryParams.set(CommonParams.ROWS, exportBatchSize);
			// Ein Cursor braucht eine eindeutige Sortierung: die id
			queryParams.set(CommonParams.SORT, "id asc");
			queryParams.set(CursorMarkParams.CURSOR_MARK_PARAM, cursorMark);
			SolrCursorPage cursorPage = solrDocumentService.querySolrDocumentsWithCursor(solrCoreKey, queryParams);
			for (SolrDocument solrDocument : cursorPage.documents()) {
				if (exportedDocumentCount > 0) {
					writeText(outputStream, ",");
				}
				Map<String, Object> exportedDocument = toExportedDocument(solrDocument, exportedFieldNames);
				writeJson(outputStream, exportedDocument);
				exportedDocumentCount = exportedDocumentCount + 1;
			}
			String nextCursorMark = cursorPage.nextCursorMark();
			morePages = !cursorMark.equals(nextCursorMark);
			cursorMark = nextCursorMark;
		}
		writeText(outputStream, "]}");
		outputStream.flush();
		LOGGER.info("Export: Kern {} mit {} Dokumenten und {} Feldern", solrCoreKey, exportedDocumentCount, solrFields.size());
		return exportedDocumentCount;
	}

	/** Ein Dokument mit allen definierten Feldern, Zeitpunkte als ISO-Text. */
	private static Map<String, Object> toExportedDocument(SolrDocument solrDocument, Set<String> exportedFieldNames) {
		Map<String, Object> exportedDocument = new LinkedHashMap<>();
		for (String fieldName : solrDocument.getFieldNames()) {
			boolean defined = exportedFieldNames.contains(fieldName);
			if (!defined) {
				continue;
			}
			Object fieldValue = solrDocument.getFieldValue(fieldName);
			Object exportedValue = toExportedValue(fieldValue);
			exportedDocument.put(fieldName, exportedValue);
		}
		return exportedDocument;
	}

	private static Object toExportedValue(Object fieldValue) {
		if (fieldValue instanceof Date dateValue) {
			Instant instantValue = dateValue.toInstant();
			return instantValue.toString();
		}
		if (fieldValue instanceof Collection<?> collectionValue) {
			List<Object> exportedValues = new ArrayList<>();
			for (Object singleValue : collectionValue) {
				Object exportedSingleValue = toExportedValue(singleValue);
				exportedValues.add(exportedSingleValue);
			}
			return exportedValues;
		}
		return fieldValue;
	}

	private static void writeText(OutputStream outputStream, String text) throws IOException {
		byte[] textBytes = text.getBytes(StandardCharsets.UTF_8);
		outputStream.write(textBytes);
	}

	private void writeJson(OutputStream outputStream, Object value) throws IOException {
		byte[] jsonBytes = objectMapper.writeValueAsBytes(value);
		outputStream.write(jsonBytes);
	}
}
