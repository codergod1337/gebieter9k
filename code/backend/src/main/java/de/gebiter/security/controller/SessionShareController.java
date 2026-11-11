package de.gebiter.security.controller;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.security.JwtConfig;
import de.gebiter.security.RefreshTokenConfig;
import de.gebiter.security.dto.CreatedSession;
import de.gebiter.security.dto.SessionClaimRequest;
import de.gebiter.security.dto.SessionInfo;
import de.gebiter.security.service.SessionService;

/**
 * Die Sitzung ohne Token (Pfad {@code /api/share/**}): abholen nach der 2FA, erneuern und abmelden. Er nutzt nur den
 * {@link SessionService}, nie ein Repository. Die eigene Sitzung lesen steht im {@link SessionController}.
 * <p>
 * JWT und Refresh-Token gehen ausschließlich als HttpOnly-Cookies hinaus, nie im Body: JavaScript sieht sie nie. Den
 * Refresh-Token schickt der Browser nur an diesen Pfad ({@code gebiter.cookie.refresh-token-path}).
 * <p>
 * Doku: {@code docu/entities/Users.md}.
 */
@RestController
@RequestMapping("/api/share/session")
public class SessionShareController {

	private final SessionService sessionService;

	private final JwtConfig jwtConfig;

	private final RefreshTokenConfig refreshTokenConfig;

	public SessionShareController(SessionService sessionService, JwtConfig jwtConfig,
			RefreshTokenConfig refreshTokenConfig) {
		this.sessionService = sessionService;
		this.jwtConfig = jwtConfig;
		this.refreshTokenConfig = refreshTokenConfig;
	}

	/**
	 * CREATE: Schritt 3 des Logins, einmalig. Body: {@code {"loginToken": "…", "code": "492039"}}. Antwort: die Sitzung,
	 * JWT und Refresh-Token stehen als Cookies in der Antwort. Schein unbekannt oder abgelaufen, Code falsch: 401 mit
	 * Grund (bei falschem Code auch, wie viele Versuche bleiben).
	 */
	@PostMapping
	public ResponseEntity<SessionInfo> createSession(@RequestBody SessionClaimRequest sessionClaimRequest) {
		String requestedLoginToken = sessionClaimRequest.loginToken();
		String requestedCode = sessionClaimRequest.code();
		CreatedSession createdSession = sessionService.createSession(requestedLoginToken, requestedCode);
		HttpHeaders sessionCookieHeaders = createSessionCookieHeaders(createdSession);
		SessionInfo sessionInfo = createdSession.sessionInfo();

		ResponseEntity.BodyBuilder okResponse = ResponseEntity.ok();
		okResponse.headers(sessionCookieHeaders);
		return okResponse.body(sessionInfo);
	}

	/**
	 * CREATE: Erneuert die Sitzung mit dem Refresh-Token aus dem Cookie, ohne Body. Antwort: die Sitzung, dazu neues JWT
	 * und neuer Refresh-Token als Cookies. Fehlt das Cookie oder gilt es nicht mehr: 401. Ein gescheitertes Erneuern
	 * darf das Frontend nie automatisch wiederholen: Der Token ist dann verbraucht, ein zweiter Versuch sähe aus wie
	 * Diebstahl.
	 */
	@PostMapping("/refresh")
	public ResponseEntity<SessionInfo> refreshSession(
			@CookieValue(name = "${gebiter.cookie.refresh-token-name}", required = false) String refreshToken) {
		CreatedSession refreshedSession = sessionService.refreshSession(refreshToken);
		HttpHeaders sessionCookieHeaders = createSessionCookieHeaders(refreshedSession);
		SessionInfo sessionInfo = refreshedSession.sessionInfo();

		ResponseEntity.BodyBuilder okResponse = ResponseEntity.ok();
		okResponse.headers(sessionCookieHeaders);
		return okResponse.body(sessionInfo);
	}

	/**
	 * DELETE: Logout. Beendet die Sitzung dieses Geräts und löscht beide Cookies im Browser. Immer 204, auch ohne oder
	 * mit unbekanntem Cookie: Ein Logout darf nie scheitern. Ein bereits kopiertes JWT bliebe bis zu seinem Ablauf
	 * gültig.
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteSession(
			@CookieValue(name = "${gebiter.cookie.refresh-token-name}", required = false) String refreshToken) {
		sessionService.deleteSession(refreshToken);
		ResponseCookie expiredJwtCookie = jwtConfig.expiredJwtCookie();
		String expiredJwtCookieHeader = expiredJwtCookie.toString();
		ResponseCookie expiredRefreshTokenCookie = refreshTokenConfig.expiredRefreshTokenCookie();
		String expiredRefreshTokenCookieHeader = expiredRefreshTokenCookie.toString();

		ResponseEntity.HeadersBuilder<?> noContentResponse = ResponseEntity.noContent();
		noContentResponse.header(HttpHeaders.SET_COOKIE, expiredJwtCookieHeader, expiredRefreshTokenCookieHeader);
		return noContentResponse.build();
	}

	/** Die zwei Cookies einer ausgestellten Sitzung: JWT und Refresh-Token. */
	private HttpHeaders createSessionCookieHeaders(CreatedSession createdSession) {
		String jwt = createdSession.jwt();
		Duration jwtValidity = jwtConfig.jwtValidity();
		ResponseCookie jwtCookie = jwtConfig.jwtCookie(jwt, jwtValidity);
		String jwtCookieHeader = jwtCookie.toString();
		String refreshToken = createdSession.refreshToken();
		ResponseCookie refreshTokenCookie = refreshTokenConfig.refreshTokenCookie(refreshToken);
		String refreshTokenCookieHeader = refreshTokenCookie.toString();

		HttpHeaders sessionCookieHeaders = new HttpHeaders();
		sessionCookieHeaders.add(HttpHeaders.SET_COOKIE, jwtCookieHeader);
		sessionCookieHeaders.add(HttpHeaders.SET_COOKIE, refreshTokenCookieHeader);
		return sessionCookieHeaders;
	}
}
