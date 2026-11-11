package de.gebiter.solr.dto;

import org.apache.solr.common.SolrDocumentList;

/** Eine Seite einer Abfrage mit Cursor (cursorMark): die Dokumente und der Cursor für die nächste Seite. */
public record SolrCursorPage(SolrDocumentList documents, String nextCursorMark) {
}
