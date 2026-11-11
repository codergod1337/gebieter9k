package de.gebiter.security.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.security.dto.UsersTotpStatus;
import de.gebiter.security.dto.UsersTotpUsersRequest;
import de.gebiter.security.service.UsersTotpService;

/**
 * Admin-Endpunkte der Authenticator-App (TOTP) jedes Users (Pfad {@code /api/admin/**}, nur ADMIN): den Stand ansehen
 * und die App entfernen, wenn der User Handy und Schlüssel verloren hat. Er nutzt nur den {@link UsersTotpService}.
 * <p>
 * Doku: {@code docu/entities/UsersTotp.md}.
 */
@RestController
@RequestMapping("/api/admin/users-totp")
public class UsersTotpAdminController {

	private final UsersTotpService usersTotpService;

	public UsersTotpAdminController(UsersTotpService usersTotpService) {
		this.usersTotpService = usersTotpService;
	}

	/** READ: Der Stand der App dieses Users (NONE, PENDING, ACTIVE). */
	@GetMapping("/{usersGuid}")
	public ResponseEntity<UsersTotpStatus> getUsersTotpStatus(@PathVariable UUID usersGuid) {
		UsersTotpStatus usersTotpStatus = usersTotpService.getUsersTotpStatus(usersGuid);
		return ResponseEntity.ok(usersTotpStatus);
	}

	/** DELETE: Entfernt die App dieses Users, ohne Code. Body: {@code {"usersGuid": "…"}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteUsersTotp(@RequestBody UsersTotpUsersRequest usersRequest) {
		UUID usersGuid = usersRequest.usersGuid();
		usersTotpService.deleteUsersTotp(usersGuid);
		return ResponseEntity.noContent().build();
	}
}
