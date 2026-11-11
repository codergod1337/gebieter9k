package de.gebiter.solr.dto;

import java.util.List;

/**
 * Die neue Reihenfolge der Felder eines Kerns nach Drag and Drop im Kern-Tab: der Kern und alle Feldnamen des Kerns, von
 * oben nach unten. Body: {@code {"solrCoreKey": "FILE", "solrFieldNamesInOrder": ["id", "sftpPath", …]}}. Das erste Feld
 * bekommt Platz 1.
 */
public record SolrFieldListingOrder(String solrCoreKey, List<String> solrFieldNamesInOrder) {
}
