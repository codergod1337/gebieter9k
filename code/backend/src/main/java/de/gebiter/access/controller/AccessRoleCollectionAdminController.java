package de.gebiter.access.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.access.model.AccessRoleCollection;
import de.gebiter.access.service.AccessRoleCollectionService;
import de.gebiter.util.dto.ListingOrder;

/**
 * Admin-Endpunkte der Klasse {@link AccessRoleCollection} (Position), nur mit der AR ADMIN (Pfad
 * {@code /api/admin/**}). Er nutzt nur den {@link AccessRoleCollectionService}, nie ein Repository. Die Liste für alle
 * liefert der {@link AccessRoleCollectionController}. Anlegen übernimmt vorerst nur der Start-Runner.
 * <p>
 * Doku: {@code docu/entities/AccessRoleCollection.md}.
 */
@RestController
@RequestMapping("/api/admin/access-role-collection")
public class AccessRoleCollectionAdminController {

	private final AccessRoleCollectionService accessRoleCollectionService;

	public AccessRoleCollectionAdminController(AccessRoleCollectionService accessRoleCollectionService) {
		this.accessRoleCollectionService = accessRoleCollectionService;
	}

	/** READ: Eine Position über ihren Key. */
	@GetMapping("/{accessRoleCollectionKey}")
	public ResponseEntity<AccessRoleCollection> getAccessRoleCollection(@PathVariable String accessRoleCollectionKey) {
		AccessRoleCollection foundAccessRoleCollection = accessRoleCollectionService
				.getAccessRoleCollection(accessRoleCollectionKey);
		return ResponseEntity.ok(foundAccessRoleCollection);
	}

	/**
	 * UPDATE: Ändert eine Position. Body: das volle Objekt, maßgeblich ist {@code key}, geändert werden
	 * {@code displayName} und {@code badgeLook}.
	 */
	@PutMapping
	public ResponseEntity<AccessRoleCollection> changeAccessRoleCollection(
			@RequestBody AccessRoleCollection changedAccessRoleCollection) {
		AccessRoleCollection savedAccessRoleCollection = accessRoleCollectionService
				.changeAccessRoleCollection(changedAccessRoleCollection);
		return ResponseEntity.ok(savedAccessRoleCollection);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop. Body: {@code {"keysInOrder": ["ALLMAECHTIGER", "BUERGER"]}}, jeder
	 * Key genau einmal. Zurück kommen alle Positionen in neuer Reihenfolge.
	 */
	@PutMapping("/listing-position")
	public ResponseEntity<List<AccessRoleCollection>> changeAccessRoleCollectionListingPositions(
			@RequestBody ListingOrder listingOrder) {
		List<String> accessRoleCollectionKeysInOrder = listingOrder.keysInOrder();
		List<AccessRoleCollection> allAccessRoleCollections = accessRoleCollectionService
				.changeAccessRoleCollectionListingPositions(accessRoleCollectionKeysInOrder);
		return ResponseEntity.ok(allAccessRoleCollections);
	}
}
