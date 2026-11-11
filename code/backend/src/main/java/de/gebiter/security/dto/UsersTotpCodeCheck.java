package de.gebiter.security.dto;

/** Das Ergebnis des Tests eines Codes: passt er, und wenn nicht, warum vermutlich nicht. */
public record UsersTotpCodeCheck(boolean valid, String message) {
}
