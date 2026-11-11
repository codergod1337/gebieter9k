package de.gebiter.security.dto;

import java.time.Instant;

/**
 * Was beim Einlösen eines Codes für den Login herauskam. Bleibt im Backend.
 *
 * @param accepted der Code hat gepasst
 * @param codeLockedUntil gesetzt, wenn der Login für diesen User gesperrt ist (schon vorher oder ab diesem Fehlversuch),
 *            sonst {@code null}
 */
public record UsersTotpCodeRedemption(boolean accepted, Instant codeLockedUntil) {
}
