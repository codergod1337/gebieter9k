package de.gebiter.users.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.dto.NewUsers;
import de.gebiter.users.model.Users;
import de.gebiter.users.service.UsersService;

/**
 * Admin-Endpunkte der Klasse {@link Users}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}, geprüft in der
 * {@code SecurityConfig}). Er nutzt nur den {@link UsersService}, nie ein Repository. Hier steht, was der normale User
 * nicht darf, auch das Lesen ohne die Regel der Sichtbarkeit: Der Admin hat Vollzugriff, aber nur über diese Endpunkte.
 * <p>
 * Doku: {@code docu/entities/Users.md}.
 */
@RestController
@RequestMapping("/api/admin/users")
public class UsersAdminController {

	private final UsersService usersService;

	public UsersAdminController(UsersService usersService) {
		this.usersService = usersService;
	}

	/**
	 * CREATE: Legt einen User an wie bei der Registrierung, samt {@code UsersDetail} und Passwort (Nutzer 2026-11-11).
	 * Body: {@code {"username": "…", "email": "…", "guid": "…", "sha256HexPassword": "…"}}; {@code guid} und
	 * {@code sha256HexPassword} dürfen fehlen. Steht dort eine GUID, wird sie übernommen, sonst entsteht eine neue GUID
	 * Version 7. Fehlt das Passwort, gilt das Startpasswort aus {@code gebiter.users.start-password}. Eine
	 * Authenticator-App hat der neue User noch nicht, er richtet sie bei der ersten Anmeldung ein. Alles Weitere setzt
	 * danach {@code PUT}.
	 */
	@PostMapping
	public ResponseEntity<Users> createUsers(@RequestBody NewUsers newUsers) {
		UUID requestedUsersGuid = newUsers.guid();
		String requestedUsername = newUsers.username();
		String requestedEmail = newUsers.email();
		String requestedSha256HexPassword = newUsers.sha256HexPassword();

		Users createdUsers = usersService.createUsersWithPassword(requestedUsersGuid, requestedUsername, requestedEmail,
				requestedSha256HexPassword);

		UUID createdUsersGuid = createdUsers.getGuid();
		String createdUsersPath = "/api/admin/users/" + createdUsersGuid;
		URI createdUsersLocation = URI.create(createdUsersPath);
		return ResponseEntity.created(createdUsersLocation).body(createdUsers);
	}

	/** READ: Ein User über seine GUID, ganz, ohne Regel der Sichtbarkeit. Ein gelöschter User ergibt 404. */
	@GetMapping("/{usersGuid}")
	public ResponseEntity<Users> getUsers(@PathVariable UUID usersGuid) {
		Users foundUsers = usersService.getUsers(usersGuid);
		return ResponseEntity.ok(foundUsers);
	}

	/** READ: Alle User außer den gelöschten, ganz. */
	@GetMapping
	public ResponseEntity<List<Users>> getAllUsers() {
		List<Users> allUsers = usersService.getAllUsers();
		return ResponseEntity.ok(allUsers);
	}

	/** READ: Alle gelöschten User. Nur hier, normale User sehen gelöschte User nie. */
	@GetMapping("/deleted")
	public ResponseEntity<List<Users>> getDeletedUsers() {
		List<Users> deletedUsers = usersService.getDeletedUsers();
		return ResponseEntity.ok(deletedUsers);
	}

	/**
	 * UPDATE: Ändert einen User. Der Body ist das volle Objekt samt {@code guid}: erst per {@code GET}
	 * holen, ändern, ganz zurückschicken. Fehlende Felder gelten als leer, nicht als unverändert. Den
	 * Status ändert {@code PUT} nie, ein gelöschter User ergibt 404.
	 */
	@PutMapping
	public ResponseEntity<Users> changeUsers(@RequestBody Users changedUsers) {
		Users savedUsers = usersService.changeUsers(changedUsers);
		return ResponseEntity.ok(savedUsers);
	}

	/**
	 * DELETE: Setzt den Status des Users auf {@code DELETED}, gelöscht wird nichts. Danach kann er sich
	 * nicht mehr anmelden und ist für normale User unsichtbar. Im Body reicht {@code {"guid": "…"}}.
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteUsers(@RequestBody Users usersToDelete) {
		UUID usersGuid = usersToDelete.getGuid();
		usersService.deleteUsers(usersGuid);
		return ResponseEntity.noContent().build();
	}
}
