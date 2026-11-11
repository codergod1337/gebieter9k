package de.gebiter.solr.dto;

/**
 * Die Definition eines Kerns in Postgres hat sich geändert: ein Feld oder eine Referenz. Die Services schicken es nach
 * dem Commit, der {@code SolrSchemaSyncService} gleicht daraufhin Solr an.
 *
 * @param solrCoreKey der geänderte Kern; {@code null}: alle Kerne, z. B. nach einer Referenz, die jeder Kern hat
 */
public record SolrDefinitionChangedEvent(String solrCoreKey) {
}
