package de.gebiter.security.dto;

/**
 * Request Body für das Einlösen der Anmeldung: {@code POST /api/share/session}.
 *
 * @param loginToken der Anmeldeschein aus dem ersten Schritt des Logins
 * @param code der 6-stellige Code aus der Authenticator-App (beim Einrichten der erste), Leerzeichen erlaubt
 */
public record SessionClaimRequest(String loginToken, String code) {
}
