package de.gebiter.users.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.status.model.Visibility;
import de.gebiter.users.dto.OwnUsersVisibilityRequest;
import de.gebiter.users.dto.UsersAvatarForClient;
import de.gebiter.users.dto.UsersAvatarResolveRequest;
import de.gebiter.users.dto.UsersForClient;
import de.gebiter.users.model.Users;
import de.gebiter.users.service.UsersService;

/**
 * Endpunkte der Klasse {@link Users} für jeden angemeldeten User (AR USER oder ADMIN). Er nutzt nur den
 * {@link UsersService}, nie ein Repository. Gelesen wird nach der einen Regel der Sichtbarkeit: den ganzen User nur, wenn
 * man sein Profil sehen darf, sonst nur die GUID. Gelöschte sieht man hier nie. Geändert wird nur Eigenes, die GUID kommt
 * aus dem Token.
 * <p>
 * Alles lesen sowie fremde User anlegen, ändern oder löschen steht im {@link UsersAdminController}.
 * <p>
 * Doku: {@code docu/entities/Users.md}.
 */
@RestController
@RequestMapping("/api/users")
public class UsersController {

	private final UsersService usersService;

	public UsersController(UsersService usersService) {
		this.usersService = usersService;
	}

	/**
	 * READ: Ein User über seine GUID, nach seiner Sichtbarkeit: der ganze User mit {@code profileVisible = true}, oder nur
	 * die GUID mit {@code profileVisible = false}. Ein gelöschter oder unbekannter User ergibt 404.
	 */
	@GetMapping("/{usersGuid}")
	public ResponseEntity<UsersForClient> getUsersForClient(@PathVariable UUID usersGuid) {
		UsersForClient usersForClient = usersService.getUsersForClient(usersGuid);
		return ResponseEntity.ok(usersForClient);
	}

	/**
	 * READ: Avatar und Name eines Users aus seiner GUID, überall gleich darzustellen, nach seiner Sichtbarkeit: sichtbar mit
	 * Name, kleinem Profilbild und Farben, privat anonym, gelöscht ohne Name. Nie 404.
	 */
	@GetMapping("/avatar/{usersGuid}")
	public ResponseEntity<UsersAvatarForClient> getUsersAvatarForClient(@PathVariable UUID usersGuid) {
		UsersAvatarForClient usersAvatarForClient = usersService.getUsersAvatarForClient(usersGuid);
		return ResponseEntity.ok(usersAvatarForClient);
	}

	/**
	 * READ (Auflösen): Avatar und Name mehrerer User in einer Anfrage, je GUID wie
	 * {@link #getUsersAvatarForClient(UUID)}, in der Reihenfolge der GUIDs. Body: {@code {"usersGuids": ["…", "…"]}}. Für
	 * Listen von Usern, z. B. wer für eine Datei gestimmt hat: eine Anfrage statt einer je User.
	 */
	@PostMapping("/avatar/resolve")
	public ResponseEntity<List<UsersAvatarForClient>> resolveUsersAvatarsForClient(
			@RequestBody UsersAvatarResolveRequest resolveRequest) {
		List<UUID> usersGuids = resolveRequest.usersGuids();
		List<UsersAvatarForClient> usersAvatarsForClient = usersService.resolveUsersAvatarsForClient(usersGuids);
		return ResponseEntity.ok(usersAvatarsForClient);
	}

	/**
	 * UPDATE: Die eigene Sichtbarkeit einstellen. Body: {@code {"profileVisibility": "FRIENDS", "friendListVisibility":
	 * "NONE"}}. Liefert den eigenen User mit dem neuen Stand.
	 */
	@PutMapping("/visibility")
	public ResponseEntity<Users> changeOwnUsersVisibility(@RequestBody OwnUsersVisibilityRequest visibilityRequest) {
		Visibility profileVisibility = visibilityRequest.profileVisibility();
		Visibility friendListVisibility = visibilityRequest.friendListVisibility();
		Users changedUsers = usersService.changeOwnUsersVisibility(profileVisibility, friendListVisibility);
		return ResponseEntity.ok(changedUsers);
	}
}
