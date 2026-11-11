package de.gebiter.users.dto;

/**
 * Eine eigene Einstellung setzen: Schlüssel nach der Key-Regel (z. B. {@code TABLE_SOLR_FIELD}) und Wert, z. B. die
 * Spaltenbreiten einer Tabelle als JSON.
 */
public record OwnUsersSettingSaveRequest(String settingKey, String settingValue) {
}
