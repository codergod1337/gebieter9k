package de.gebiter.file.dto;

/**
 * Meldung: Die Endung {@code fileExtension} wird gerade gelöscht, in der laufenden Transaktion. Der
 * {@link de.gebiter.file.service.FileClassFileExtensionService} entfernt daraufhin ihre Freischaltungen an den
 * FileClasses. So bleibt jeder Service bei seinem eigenen Repository, ohne dass die beiden Services einander im Kreis
 * brauchen.
 */
public record FileExtensionDeletedEvent(String fileExtension) {
}
