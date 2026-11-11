package de.gebiter.access.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.access.model.AccessRoleCollection;
import de.gebiter.access.service.AccessRoleCollectionService;

/**
 * Endpunkte der Klasse {@link AccessRoleCollection}. Er nutzt nur den
 * {@link AccessRoleCollectionService}, nie ein Repository.
 * <p>
 * Vorerst nur READ für alle, für die Stammdaten des Frontends.
 * <p>
 * Doku: {@code docu/entities/AccessRoleCollection.md}.
 */
@RestController
@RequestMapping("/api/access-role-collection")
public class AccessRoleCollectionController {

	private final AccessRoleCollectionService accessRoleCollectionService;

	public AccessRoleCollectionController(AccessRoleCollectionService accessRoleCollectionService) {
		this.accessRoleCollectionService = accessRoleCollectionService;
	}

	/** READ: Alle Collections, sortiert nach Key. */
	@GetMapping
	public ResponseEntity<List<AccessRoleCollection>> getAllAccessRoleCollection() {
		List<AccessRoleCollection> allAccessRoleCollection = accessRoleCollectionService.getAllAccessRoleCollection();
		return ResponseEntity.ok(allAccessRoleCollection);
	}
}
