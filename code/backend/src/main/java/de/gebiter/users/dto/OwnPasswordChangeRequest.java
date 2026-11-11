package de.gebiter.users.dto;

/**
 * Das eigene Passwort ändern: das bisherige und das neue, beide im Frontend mit SHA-256 gehasht, als Hex-Text. Das
 * Klartext-Passwort kommt nie beim Server an.
 */
public record OwnPasswordChangeRequest(String currentSha256HexPassword, String newSha256HexPassword) {
}
