package de.gebiter.security.dto;

/**
 * Ergebnis einer neuen Sitzungskette beim Login, nur zwischen {@code UsersRefreshTokenService} und
 * {@code SessionService}. Der Token geht als HttpOnly-Cookie hinaus, nie im Body.
 *
 * @param refreshToken der Token im Klartext, für das Cookie
 * @param sessionNumber der Platz der Sitzung
 */
public record CreatedUsersRefreshToken(String refreshToken, int sessionNumber) {
}
