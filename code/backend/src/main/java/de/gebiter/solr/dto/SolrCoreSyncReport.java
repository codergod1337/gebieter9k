package de.gebiter.solr.dto;

import java.time.Instant;
import java.util.List;

/**
 * Was der letzte Abgleich eines Kerns mit Solr ergab, wie in der Vorlage. Nur ein Bericht, keine Entity: Er lebt im
 * Speicher des {@code SolrSchemaSyncService} und wird bei jedem Abgleich ersetzt.
 *
 * @param solrCoreKey der Kern
 * @param solrReachable {@code false}: Solr hat nicht geantwortet, {@code errorText} sagt warum
 * @param solrCoreExists {@code false}: den Kern gibt es in Solr nicht, er fehlt in {@code SOLR_CORES} der {@code .env}
 *        auf dem Pi
 * @param fieldCountInSolr so viele Felder hat das Schema des Kerns danach, ohne die Systemfelder ({@code _version_},
 *        {@code _root_})
 * @param addedFieldNames per {@code add-field} angelegt
 * @param replacedFieldNames per {@code replace-field} angepasst (Schalter)
 * @param addedCopyFields per {@code add-copy-field} angelegt, „quelle → ziel“
 * @param fieldNamesOnlyInSolr in Solr, aber nicht in Postgres: nur gemeldet, nie gelöscht
 * @param typeConflicts anderer Typ in Solr als in Postgres: nur gemeldet, ein Typwechsel heißt Neuaufbau des Kerns
 * @param errorText {@code null}, wenn der Abgleich durchlief
 * @param syncedAt wann der Abgleich endete
 * @param durationMillis wie lange er dauerte
 */
public record SolrCoreSyncReport(String solrCoreKey, boolean solrReachable, boolean solrCoreExists,
		int fieldCountInSolr, List<String> addedFieldNames, List<String> replacedFieldNames,
		List<String> addedCopyFields, List<String> fieldNamesOnlyInSolr, List<String> typeConflicts, String errorText,
		Instant syncedAt, long durationMillis) {

	/** Solr hat nicht geantwortet oder einen Fehler gemeldet. */
	public static SolrCoreSyncReport createFailedSolrCoreSyncReport(String solrCoreKey, String errorText,
			long durationMillis) {
		Instant now = Instant.now();
		return new SolrCoreSyncReport(solrCoreKey, false, false, 0, List.of(), List.of(), List.of(), List.of(),
				List.of(), errorText, now, durationMillis);
	}

	/** Solr antwortet, kennt den Kern aber nicht. */
	public static SolrCoreSyncReport createMissingSolrCoreSyncReport(String solrCoreKey, long durationMillis) {
		Instant now = Instant.now();
		return new SolrCoreSyncReport(solrCoreKey, true, false, 0, List.of(), List.of(), List.of(), List.of(),
				List.of(), null, now, durationMillis);
	}
}
