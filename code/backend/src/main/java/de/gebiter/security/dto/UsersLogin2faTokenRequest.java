package de.gebiter.security.dto;

/**
 * Request Body mit nur dem Anmeldeschein, z. B. für {@code POST /api/share/users-login-2fa/totp-setup}.
 *
 * @param loginToken der Anmeldeschein aus dem ersten Schritt des Logins
 */
public record UsersLogin2faTokenRequest(String loginToken) {
}
