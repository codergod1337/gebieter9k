package de.gebiter.users.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.dto.UsersPointBookingPage;
import de.gebiter.users.dto.UsersPointBookingResolveRequest;
import de.gebiter.users.service.UsersPointBookingService;

/**
 * Der eigene Kontoauszug der Punkte (AR USER oder ADMIN), nur lesen. Die eigene GUID kommt aus dem Token. Gebucht wird
 * nie über einen Endpunkt, nur vom Backend in seinen Vorgängen.
 * <p>
 * Doku: {@code docu/entities/UsersPointBooking.md}.
 */
@RestController
@RequestMapping("/api/users-point-booking")
public class UsersPointBookingController {

	private final UsersPointBookingService usersPointBookingService;

	public UsersPointBookingController(UsersPointBookingService usersPointBookingService) {
		this.usersPointBookingService = usersPointBookingService;
	}

	/** READ: Eine Seite des eigenen Kontoauszugs, die neuesten zuerst. Body: {@code {"page": 0}}. */
	@PostMapping("/resolve")
	public ResponseEntity<UsersPointBookingPage> resolveOwnUsersPointBookingPage(
			@RequestBody UsersPointBookingResolveRequest usersPointBookingResolveRequest) {
		int page = usersPointBookingResolveRequest.page();
		UsersPointBookingPage usersPointBookingPage = usersPointBookingService.resolveOwnUsersPointBookingPage(page);
		return ResponseEntity.ok(usersPointBookingPage);
	}
}
