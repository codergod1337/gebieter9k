package de.gebiter.file.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.solr.common.params.CommonParams;
import org.apache.solr.common.params.ModifiableSolrParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileConfig;
import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.dto.FileFieldValueSuggestion;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.solr.SolrConfig;
import de.gebiter.solr.model.SolrField;
import de.gebiter.solr.service.SolrDocumentFieldService;
import de.gebiter.solr.service.SolrDocumentService;
import de.gebiter.solr.service.SolrFieldService;
import de.gebiter.util.Helper;

/**
 * Die Suche im File-Kern für die Vervollständigung (Konzept des Nutzers 2026-11-09): eine eigene, schlanke Abfrage nur
 * auf ein Feld, z. B. die Tags, die nie Dokumente liefert, sondern nur vorhandene Werte. So bekommt jeder dieselben
 * Schlagworte vorgeschlagen, und die Tags bleiben einheitlich.
 * <p>
 * Gesucht wird im Suggest-Zwilling des Feldes (EdgeNGram, klein geschrieben, z. B. {@code tags_suggest}): Er findet jeden
 * Wert, der mit dem Getippten anfängt, ohne Groß- und Kleinschreibung. Die eindeutigen Werte kommen als Facette des
 * Originalfeldes, häufigste zuerst. Solrs Highlighter greift hier nicht, weil der Zwilling ein nicht gespeichertes
 * Kopierfeld ist; die Fundstelle markiert das Frontend.
 * <p>
 * Ohne Lesefilter je Dokument (Nutzer: Es kommen nur Werte dieses einen Feldes zurück, nie ein Dokument). Geprüft wird
 * nur, ob der User das Feld überhaupt lesen darf und ob es einen Suggest-Zwilling hat. Gelöschte Dateien zählen nicht.
 */
@Service
public class FileDocumentSearchService {

	private final SolrDocumentService solrDocumentService;

	private final SolrDocumentFieldService solrDocumentFieldService;

	private final SolrFieldService solrFieldService;

	private final SolrConfig solrConfig;

	private final CurrentUsersProvider currentUsersProvider;

	private final FileConfig fileConfig;

	private final FileSolrFieldNames fileSolrFieldNames;

	/** Erst ab so vielen Zeichen wird gesucht ({@code gebiter.file.field-value-search.min-length}). */
	private final int searchMinLength;

	/** So viele häufigste Werte liest die Facette ({@code gebiter.file.field-value-search.facet-limit}). */
	private final int facetLimit;

	/** So viele Vorschläge gehen zurück ({@code gebiter.file.field-value-search.result-limit}). */
	private final int resultLimit;

	public FileDocumentSearchService(SolrDocumentService solrDocumentService,
			SolrDocumentFieldService solrDocumentFieldService, SolrFieldService solrFieldService, SolrConfig solrConfig,
			CurrentUsersProvider currentUsersProvider, FileConfig fileConfig, FileSolrFieldNames fileSolrFieldNames,
			@Value("${gebiter.file.field-value-search.min-length}") int searchMinLength,
			@Value("${gebiter.file.field-value-search.facet-limit}") int facetLimit,
			@Value("${gebiter.file.field-value-search.result-limit}") int resultLimit) {
		this.solrDocumentService = solrDocumentService;
		this.solrDocumentFieldService = solrDocumentFieldService;
		this.solrFieldService = solrFieldService;
		this.solrConfig = solrConfig;
		this.currentUsersProvider = currentUsersProvider;
		this.fileConfig = fileConfig;
		this.fileSolrFieldNames = fileSolrFieldNames;
		this.searchMinLength = searchMinLength;
		this.facetLimit = facetLimit;
		this.resultLimit = resultLimit;
	}

