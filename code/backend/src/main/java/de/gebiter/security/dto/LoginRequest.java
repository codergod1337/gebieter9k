package de.gebiter.security.dto;

/**
 * Request Body für Schritt 1 des Logins: {@code POST /api/share/users-login-2fa}.
 *
 * @param email die E-Mail-Adresse, mit der sich der User anmeldet
 * @param sha256HexPassword das Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text
 */
public record LoginRequest(String email, String sha256HexPassword) {
}
