package de.gebiter.file.dto;

/**
 * Meldung: Die Datei {@code fileDocumentId} ist gerade endgültig gelöscht worden (Dokument und Bytes sind weg). Der
 * {@link de.gebiter.file.service.FileCheerService} löscht daraufhin ihre Stimmen, damit in Postgres nichts
 * zurückbleibt. So braucht der {@link de.gebiter.file.service.FileDocumentWriteService} den FileCheerService nicht, der
 * ihn selbst schon nutzt (kein Kreis).
 */
public record FileDocumentFinallyDeletedEvent(String fileDocumentId) {
}
