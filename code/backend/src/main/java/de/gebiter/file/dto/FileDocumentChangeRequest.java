package de.gebiter.file.dto;

import java.util.Map;

/**
 * Metadaten ändern: die id und je Feld der neue Wert, z. B. {@code {"id": "…", "fieldValuesByFieldName": {"fileDescription": "Neu",
 * "tags": ["a", "b"], "description": ""}}}. Nur die genannten Felder; ein leerer Wert nimmt das Feld heraus. Felder, die der
 * Client nicht ändern darf, fallen still weg.
 */
public record FileDocumentChangeRequest(String id, Map<String, Object> fieldValuesByFieldName) {
}
