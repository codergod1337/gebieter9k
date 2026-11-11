package de.gebiter.file.dto;

/** Ein Vorschlag der Feldwert-Suche: der vorhandene Wert, so wie er gespeichert ist, und an wie vielen Dateien er steht. */
public record FileFieldValueSuggestion(String value, long fileCount) {
}
