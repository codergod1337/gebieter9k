package de.gebiter.knowledge.dto;

import java.util.Map;

/**
 * Eine Wissensseite ändern: die id und je Feld der neue Wert, z. B.
 * {@code {"id": "3f2a…_de", "fieldValuesByFieldName": {"status": "PUBLISHED", "summary": ""}}}. Nur die genannten Felder;
 * ein leerer Wert nimmt das Feld heraus. Felder ohne „vom Client“ in der Feldtabelle des Kerns fallen still weg.
 */
public record KnowledgePageChangeRequest(String id, Map<String, Object> fieldValuesByFieldName) {
}
