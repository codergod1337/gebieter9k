package de.gebiter.access.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.access.model.AccessRole;
import de.gebiter.access.service.AccessRoleService;
import de.gebiter.util.dto.ListingOrder;

/**
 * Admin-Endpunkte der Klasse {@link AccessRole}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}, geprüft in der
 * {@code SecurityConfig}). Er nutzt nur den {@link AccessRoleService}, nie ein Repository. Die Rechte verwaltet
 * ausschließlich der Admin. DELETE fehlt noch, siehe {@link AccessRoleService}.
 * <p>
 * Doku: {@code docu/entities/AccessRole.md}.
 */
@RestController
@RequestMapping("/api/admin/access-role")
public class AccessRoleAdminController {

	private final AccessRoleService accessRoleService;

	public AccessRoleAdminController(AccessRoleService accessRoleService) {
		this.accessRoleService = accessRoleService;
	}

	/** CREATE: Legt ein Recht an. Body: {@code {"key": "USER", "displayName": {"de": "User"}}}. */
	@PostMapping
	public ResponseEntity<AccessRole> createAccessRole(@RequestBody AccessRole newAccessRole) {
		String requestedAccessRoleKey = newAccessRole.getKey();
		Map<String, String> requestedDisplayName = newAccessRole.getDisplayName();

		AccessRole createdAccessRole = accessRoleService.createAccessRole(requestedAccessRoleKey,
				requestedDisplayName);

		String createdAccessRoleKey = createdAccessRole.getKey();
		String createdAccessRolePath = "/api/admin/access-role/" + createdAccessRoleKey;
		URI createdAccessRoleLocation = URI.create(createdAccessRolePath);
		return ResponseEntity.created(createdAccessRoleLocation).body(createdAccessRole);
	}

	/** READ: Ein Recht über seinen Key. */
	@GetMapping("/{accessRoleKey}")
	public ResponseEntity<AccessRole> getAccessRole(@PathVariable String accessRoleKey) {
		AccessRole foundAccessRole = accessRoleService.getAccessRole(accessRoleKey);
		return ResponseEntity.ok(foundAccessRole);
	}

	/** UPDATE: Ändert ein Recht. Body: das volle Objekt, maßgeblich ist {@code key}, geändert wird {@code displayName}. */
	@PutMapping
	public ResponseEntity<AccessRole> changeAccessRole(@RequestBody AccessRole changedAccessRole) {
		AccessRole savedAccessRole = accessRoleService.changeAccessRole(changedAccessRole);
		return ResponseEntity.ok(savedAccessRole);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop. Body: {@code {"keysInOrder": ["ADMIN", "USER"]}}, jeder Key genau
	 * einmal. Zurück kommen alle Rechte in neuer Reihenfolge.
	 */
	@PutMapping("/listing-position")
	public ResponseEntity<List<AccessRole>> changeAccessRoleListingPositions(@RequestBody ListingOrder listingOrder) {
		List<String> accessRoleKeysInOrder = listingOrder.keysInOrder();
		List<AccessRole> allAccessRoles = accessRoleService.changeAccessRoleListingPositions(accessRoleKeysInOrder);
		return ResponseEntity.ok(allAccessRoles);
	}
}
