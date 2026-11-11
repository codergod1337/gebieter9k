package de.gebiter.security.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.security.dto.CreatedUsersLogin2fa;
import de.gebiter.security.dto.LoginRequest;
import de.gebiter.security.dto.UsersLogin2faTokenRequest;
import de.gebiter.security.dto.UsersTotpSetup;
import de.gebiter.security.service.UsersLogin2faService;

/**
 * Die Schritte 1 und 2 des Logins mit Pflicht-2FA, ohne Token (Pfad {@code /api/share/**}). Er nutzt nur den
 * {@link UsersLogin2faService}, nie ein Repository. Schritt 3, das Einlösen mit dem Code, steht im
 * {@link SessionShareController}.
 * <p>
 * Ablauf: E-Mail und Passwort ergeben einen Anmeldeschein und sagen, was als Zweites kommt: der Code aus der
 * Authenticator-App oder, ohne App, erst ihr Einrichten (dann holt das Fenster mit dem Schein QR-Code und Schlüssel).
 * <p>
 * Doku: {@code docu/entities/UsersLogin2fa.md}, {@code docu/entities/UsersTotp.md}.
 */
@RestController
@RequestMapping("/api/share/users-login-2fa")
public class UsersLogin2faShareController {

	private final UsersLogin2faService usersLogin2faService;

	public UsersLogin2faShareController(UsersLogin2faService usersLogin2faService) {
		this.usersLogin2faService = usersLogin2faService;
	}

	/**
	 * CREATE: Schritt 1. Body: {@code {"email": "…", "sha256HexPassword": "…"}}. Liefert den Anmeldeschein und
	 * {@code secondFactor}: {@code TOTP_CODE} oder {@code TOTP_SETUP}. Bei jedem Fehlschlag 401 mit derselben Meldung.
	 */
	@PostMapping
	public ResponseEntity<CreatedUsersLogin2fa> createUsersLogin2fa(@RequestBody LoginRequest loginRequest) {
		String requestedEmail = loginRequest.email();
		String requestedSha256HexPassword = loginRequest.sha256HexPassword();
		CreatedUsersLogin2fa createdUsersLogin2fa = usersLogin2faService.createUsersLogin2fa(requestedEmail,
				requestedSha256HexPassword);
		return ResponseEntity.status(HttpStatus.CREATED).body(createdUsersLogin2fa);
	}

	/**
	 * CREATE: Schritt 2 beim Einrichten (nur bei {@code TOTP_SETUP}). Body: {@code {"loginToken": "…"}}. Liefert Adresse
	 * für den QR-Code und Schlüssel zum Abtippen. Schein unbekannt oder abgelaufen: 401; App schon aktiv: 409.
	 */
	@PostMapping("/totp-setup")
	public ResponseEntity<UsersTotpSetup> createUsersLogin2faTotpSetup(@RequestBody UsersLogin2faTokenRequest tokenRequest) {
		String requestedLoginToken = tokenRequest.loginToken();
		UsersTotpSetup usersTotpSetup = usersLogin2faService.createUsersLogin2faTotpSetup(requestedLoginToken);
		return ResponseEntity.ok(usersTotpSetup);
	}
}
