package de.gebiter.file.dto;

/** Werte eines Feldes suchen, z. B. Tags beim Tippen: welches Feld und der getippte Anfang. */
public record FileFieldValueSearchRequest(String fieldName, String searchText) {
}
