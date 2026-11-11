package de.gebiter.security.dto;

import de.gebiter.security.model.UsersLogin2faSecondFactor;

/**
 * Die Antwort auf den ersten Schritt des Logins ({@code POST /api/share/users-login-2fa}): der Anmeldeschein für das
 * Fenster mit dem Passwort und was als Zweites kommt, der Code aus der Authenticator-App oder erst ihr Einrichten.
 *
 * @param loginToken der Anmeldeschein: Mit ihm holt dieses Fenster beim Einrichten QR-Code und Schlüssel und löst am
 *            Ende mit dem Code die Sitzung ein
 * @param secondFactor {@code TOTP_CODE} oder {@code TOTP_SETUP}
 */
public record CreatedUsersLogin2fa(String loginToken, UsersLogin2faSecondFactor secondFactor) {
}
