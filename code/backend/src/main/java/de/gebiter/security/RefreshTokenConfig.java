package de.gebiter.security;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Das Cookie des Refresh-Tokens, gelesen aus {@code gebiter.cookie.*} und {@code gebiter.refresh-token.*} in der
 * {@code application.yaml}. Beim Löschen müssen Name, Pfad und alle übrigen Angaben genau denen beim Setzen
 * entsprechen, sonst findet der Browser das Cookie nicht wieder; deshalb beides an dieser einen Stelle.
 * <p>
 * Das Cookie ist HttpOnly (kein JavaScript kommt daran) und SameSite=Strict (keine fremde Seite lässt es mitschicken).
 * Der Browser schickt es nur an den Pfad der Sitzung ({@code gebiter.cookie.refresh-token-path}): Abholen, Erneuern,
 * Abmelden. Es hält 14 Tage, auch über einen Neustart des Browsers.
 */
@Component
public class RefreshTokenConfig {

	private final String refreshTokenCookieName;

	private final String refreshTokenCookiePath;

	private final boolean cookieSecure;

	/** Wie lange ein Refresh-Token und sein Cookie gelten, aus {@code gebiter.refresh-token.validity}. */
	private final Duration refreshTokenValidity;

	public RefreshTokenConfig(@Value("${gebiter.cookie.refresh-token-name}") String refreshTokenCookieName,
			@Value("${gebiter.cookie.refresh-token-path}") String refreshTokenCookiePath,
			@Value("${gebiter.cookie.secure}") boolean cookieSecure,
			@Value("${gebiter.refresh-token.validity}") Duration refreshTokenValidity) {
		this.refreshTokenCookieName = refreshTokenCookieName;
		this.refreshTokenCookiePath = refreshTokenCookiePath;
		this.cookieSecure = cookieSecure;
		this.refreshTokenValidity = refreshTokenValidity;
	}

	public String refreshTokenCookieName() {
		return refreshTokenCookieName;
	}

	public Duration refreshTokenValidity() {
		return refreshTokenValidity;
	}

	/** Das Cookie mit dem Refresh-Token, volle Laufzeit. */
	public ResponseCookie refreshTokenCookie(String refreshToken) {
		return createRefreshTokenCookie(refreshToken, refreshTokenValidity);
	}

	/** Dasselbe Cookie leer und sofort abgelaufen, zum Abmelden. */
	public ResponseCookie expiredRefreshTokenCookie() {
		return createRefreshTokenCookie("", Duration.ZERO);
	}

	private ResponseCookie createRefreshTokenCookie(String refreshToken, Duration maxAge) {
		ResponseCookie.ResponseCookieBuilder refreshTokenCookieBuilder = ResponseCookie.from(refreshTokenCookieName,
				refreshToken);
		refreshTokenCookieBuilder.httpOnly(true);
		refreshTokenCookieBuilder.secure(cookieSecure);
		refreshTokenCookieBuilder.sameSite("Strict");
		refreshTokenCookieBuilder.path(refreshTokenCookiePath);
		refreshTokenCookieBuilder.maxAge(maxAge);
		return refreshTokenCookieBuilder.build();
	}
}
