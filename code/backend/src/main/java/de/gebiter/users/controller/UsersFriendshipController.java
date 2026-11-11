package de.gebiter.users.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.dto.UsersFriendshipDeleteRequest;
import de.gebiter.users.service.UsersFriendshipService;

/**
 * Die eigene Freundesliste jedes angemeldeten Users (AR USER oder ADMIN). Die GUID kommt aus dem Token. Er nutzt nur
 * den {@link UsersFriendshipService}.
 * <p>
 * Doku: {@code docu/entities/UsersFriendship.md}.
 */
@RestController
@RequestMapping("/api/users-friendship")
public class UsersFriendshipController {

	private final UsersFriendshipService usersFriendshipService;

	public UsersFriendshipController(UsersFriendshipService usersFriendshipService) {
		this.usersFriendshipService = usersFriendshipService;
	}

	/** READ: Die GUIDs der eigenen Freunde, aus dem Hauptspeicher. */
	@GetMapping
	public ResponseEntity<List<UUID>> getOwnFriendUsersGuids() {
		List<UUID> ownFriendUsersGuids = usersFriendshipService.getOwnFriendUsersGuids();
		return ResponseEntity.ok(ownFriendUsersGuids);
	}

	/** DELETE: Eine eigene Freundschaft kündigen, beidseitig. Body: {@code {"friendUsersGuid": "…"}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnUsersFriendship(
			@RequestBody UsersFriendshipDeleteRequest usersFriendshipDeleteRequest) {
		UUID friendUsersGuid = usersFriendshipDeleteRequest.friendUsersGuid();
		usersFriendshipService.deleteOwnUsersFriendship(friendUsersGuid);
		return ResponseEntity.noContent().build();
	}
}
