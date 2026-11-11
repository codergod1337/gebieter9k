package de.gebiter.access.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.access.model.AccessRoleCollectionRole;
import de.gebiter.access.service.AccessRoleCollectionRoleService;

/**
 * Admin-Endpunkte der Klasse {@link AccessRoleCollectionRole}: welche Rechte eine Collection verleiht, nur mit der AR
 * ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den {@link AccessRoleCollectionRoleService}, nie ein Repository.
 * Genutzt von der Matrix ARC × AR. Ob es Collection und Recht gibt, prüft der Service.
 * <p>
 * Kein UPDATE: Ein Eintrag besteht nur aus Collection und Recht. Ändern heißt entfernen und neu aufnehmen.
 * <p>
 * Doku: {@code docu/entities/AccessRoleCollectionRole.md}.
 */
@RestController
@RequestMapping("/api/admin/access-role-collection-role")
public class AccessRoleCollectionRoleAdminController {

	private final AccessRoleCollectionRoleService accessRoleCollectionRoleService;

	public AccessRoleCollectionRoleAdminController(AccessRoleCollectionRoleService accessRoleCollectionRoleService) {
		this.accessRoleCollectionRoleService = accessRoleCollectionRoleService;
	}

	/** CREATE: Nimmt ein Recht in eine Collection auf. Body: {@code {"accessRoleCollectionKey": "…", "accessRoleKey": "…"}}. */
	@PostMapping
	public ResponseEntity<AccessRoleCollectionRole> createAccessRoleCollectionRole(
			@RequestBody AccessRoleCollectionRole newAccessRoleCollectionRole) {
		String requestedAccessRoleCollectionKey = newAccessRoleCollectionRole.getAccessRoleCollectionKey();
		String requestedAccessRoleKey = newAccessRoleCollectionRole.getAccessRoleKey();

		AccessRoleCollectionRole createdAccessRoleCollectionRole = accessRoleCollectionRoleService
				.createAccessRoleCollectionRole(requestedAccessRoleCollectionKey, requestedAccessRoleKey);

		Long createdAccessRoleCollectionRoleId = createdAccessRoleCollectionRole.getId();
		String createdAccessRoleCollectionRolePath = "/api/admin/access-role-collection-role/"
				+ createdAccessRoleCollectionRoleId;
		URI createdAccessRoleCollectionRoleLocation = URI.create(createdAccessRoleCollectionRolePath);
		return ResponseEntity.created(createdAccessRoleCollectionRoleLocation).body(createdAccessRoleCollectionRole);
	}

	/** READ: Ein Eintrag über seine {@code id}. */
	@GetMapping("/{id}")
	public ResponseEntity<AccessRoleCollectionRole> getAccessRoleCollectionRole(@PathVariable Long id) {
		AccessRoleCollectionRole foundAccessRoleCollectionRole = accessRoleCollectionRoleService
				.getAccessRoleCollectionRole(id);
		return ResponseEntity.ok(foundAccessRoleCollectionRole);
	}

	/** READ: Alle Einträge aller Collections. */
	@GetMapping
	public ResponseEntity<List<AccessRoleCollectionRole>> getAllAccessRoleCollectionRole() {
		List<AccessRoleCollectionRole> allAccessRoleCollectionRole = accessRoleCollectionRoleService
				.getAllAccessRoleCollectionRole();
		return ResponseEntity.ok(allAccessRoleCollectionRole);
	}

	/** DELETE: Nimmt ein Recht aus einer Collection, gelöscht wird nur dieser eine Eintrag. Im Body reicht {@code {"id": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteAccessRoleCollectionRole(
			@RequestBody AccessRoleCollectionRole accessRoleCollectionRoleToDelete) {
		Long id = accessRoleCollectionRoleToDelete.getId();
		accessRoleCollectionRoleService.deleteAccessRoleCollectionRole(id);
		return ResponseEntity.noContent().build();
	}
}
