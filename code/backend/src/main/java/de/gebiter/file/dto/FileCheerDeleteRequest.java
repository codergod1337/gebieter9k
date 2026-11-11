package de.gebiter.file.dto;

/** Die eigene Stimme zu einer Datei zurücknehmen: {@code {"fileDocumentId": "…"}}. Wer, kommt aus dem Token. */
public record FileCheerDeleteRequest(String fileDocumentId) {
}
