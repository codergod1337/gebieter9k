package de.gebiter.file.dto;

import java.util.List;
import java.util.Map;

/**
 * Eine Seite Dateien aus dem Auflösen, jede so, wie der User sie lesen darf.
 *
 * @param documents die Dokumente der Seite, neueste zuerst
 * @param totalCount wie viele Dateien insgesamt passen
 * @param page die Seite, ab 0
 * @param pageSize so viele Dateien je Seite
 */
public record FileDocumentPage(List<Map<String, Object>> documents, long totalCount, int page, int pageSize) {
}
