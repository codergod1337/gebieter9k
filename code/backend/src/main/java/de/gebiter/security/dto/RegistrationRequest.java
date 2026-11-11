package de.gebiter.security.dto;

/**
 * Request Body für die Registrierung: {@code POST /api/registration}.
 *
 * @param username der gewünschte Username, eindeutig
 * @param email die E-Mail-Adresse, eindeutig, mit ihr meldet sich der User an
 * @param sha256HexPassword das selbst gewählte Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text
 */
public record RegistrationRequest(String username, String email, String sha256HexPassword) {
}
