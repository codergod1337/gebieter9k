package de.gebiter.file.dto;

import de.gebiter.file.model.FileCheerDirection;

/**
 * Eine Stimme abgeben: zu welcher Datei und in welche Richtung, z. B. {@code {"fileDocumentId": "…", "direction":
 * "UP"}}. Wer stimmt, kommt aus dem Token.
 */
public record NewFileCheer(String fileDocumentId, FileCheerDirection direction) {
}
