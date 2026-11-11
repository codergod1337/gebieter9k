package de.gebiter.access.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.access.model.AccessRoleUsersAssignment;
import de.gebiter.access.service.AccessRoleUsersAssignmentService;

/**
 * Admin-Endpunkte der Klasse {@link AccessRoleUsersAssignment}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er
 * nutzt nur den {@link AccessRoleUsersAssignmentService}, nie ein Repository. Ob es den User und das Recht gibt, prüft
 * der Service.
 * <p>
 * Auch das Lesen steht vorerst nur hier: Welche Rollen ein anderer User hat, soll später ein eigenes, höheres Recht
 * freigeben (z. B. Moderator), nicht jeder User. Die eigenen Rollen stehen im Token.
 * <p>
 * Kein UPDATE: Eine Zuweisung besteht nur aus User und Recht. Ändern heißt entziehen und neu zuweisen.
 * <p>
 * Doku: {@code docu/entities/AccessRoleUsersAssignment.md}.
 */
@RestController
@RequestMapping("/api/admin/access-role-users-assignment")
public class AccessRoleUsersAssignmentAdminController {

	private final AccessRoleUsersAssignmentService accessRoleUsersAssignmentService;

	public AccessRoleUsersAssignmentAdminController(AccessRoleUsersAssignmentService accessRoleUsersAssignmentService) {
		this.accessRoleUsersAssignmentService = accessRoleUsersAssignmentService;
	}

	/** CREATE: Weist einem User ein Recht zu. Body: {@code {"usersGuid": "…", "accessRoleKey": "ADMIN"}}. */
	@PostMapping
	public ResponseEntity<AccessRoleUsersAssignment> createAccessRoleUsersAssignment(
			@RequestBody AccessRoleUsersAssignment newAccessRoleUsersAssignment) {
		UUID requestedUsersGuid = newAccessRoleUsersAssignment.getUsersGuid();
		String requestedAccessRoleKey = newAccessRoleUsersAssignment.getAccessRoleKey();

		AccessRoleUsersAssignment createdAccessRoleUsersAssignment = accessRoleUsersAssignmentService
				.createAccessRoleUsersAssignment(requestedUsersGuid, requestedAccessRoleKey);

		Long createdAccessRoleUsersAssignmentId = createdAccessRoleUsersAssignment.getId();
		String createdAccessRoleUsersAssignmentPath = "/api/admin/access-role-users-assignment/"
				+ createdAccessRoleUsersAssignmentId;
		URI createdAccessRoleUsersAssignmentLocation = URI.create(createdAccessRoleUsersAssignmentPath);
		return ResponseEntity.created(createdAccessRoleUsersAssignmentLocation).body(createdAccessRoleUsersAssignment);
	}

	/** READ: Eine Zuweisung über ihre {@code id}. */
	@GetMapping("/{id}")
	public ResponseEntity<AccessRoleUsersAssignment> getAccessRoleUsersAssignment(@PathVariable Long id) {
		AccessRoleUsersAssignment foundAccessRoleUsersAssignment = accessRoleUsersAssignmentService
				.getAccessRoleUsersAssignment(id);
		return ResponseEntity.ok(foundAccessRoleUsersAssignment);
	}

	/** READ: Alle Rechte, die einem User zugewiesen sind. */
	@GetMapping("/users/{usersGuid}")
	public ResponseEntity<List<AccessRoleUsersAssignment>> getAccessRoleUsersAssignmentByUsersGuid(
			@PathVariable UUID usersGuid) {
		List<AccessRoleUsersAssignment> foundAccessRoleUsersAssignment = accessRoleUsersAssignmentService
				.getAccessRoleUsersAssignmentByUsersGuid(usersGuid);
		return ResponseEntity.ok(foundAccessRoleUsersAssignment);
	}

	/** READ: Alle Zuweisungen aller User. */
	@GetMapping
	public ResponseEntity<List<AccessRoleUsersAssignment>> getAllAccessRoleUsersAssignment() {
		List<AccessRoleUsersAssignment> allAccessRoleUsersAssignment = accessRoleUsersAssignmentService
				.getAllAccessRoleUsersAssignment();
		return ResponseEntity.ok(allAccessRoleUsersAssignment);
	}

	/** DELETE: Entzieht ein Recht, gelöscht wird nur diese eine Zuweisung. Im Body reicht {@code {"id": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteAccessRoleUsersAssignment(
			@RequestBody AccessRoleUsersAssignment accessRoleUsersAssignmentToDelete) {
		Long id = accessRoleUsersAssignmentToDelete.getId();
		accessRoleUsersAssignmentService.deleteAccessRoleUsersAssignment(id);
		return ResponseEntity.noContent().build();
	}
}
