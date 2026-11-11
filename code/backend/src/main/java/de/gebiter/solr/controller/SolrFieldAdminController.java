package de.gebiter.solr.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.solr.dto.SolrFieldListingOrder;
import de.gebiter.solr.model.SolrField;
import de.gebiter.solr.service.SolrFieldService;

/**
 * Admin-Endpunkte der Klasse {@link SolrField} für den SolrManager, nur mit der AR ADMIN (Pfad {@code /api/admin/**}).
 * Er nutzt nur den {@link SolrFieldService}, nie ein Repository. Nach Solr wird hier nichts geschrieben.
 * <p>
 * Doku: {@code docu/entities/SolrField.md}.
 */
@RestController
@RequestMapping("/api/admin/solr-field")
public class SolrFieldAdminController {

	private final SolrFieldService solrFieldService;

	public SolrFieldAdminController(SolrFieldService solrFieldService) {
		this.solrFieldService = solrFieldService;
	}

	/**
	 * CREATE: Legt ein Feld in einem Kern an. Body z. B.
	 * {@code {"solrCoreKey": "FILE", "name": "authorUsersGuid", "type": "STRING", "indexed": true, "stored": true,
	 * "clientValueAccepted": false, "searchWeight": -1, "readerAccessRoleKey": "USER",
	 * "displayName": {"de": "Besitzer"}}}.
	 */
	@PostMapping
	public ResponseEntity<SolrField> createSolrField(@RequestBody SolrField newSolrField) {
		SolrField createdSolrField = solrFieldService.createSolrField(newSolrField);

		Long createdSolrFieldId = createdSolrField.getId();
		String createdSolrFieldPath = "/api/admin/solr-field/" + createdSolrFieldId;
		URI createdSolrFieldLocation = URI.create(createdSolrFieldPath);
		return ResponseEntity.created(createdSolrFieldLocation).body(createdSolrField);
	}

	/** READ: Ein Feld über seine {@code id}. */
	@GetMapping("/{id}")
	public ResponseEntity<SolrField> getSolrField(@PathVariable Long id) {
		SolrField foundSolrField = solrFieldService.getSolrField(id);
		return ResponseEntity.ok(foundSolrField);
	}

	/** READ: Alle Felder aller Kerne. */
	@GetMapping
	public ResponseEntity<List<SolrField>> getAllSolrField() {
		List<SolrField> allSolrField = solrFieldService.getAllSolrField();
		return ResponseEntity.ok(allSolrField);
	}

	/** UPDATE: Ändert ein Feld. Body: das volle Objekt, maßgeblich ist {@code id}, der Kern ändert sich nie. */
	@PutMapping
	public ResponseEntity<SolrField> changeSolrField(@RequestBody SolrField changedSolrField) {
		SolrField savedSolrField = solrFieldService.changeSolrField(changedSolrField);
		return ResponseEntity.ok(savedSolrField);
	}

	/**
	 * UPDATE: Die neue Reihenfolge der Felder eines Kerns nach Drag and Drop. Body: {@code {"solrCoreKey": "FILE",
	 * "solrFieldNamesInOrder": ["id", "sftpPath", …]}}, jedes Feld des Kerns genau einmal. Zurück kommen die Felder des
	 * Kerns in neuer Reihenfolge.
	 */
	@PutMapping("/listing-position")
	public ResponseEntity<List<SolrField>> changeSolrFieldListingPositions(
			@RequestBody SolrFieldListingOrder solrFieldListingOrder) {
		String solrCoreKey = solrFieldListingOrder.solrCoreKey();
		List<String> solrFieldNamesInOrder = solrFieldListingOrder.solrFieldNamesInOrder();
		List<SolrField> reorderedSolrFields = solrFieldService.changeSolrFieldListingPositions(solrCoreKey,
				solrFieldNamesInOrder);
		return ResponseEntity.ok(reorderedSolrFields);
	}

	/** DELETE: Löscht ein Feld aus der Definition. Im Body reicht {@code {"id": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteSolrField(@RequestBody SolrField solrFieldToDelete) {
		Long id = solrFieldToDelete.getId();
		solrFieldService.deleteSolrField(id);
		return ResponseEntity.noContent().build();
	}
}
