package de.gebiter.file.dto;

/** Ein Body, der nur die id einer Datei nennt, z. B. zum Löschen: {@code {"id": "…"}}. */
public record FileDocumentIdRequest(String id) {
}
