package de.gebiter.knowledge.dto;

import java.util.Map;

/**
 * Eine neue Wissensseite: je Feld sein Wert unter dem Namen des Feldes im Solr-Kern {@code KNOWLEDGE}, z. B.
 * {@code {"fieldValuesByFieldName": {"language": "de", "rubricKey": "MATHE", "chapterKey": "GRUNDLAGEN",
 * "pageKey": "KOORDINATENTRANSFORMATION", "title": "Koordinatentransformation", "content": "{\"blocks\":[]}",
 * "tags": ["polarkoordinaten"], "status": "PUBLISHED"}}}. Übernommen werden nur Felder mit „vom Client“ aus der
 * Feldtabelle des Kerns (SolrManager); alle anderen fallen still weg.
 */
public record NewKnowledgePage(Map<String, Object> fieldValuesByFieldName) {
}
