package de.gebiter.users.dto;

import java.util.UUID;

/**
 * Request Body für die Prüfung des Passworts: {@code POST /api/users-credential/check}.
 * <p>
 * TODO Spring Security: {@code usersGuid} fällt dann weg, die GUID kommt vom Current User.
 *
 * @param sha256HexPassword das Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text
 */
public record UsersCredentialCheckRequest(UUID usersGuid, String sha256HexPassword) {
}
