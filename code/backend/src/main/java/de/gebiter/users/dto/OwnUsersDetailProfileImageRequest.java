package de.gebiter.users.dto;

/**
 * Das eigene Profilbild setzen: das im Browser zugeschnittene PNG groß und klein als Base64 ohne Präfix, immer beide.
 * Beide {@code null} oder leer entfernen es.
 */
public record OwnUsersDetailProfileImageRequest(String profileImageBase64Png, String profileImageSmallBase64Png) {
}
