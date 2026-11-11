package de.gebiter.users.dto;

import java.util.UUID;

/**
 * Was ein anderer vom User selbst sieht, wenn er dessen Profil sehen darf: GUID, Name, Position und Punkte. Nie die
 * E-Mail-Adresse (die dient nur der Anmeldung und Mails des Systems) und nie seine Einstellungen.
 */
public record UsersForProfile(UUID guid, String username, String accessRoleCollectionKey, long points) {
}
