package de.gebiter.security.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.security.dto.UsersTotpCodeCheck;
import de.gebiter.security.dto.UsersTotpCodeRequest;
import de.gebiter.security.dto.UsersTotpDeleteRequest;
import de.gebiter.security.dto.UsersTotpSetup;
import de.gebiter.security.dto.UsersTotpStatus;
import de.gebiter.security.service.UsersTotpService;

/**
 * Endpunkte der eigenen Authenticator-App (TOTP), für jeden angemeldeten User (Pfad {@code /api/**}); jeder sieht und
 * ändert nur seine eigene. Er nutzt nur den {@link UsersTotpService}.
 * <p>
 * Doku: {@code docu/entities/UsersTotp.md}.
 */
@RestController
@RequestMapping("/api/users-totp")
public class UsersTotpController {

	private final UsersTotpService usersTotpService;

	public UsersTotpController(UsersTotpService usersTotpService) {
		this.usersTotpService = usersTotpService;
	}

	/** CREATE: Neues Geheimnis, liefert QR-Adresse und Text zum Abtippen. Ohne Body. */
	@PostMapping("/setup")
	public ResponseEntity<UsersTotpSetup> createOwnUsersTotpSetup() {
		UsersTotpSetup usersTotpSetup = usersTotpService.createOwnUsersTotpSetup();
		return ResponseEntity.ok(usersTotpSetup);
	}

	/** READ: Der Stand der eigenen App (NONE, PENDING, ACTIVE). */
	@GetMapping
	public ResponseEntity<UsersTotpStatus> getOwnUsersTotpStatus() {
		UsersTotpStatus usersTotpStatus = usersTotpService.getOwnUsersTotpStatus();
		return ResponseEntity.ok(usersTotpStatus);
	}

	/** READ: Testet einen Code gegen die aktive App. Body: {@code {"code": "492039"}}. */
	@PostMapping("/check")
	public ResponseEntity<UsersTotpCodeCheck> checkOwnUsersTotpCode(@RequestBody UsersTotpCodeRequest codeRequest) {
		String code = codeRequest.code();
		UsersTotpCodeCheck usersTotpCodeCheck = usersTotpService.checkOwnUsersTotpCode(code);
		return ResponseEntity.ok(usersTotpCodeCheck);
	}

	/** UPDATE: Bestätigt das Einrichten mit dem ersten Code. Body: {@code {"code": "492039"}}. */
	@PutMapping("/confirm")
	public ResponseEntity<UsersTotpStatus> confirmOwnUsersTotp(@RequestBody UsersTotpCodeRequest codeRequest) {
		String code = codeRequest.code();
		UsersTotpStatus usersTotpStatus = usersTotpService.confirmOwnUsersTotp(code);
		return ResponseEntity.ok(usersTotpStatus);
	}

	/**
	 * DELETE: Schaltet die eigene App ab; ist sie aktiv, mit gültigem Code oder dem Schlüssel von der Einrichtung. Body:
	 * {@code {"code": "492039"}} oder {@code {"secretBase32": "GEZD GNBV …"}}.
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnUsersTotp(@RequestBody UsersTotpDeleteRequest deleteRequest) {
		String code = deleteRequest.code();
		String secretBase32 = deleteRequest.secretBase32();
		usersTotpService.deleteOwnUsersTotp(code, secretBase32);
		return ResponseEntity.noContent().build();
	}
}
