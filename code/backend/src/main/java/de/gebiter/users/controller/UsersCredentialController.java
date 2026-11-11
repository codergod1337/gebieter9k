package de.gebiter.users.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.dto.OwnPasswordChangeRequest;
import de.gebiter.users.model.UsersCredential;
import de.gebiter.users.service.UsersCredentialService;

/**
 * Endpunkt der Klasse {@link UsersCredential} für jeden angemeldeten User: nur das eigene Passwort ändern (Profil,
 * „Sicherheit“). Er nutzt nur den {@link UsersCredentialService}. Den Passwort-Hash liefert nie ein Endpunkt.
 * <p>
 * Doku: {@code docu/entities/UsersCredential.md}.
 */
@RestController
@RequestMapping("/api/users-credential")
public class UsersCredentialController {

	private final UsersCredentialService usersCredentialService;

	public UsersCredentialController(UsersCredentialService usersCredentialService) {
		this.usersCredentialService = usersCredentialService;
	}

	/**
	 * UPDATE: Ändert das eigene Passwort. Body: {@code {"currentSha256HexPassword": "…", "newSha256HexPassword": "…"}},
	 * beide im Frontend mit SHA-256 gehasht.
	 */
	@PutMapping
	public ResponseEntity<Void> changeOwnUsersCredential(@RequestBody OwnPasswordChangeRequest passwordChangeRequest) {
		String currentSha256HexPassword = passwordChangeRequest.currentSha256HexPassword();
		String newSha256HexPassword = passwordChangeRequest.newSha256HexPassword();
		usersCredentialService.changeOwnUsersCredential(currentSha256HexPassword, newSha256HexPassword);
		return ResponseEntity.noContent().build();
	}
}
