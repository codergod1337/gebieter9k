package de.gebiter.users.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.dto.NewUsersFriendRequest;
import de.gebiter.users.dto.UsersFriendRequestAnswer;
import de.gebiter.users.model.UsersFriendRequest;
import de.gebiter.users.service.UsersFriendRequestService;

/**
 * Die eigenen Freundschaftsanträge jedes angemeldeten Users (AR USER oder ADMIN). Keiner dieser Endpunkte nimmt die
 * eigene GUID entgegen, sie kommt aus dem Token. Er nutzt nur den {@link UsersFriendRequestService}.
 * <p>
 * Doku: {@code docu/entities/UsersFriendRequest.md}.
 */
@RestController
@RequestMapping("/api/users-friend-request")
public class UsersFriendRequestController {

	private final UsersFriendRequestService usersFriendRequestService;

	public UsersFriendRequestController(UsersFriendRequestService usersFriendRequestService) {
		this.usersFriendRequestService = usersFriendRequestService;
	}

	/** CREATE: Einen Antrag stellen. Body: {@code {"acceptorUsersGuid": "…"}}. */
	@PostMapping
	public ResponseEntity<UsersFriendRequest> createOwnUsersFriendRequest(
			@RequestBody NewUsersFriendRequest newUsersFriendRequest) {
		UUID acceptorUsersGuid = newUsersFriendRequest.acceptorUsersGuid();
		UsersFriendRequest createdUsersFriendRequest = usersFriendRequestService
				.createOwnUsersFriendRequest(acceptorUsersGuid);
		return ResponseEntity.ok(createdUsersFriendRequest);
	}

	/** READ: Die eigenen offenen Anträge, an mich und von mir. */
	@GetMapping
	public ResponseEntity<List<UsersFriendRequest>> getOwnOpenUsersFriendRequest() {
		List<UsersFriendRequest> openUsersFriendRequests = usersFriendRequestService.getOwnOpenUsersFriendRequest();
		return ResponseEntity.ok(openUsersFriendRequests);
	}

	/** UPDATE: Einen Antrag an mich beantworten. Body: {@code {"id": 7, "accepted": true}}. */
	@PutMapping
	public ResponseEntity<UsersFriendRequest> answerOwnUsersFriendRequest(
			@RequestBody UsersFriendRequestAnswer usersFriendRequestAnswer) {
		Long id = usersFriendRequestAnswer.id();
		boolean accepted = usersFriendRequestAnswer.accepted();
		UsersFriendRequest answeredUsersFriendRequest = usersFriendRequestService.answerOwnUsersFriendRequest(id,
				accepted);
		return ResponseEntity.ok(answeredUsersFriendRequest);
	}
}
