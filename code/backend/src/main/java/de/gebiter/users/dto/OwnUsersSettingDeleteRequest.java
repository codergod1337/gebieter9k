package de.gebiter.users.dto;

/** Eine eigene Einstellung löschen: nur der Schlüssel, z. B. {@code TABLE_SOLR_FIELD}. */
public record OwnUsersSettingDeleteRequest(String settingKey) {
}
