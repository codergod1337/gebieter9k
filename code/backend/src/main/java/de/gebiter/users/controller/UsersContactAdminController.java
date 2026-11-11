package de.gebiter.users.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.model.UsersContact;
import de.gebiter.users.service.UsersContactService;

/**
 * Admin-Endpunkte der Klasse {@link UsersContact}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Der Admin liest
 * hier alles, ohne die Regel der Sichtbarkeit. Er nutzt nur den {@link UsersContactService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/UsersContact.md}.
 */
@RestController
@RequestMapping("/api/admin/users-contact")
public class UsersContactAdminController {

	private final UsersContactService usersContactService;

	public UsersContactAdminController(UsersContactService usersContactService) {
		this.usersContactService = usersContactService;
	}

	/** READ: Alle Angaben eines Users samt Sichtbarkeit. */
	@GetMapping("/users/{usersGuid}")
	public ResponseEntity<List<UsersContact>> getUsersContactByUsers(@PathVariable UUID usersGuid) {
		List<UsersContact> usersContacts = usersContactService.getUsersContactByUsers(usersGuid);
		return ResponseEntity.ok(usersContacts);
	}

	/** READ: Alle Angaben aller User. */
	@GetMapping
	public ResponseEntity<List<UsersContact>> getAllUsersContact() {
		List<UsersContact> allUsersContacts = usersContactService.getAllUsersContact();
		return ResponseEntity.ok(allUsersContacts);
	}
}
