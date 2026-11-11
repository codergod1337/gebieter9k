package de.gebiter.solr.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.solr.model.SolrReference;
import de.gebiter.solr.service.SolrReferenceService;

/**
 * Admin-Endpunkte der Klasse {@link SolrReference} (die Hooks der Vorlage), nur mit der AR ADMIN (Pfad
 * {@code /api/admin/**}). Er nutzt nur den {@link SolrReferenceService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/SolrReference.md}.
 */
@RestController
@RequestMapping("/api/admin/solr-reference")
public class SolrReferenceAdminController {

	private final SolrReferenceService solrReferenceService;

	public SolrReferenceAdminController(SolrReferenceService solrReferenceService) {
		this.solrReferenceService = solrReferenceService;
	}

	/** CREATE: Legt eine Referenz an. Body: {@code {"key": "wtf", "displayName": {"de": "WTF"}, "description": …}}. */
	@PostMapping
	public ResponseEntity<SolrReference> createSolrReference(@RequestBody SolrReference newSolrReference) {
		String requestedSolrReferenceKey = newSolrReference.getKey();
		Map<String, String> requestedDisplayName = newSolrReference.getDisplayName();
		Map<String, String> requestedDescription = newSolrReference.getDescription();
		SolrReference createdSolrReference = solrReferenceService.createSolrReference(requestedSolrReferenceKey,
				requestedDisplayName, requestedDescription);

		String createdSolrReferenceKey = createdSolrReference.getKey();
		String createdSolrReferencePath = "/api/admin/solr-reference/" + createdSolrReferenceKey;
		URI createdSolrReferenceLocation = URI.create(createdSolrReferencePath);
		return ResponseEntity.created(createdSolrReferenceLocation).body(createdSolrReference);
	}

	/** READ: Eine Referenz über ihren Key. */
	@GetMapping("/{solrReferenceKey}")
	public ResponseEntity<SolrReference> getSolrReference(@PathVariable String solrReferenceKey) {
		SolrReference foundSolrReference = solrReferenceService.getSolrReference(solrReferenceKey);
		return ResponseEntity.ok(foundSolrReference);
	}

	/** READ: Alle Referenzen in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<SolrReference>> getAllSolrReference() {
		List<SolrReference> allSolrReference = solrReferenceService.getAllSolrReference();
		return ResponseEntity.ok(allSolrReference);
	}

	/** UPDATE: Ändert Anzeigename und Beschreibung. Body: das volle Objekt, maßgeblich ist {@code key}. */
	@PutMapping
	public ResponseEntity<SolrReference> changeSolrReference(@RequestBody SolrReference changedSolrReference) {
		SolrReference savedSolrReference = solrReferenceService.changeSolrReference(changedSolrReference);
		return ResponseEntity.ok(savedSolrReference);
	}

	/** DELETE: Löscht eine Referenz samt ihren Zeilen in allen Kernen. Im Body reicht {@code {"key": "…"}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteSolrReference(@RequestBody SolrReference solrReferenceToDelete) {
		String solrReferenceKey = solrReferenceToDelete.getKey();
		solrReferenceService.deleteSolrReference(solrReferenceKey);
		return ResponseEntity.noContent().build();
	}
}
