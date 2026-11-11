package de.gebiter.security.dto;

/**
 * Ergebnis eines erfolgreichen Logins oder einer Erneuerung, nur zwischen {@code SessionService} und
 * {@code SessionShareController}. JWT und Refresh-Token gehen als Cookies hinaus, nie im Body.
 *
 * @param jwt das signierte Token
 * @param refreshToken der Refresh-Token im Klartext
 * @param sessionInfo die Antwort für das Frontend
 */
public record CreatedSession(String jwt, String refreshToken, SessionInfo sessionInfo) {
}
