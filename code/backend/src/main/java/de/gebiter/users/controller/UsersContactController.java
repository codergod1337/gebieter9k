package de.gebiter.users.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.status.model.Visibility;
import de.gebiter.users.dto.OwnUsersContactDeleteRequest;
import de.gebiter.users.dto.OwnUsersContactSaveRequest;
import de.gebiter.users.dto.UsersContactForClient;
import de.gebiter.users.model.UsersContact;
import de.gebiter.users.model.UsersContactType;
import de.gebiter.users.service.UsersContactService;

/**
 * Die Kontaktangaben für jeden angemeldeten User (AR USER oder ADMIN): fremde nur, soweit er sie sehen darf, schreiben
 * nur die eigenen (GUID aus dem Token). Er nutzt nur den {@link UsersContactService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/UsersContact.md}.
 */
@RestController
@RequestMapping("/api/users-contact")
public class UsersContactController {

	private final UsersContactService usersContactService;

	public UsersContactController(UsersContactService usersContactService) {
		this.usersContactService = usersContactService;
	}

	/** READ: Die Angaben eines Users, die man sehen darf, nur Art und Wert; 404, wenn man sein Profil nicht sehen darf. */
	@GetMapping("/users/{usersGuid}")
	public ResponseEntity<List<UsersContactForClient>> getVisibleUsersContact(@PathVariable UUID usersGuid) {
		List<UsersContactForClient> visibleUsersContacts = usersContactService.getVisibleUsersContact(usersGuid);
		return ResponseEntity.ok(visibleUsersContacts);
	}

	/** READ: Die eigenen Angaben samt Sichtbarkeit, ohne Einträge eine leere Liste. */
	@GetMapping
	public ResponseEntity<List<UsersContact>> getOwnUsersContact() {
		List<UsersContact> ownUsersContacts = usersContactService.getOwnUsersContact();
		return ResponseEntity.ok(ownUsersContacts);
	}

	/**
	 * UPDATE: Setzt eine eigene Angabe, der Eintrag entsteht beim ersten Setzen. Body:
	 * {@code {"contactType": "INSTAGRAM", "contactValue": "…", "visibility": "ANY"}}.
	 */
	@PutMapping
	public ResponseEntity<UsersContact> saveOwnUsersContact(@RequestBody OwnUsersContactSaveRequest saveRequest) {
		UsersContactType contactType = saveRequest.contactType();
		String contactValue = saveRequest.contactValue();
		Visibility visibility = saveRequest.visibility();
		UsersContact savedUsersContact = usersContactService.saveOwnUsersContact(contactType, contactValue, visibility);
		return ResponseEntity.ok(savedUsersContact);
	}

	/** DELETE: Löscht eine eigene Angabe. Body: {@code {"contactType": "INSTAGRAM"}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnUsersContact(@RequestBody OwnUsersContactDeleteRequest deleteRequest) {
		UsersContactType contactType = deleteRequest.contactType();
		usersContactService.deleteOwnUsersContact(contactType);
		return ResponseEntity.noContent().build();
	}
}
