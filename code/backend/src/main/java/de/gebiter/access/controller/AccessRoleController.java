package de.gebiter.access.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.access.model.AccessRole;
import de.gebiter.access.service.AccessRoleService;

/**
 * Endpunkte der Klasse {@link AccessRole} für jeden angemeldeten User (AR USER oder ADMIN). Er nutzt nur den
 * {@link AccessRoleService}, nie ein Repository. Der User bekommt hier nur die Liste aller Rechte, z. B. für die
 * Stammdaten des Frontends. Die ganze Verwaltung steht im {@link AccessRoleAdminController}.
 * <p>
 * Doku: {@code docu/entities/AccessRole.md}.
 */
@RestController
@RequestMapping("/api/access-role")
public class AccessRoleController {

	private final AccessRoleService accessRoleService;

	public AccessRoleController(AccessRoleService accessRoleService) {
		this.accessRoleService = accessRoleService;
	}

	/** READ: Alle Rechte, sortiert nach Key. */
	@GetMapping
	public ResponseEntity<List<AccessRole>> getAllAccessRole() {
		List<AccessRole> allAccessRole = accessRoleService.getAllAccessRole();
		return ResponseEntity.ok(allAccessRole);
	}
}
