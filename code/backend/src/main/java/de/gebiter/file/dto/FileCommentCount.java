package de.gebiter.file.dto;

/**
 * Wie viele Kommentare eine Datei hat, für die Sprechblase an ihrer Kachel: Die Kachel steht schon da, die Zahl lädt sie
 * danach nach (Nutzer 2026-11-20).
 *
 * @param fileDocumentId die Datei
 * @param commentCount die Zahl ihrer Kommentare
 */
public record FileCommentCount(String fileDocumentId, long commentCount) {
}
