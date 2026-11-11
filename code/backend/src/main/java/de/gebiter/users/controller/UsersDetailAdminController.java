package de.gebiter.users.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.model.UsersDetail;
import de.gebiter.users.service.UsersDetailService;

/**
 * Admin-Endpunkte der Klasse {@link UsersDetail}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den
 * {@link UsersDetailService}, nie ein Repository. Der Admin liest hier alles, ohne die Regel der Sichtbarkeit.
 * <p>
 * Doku: {@code docu/entities/UsersDetail.md}.
 */
@RestController
@RequestMapping("/api/admin/users-detail")
public class UsersDetailAdminController {

	private final UsersDetailService usersDetailService;

	public UsersDetailAdminController(UsersDetailService usersDetailService) {
		this.usersDetailService = usersDetailService;
	}

	/** READ: Der Eintrag eines Users über dessen GUID, ohne Regel der Sichtbarkeit. */
	@GetMapping("/{usersGuid}")
	public ResponseEntity<UsersDetail> getUsersDetail(@PathVariable UUID usersGuid) {
		UsersDetail foundUsersDetail = usersDetailService.getUsersDetail(usersGuid);
		return ResponseEntity.ok(foundUsersDetail);
	}

	/** READ: Die Einträge aller User. */
	@GetMapping
	public ResponseEntity<List<UsersDetail>> getAllUsersDetail() {
		List<UsersDetail> allUsersDetail = usersDetailService.getAllUsersDetail();
		return ResponseEntity.ok(allUsersDetail);
	}
}
