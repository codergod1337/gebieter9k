package de.gebiter.users.dto;

import java.util.UUID;

/**
 * Request Body, mit dem der Admin einen User anlegt: {@code POST /api/admin/users} (Administration, Tab „User“, „neuer
 * User“). Dieselben Angaben wie bei der Registrierung, dazu wahlweise die GUID; das Passwort darf fehlen.
 * <p>
 * Doku: {@code docu/entities/Users.md}.
 *
 * @param guid die gewünschte GUID; fehlt sie, entsteht eine neue GUID Version 7
 * @param username der Username, eindeutig
 * @param email die E-Mail-Adresse, eindeutig, mit ihr meldet sich der User an
 * @param sha256HexPassword das Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text; fehlt es oder ist es leer, gilt
 *        das Startpasswort aus {@code gebiter.users.start-password}
 */
public record NewUsers(UUID guid, String username, String email, String sha256HexPassword) {
}
