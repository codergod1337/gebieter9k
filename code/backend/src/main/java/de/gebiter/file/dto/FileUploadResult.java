package de.gebiter.file.dto;

import java.util.Map;

import de.gebiter.file.model.FileUploadStatus;

/**
 * Die Antwort auf einen Upload.
 *
 * @param status neu angelegt oder schon vorhanden
 * @param id der SHA-256 der Bytes, zugleich die id des Dokuments
 * @param document das Dokument mit den Feldern, die der User lesen darf; {@code null}, wenn er es nicht lesen darf
 *        (dann heißt EXISTS: „gibt es schon, du darfst sie nicht hochladen“)
 */
public record FileUploadResult(FileUploadStatus status, String id, Map<String, Object> document) {
}
