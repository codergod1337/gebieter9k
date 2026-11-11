package de.gebiter.file.dto;

import java.util.Map;

/**
 * Auflösen: je Feld genau ein Sollwert, mehrere Felder müssen alle passen. Z. B. {@code {"exactValueByFieldName":
 * {"fileClassKey": "FOTO_URLAUB"}, "page": 0}}.
 *
 * @param exactValueByFieldName Feldname (Solr) und der Wert, den das Feld genau haben muss
 * @param page die Seite, ab 0
 */
public record FileDocumentResolveRequest(Map<String, String> exactValueByFieldName, int page) {
}
