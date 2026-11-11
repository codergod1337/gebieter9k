package de.gebiter.file.dto;

import java.util.Map;

/**
 * Gibt es eine Datei mit diesem SHA-256 schon? Für die Vorprüfung im Browser, bevor hochgeladen wird.
 *
 * @param exists ob es sie gibt, egal mit welchem Status und ob der User sie lesen darf
 * @param document das Dokument, wenn der User es lesen darf, sonst {@code null}
 */
public record FileDocumentExistence(boolean exists, Map<String, Object> document) {
}