	/**
	 * READ (Suchen): Vorhandene Werte des Feldes, die mit {@code searchText} anfangen, ohne Groß- und Kleinschreibung,
	 * häufigste zuerst, höchstens {@code gebiter.file.field-value-search.result-limit}. Kürzer als die Mindestlänge: leer.
	 *
	 * @throws IllegalArgumentException wenn das Feld fehlt, es nicht gibt, der User es nicht lesen darf oder es keinen
	 *         Suggest-Zwilling hat
	 */
	public List<FileFieldValueSuggestion> searchFileFieldValues(String fieldName, String searchText) {
		Helper.requireNotBlank(fieldName, "fieldName");
		requireSearchableField(fieldName);
		if (searchText == null) {
			return List.of();
		}
		String strippedSearchText = searchText.strip();
		// Bei Tags zählt eine getippte Raute nicht: gespeichert sind sie ohne
		String tagsFieldName = fileSolrFieldNames.tags();
		if (fieldName.equals(tagsFieldName)) {
			strippedSearchText = Helper.normalizeTag(strippedSearchText);
		}
		if (strippedSearchText.length() < searchMinLength) {
			return List.of();
		}
		String lowerCaseSearchText = strippedSearchText.toLowerCase(Locale.ROOT);
		return doSearchFileFieldValues(fieldName, lowerCaseSearchText);
	}

	private List<FileFieldValueSuggestion> doSearchFileFieldValues(String fieldName, String lowerCaseSearchText) {
		String suggestTwinFieldName = fieldName + solrConfig.suggestTwinSuffix();
		String statusFieldName = fileSolrFieldNames.status();
		String activeStatus = fileConfig.statusActive();
		ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
		// Der Zwilling ist klein geschrieben und in Anfänge zerlegt: Der getippte Anfang ist genau ein Term darin
		queryParams.add(CommonParams.FQ, "{!term f=" + suggestTwinFieldName + "}" + lowerCaseSearchText);
		queryParams.add(CommonParams.FQ, "{!term f=" + statusFieldName + "}" + activeStatus);
		String solrCoreKey = fileConfig.solrCoreKey();
		Map<String, Long> valueCounts = solrDocumentService.countSolrFieldValues(solrCoreKey, queryParams, fieldName,
				facetLimit);
		// Die Facette nennt alle Werte der gefundenen Dateien: nur die, die selbst mit dem Getippten anfangen
		List<FileFieldValueSuggestion> suggestions = new ArrayList<>();
		for (Map.Entry<String, Long> valueCount : valueCounts.entrySet()) {
			String fieldValue = valueCount.getKey();
			String lowerCaseFieldValue = fieldValue.toLowerCase(Locale.ROOT);
			boolean matches = lowerCaseFieldValue.startsWith(lowerCaseSearchText);
			if (!matches) {
				continue;
			}
			long fileCount = valueCount.getValue();
			FileFieldValueSuggestion suggestion = new FileFieldValueSuggestion(fieldValue, fileCount);
			suggestions.add(suggestion);
			if (suggestions.size() >= resultLimit) {
				break;
			}
		}
		return suggestions;
	}

	/** Das Feld muss es im File-Kern geben, der User muss es lesen dürfen, und es braucht einen Suggest-Zwilling. */
	private void requireSearchableField(String fieldName) {
		String solrCoreKey = fileConfig.solrCoreKey();
		List<String> currentUsersAccessRoleKeys = currentUsersProvider.currentUsersAccessRoleKeys();
		List<String> readableFieldNames = solrDocumentFieldService.getReadableSolrFieldNames(solrCoreKey,
				currentUsersAccessRoleKeys);
		boolean readable = readableFieldNames.contains(fieldName);
		if (!readable) {
			throw new IllegalArgumentException("Im Feld " + fieldName + " lässt sich nicht suchen.");
		}
		List<SolrField> solrFields = solrFieldService.getSolrFieldBySolrCoreKey(solrCoreKey);
		for (SolrField solrField : solrFields) {
			boolean sameName = solrField.getName().equals(fieldName);
			if (sameName && solrField.isSuggestTwin()) {
				return;
			}
		}
		throw new IllegalArgumentException("Das Feld " + fieldName + " hat keine Vervollständigung.");
	}
}
