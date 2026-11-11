package de.gebiter.users.dto;

import java.util.Map;

/**
 * Den eigenen Text „Über mich“ setzen: mehrsprachiger Rich-Text, je Sprachkürzel das HTML aus dem Rich-Text-Editor (das
 * Backend bereinigt es). Ohne Inhalt oder {@code null} entfernt ihn.
 */
public record OwnUsersDetailAboutTextRequest(Map<String, String> aboutText) {
}
