package de.gebiter.access.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.access.model.AccessRoleCollectionRole;
import de.gebiter.access.service.AccessRoleCollectionRoleService;

/**
 * Endpunkte der Klasse {@link AccessRoleCollectionRole} für jeden angemeldeten User: nur die Liste, für die Stammdaten
 * des Frontends (Hoverlay einer Position: welche Rechte sie verleiht). Die Verwaltung steht im
 * {@link AccessRoleCollectionRoleAdminController}.
 * <p>
 * Doku: {@code docu/entities/AccessRoleCollectionRole.md}.
 */
@RestController
@RequestMapping("/api/access-role-collection-role")
public class AccessRoleCollectionRoleController {

	private final AccessRoleCollectionRoleService accessRoleCollectionRoleService;

	public AccessRoleCollectionRoleController(AccessRoleCollectionRoleService accessRoleCollectionRoleService) {
		this.accessRoleCollectionRoleService = accessRoleCollectionRoleService;
	}

	/** READ: Alle Rechte aller Positionen. */
	@GetMapping
	public ResponseEntity<List<AccessRoleCollectionRole>> getAllAccessRoleCollectionRole() {
		List<AccessRoleCollectionRole> allAccessRoleCollectionRole = accessRoleCollectionRoleService
				.getAllAccessRoleCollectionRole();
		return ResponseEntity.ok(allAccessRoleCollectionRole);
	}
}
