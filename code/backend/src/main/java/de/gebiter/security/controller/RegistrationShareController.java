package de.gebiter.security.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.security.dto.RegistrationRequest;
import de.gebiter.security.service.RegistrationService;
import de.gebiter.users.model.Users;

/**
 * Die Registrierung ohne Token (Pfad {@code /api/share/**}). Er nutzt nur den {@link RegistrationService}, nie ein
 * Repository.
 * <p>
 * Doku: {@code docu/entities/Users.md}.
 */
@RestController
@RequestMapping("/api/share/registration")
public class RegistrationShareController {

	private final RegistrationService registrationService;

	public RegistrationShareController(RegistrationService registrationService) {
		this.registrationService = registrationService;
	}

	/**
	 * CREATE: Registriert einen neuen User und liefert ihn. Body:
	 * {@code {"username": "…", "email": "…", "sha256HexPassword": "…"}}. Danach kann er sich sofort
	 * anmelden, über die 2FA wie jeder andere.
	 */
	@PostMapping
	public ResponseEntity<Users> createRegistration(@RequestBody RegistrationRequest registrationRequest) {
		String requestedUsername = registrationRequest.username();
		String requestedEmail = registrationRequest.email();
		String requestedSha256HexPassword = registrationRequest.sha256HexPassword();
		Users registeredUsers = registrationService.createRegistration(requestedUsername, requestedEmail,
				requestedSha256HexPassword);

		UUID registeredUsersGuid = registeredUsers.getGuid();
		String registeredUsersPath = "/api/users/" + registeredUsersGuid;
		URI registeredUsersLocation = URI.create(registeredUsersPath);
		return ResponseEntity.created(registeredUsersLocation).body(registeredUsers);
	}
}
