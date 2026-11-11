package de.gebiter.users.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.dto.UsersCredentialCheckRequest;
import de.gebiter.users.model.UsersCredential;
import de.gebiter.users.service.UsersCredentialService;
import de.gebiter.users.service.UsersService;

/**
 * Admin-Endpunkt der Klasse {@link UsersCredential}: die Prüfung eines Passworts, nur mit der AR ADMIN (Pfad
 * {@code /api/admin/**}). Er nutzt den {@link UsersCredentialService} und für die Prüfung, ob der User gelöscht ist, den
 * {@link UsersService}. Ein Repository nutzt er nie.
 * <p>
 * Kein CREATE und kein DELETE: Der Eintrag entsteht mit dem User und wird nie gelöscht. Kein READ und kein UPDATE: Den
 * Passwort-Hash liefert und ändert keine Methode nach außen. Der Login prüft das Passwort im Service selbst, nicht
 * hierüber.
 * <p>
 * Doku: {@code docu/entities/UsersCredential.md}.
 */
@RestController
@RequestMapping("/api/admin/users-credential")
public class UsersCredentialAdminController {

	private final UsersCredentialService usersCredentialService;

	private final UsersService usersService;

	public UsersCredentialAdminController(UsersCredentialService usersCredentialService, UsersService usersService) {
		this.usersCredentialService = usersCredentialService;
		this.usersService = usersService;
	}

	/**
	 * READ: Stimmt das Passwort? Antwort ist nur {@code true} oder {@code false}. Body:
	 * {@code {"usersGuid": "…", "sha256HexPassword": "…"}}.
	 * <p>
	 * Für einen gelöschten User ist die Antwort immer {@code false}, er kann sich nicht mehr anmelden.
	 * <p>
	 * TODO Spring Security: {@code usersGuid} kommt dann vom Current User, nicht mehr aus dem Body.
	 */
	@PostMapping("/check")
	public ResponseEntity<Boolean> checkUsersCredential(@RequestBody UsersCredentialCheckRequest checkRequest) {
		UUID requestedUsersGuid = checkRequest.usersGuid();
		String requestedSha256HexPassword = checkRequest.sha256HexPassword();

		boolean requestedUsersDeleted = usersService.isUsersDeleted(requestedUsersGuid);
		if (requestedUsersDeleted) {
			return ResponseEntity.ok(false);
		}

		boolean passwordMatches = usersCredentialService.checkUsersCredential(requestedUsersGuid,
				requestedSha256HexPassword);
		return ResponseEntity.ok(passwordMatches);
	}
}
