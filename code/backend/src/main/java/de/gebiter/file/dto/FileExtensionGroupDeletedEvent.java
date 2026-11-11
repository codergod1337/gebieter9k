package de.gebiter.file.dto;

/**
 * Meldung: Die Gruppe {@code fileExtensionGroupKey} wird gerade gelöscht, in der laufenden Transaktion. Der
 * {@link de.gebiter.file.service.FileExtensionService} nimmt sie daraufhin von seinen Endungen. So bleibt jeder Service
 * bei seinem eigenen Repository, ohne dass die beiden Services einander im Kreis brauchen.
 */
public record FileExtensionGroupDeletedEvent(String fileExtensionGroupKey) {
}
