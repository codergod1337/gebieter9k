package de.gebiter.security.dto;

import java.util.UUID;

/**
 * Für den Admin: die Authenticator-App welches Users, z. B. {@code {"usersGuid": "…"}} beim Entfernen. Eigener Record,
 * weil {@code UsersTotp} als Entity keine Werte von außen annimmt.
 *
 * @param usersGuid der User
 */
public record UsersTotpUsersRequest(UUID usersGuid) {
}
