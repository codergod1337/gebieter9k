package de.gebiter.knowledge.controller;

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

import de.gebiter.knowledge.dto.KnowledgeSectionKeyChange;
import de.gebiter.knowledge.dto.KnowledgeSectionListingOrder;
import de.gebiter.knowledge.model.KnowledgeSection;
import de.gebiter.knowledge.service.KnowledgeSectionService;

/**
 * Pflege der Gliederung der Wissensdatenbank (Rubriken, Kapitel, Unterkapitel), nur ADMIN (Pfad
 * {@code /api/admin/**}), im Modul „Wissensmanager“, Reiter „Gliederung“. Er nutzt nur den
 * {@link KnowledgeSectionService}. Ein DELETE gibt es noch nicht. Gelesen wird die Gliederung über den
 * {@link KnowledgeSectionShareController}.
 * <p>
 * Doku: {@code docu/entities/KnowledgeSection.md}.
 */
@RestController
@RequestMapping("/api/admin/knowledge-section")
public class KnowledgeSectionAdminController {

	private final KnowledgeSectionService knowledgeSectionService;

	public KnowledgeSectionAdminController(KnowledgeSectionService knowledgeSectionService) {
		this.knowledgeSectionService = knowledgeSectionService;
	}

	/**
	 * CREATE: Legt einen Punkt am Ende seiner Geschwister an. Body einer Rubrik:
	 * {@code {"rubricKey": "MATHE", "displayName": {"de": "Mathe"}}}; eines Kapitels zusätzlich
	 * {@code "chapterKey": "GRUNDLAGEN"}; eines Unterkapitels zusätzlich {@code "subChapterKey": "KOORDINATEN"}.
	 */
	@PostMapping
	public ResponseEntity<KnowledgeSection> createKnowledgeSection(@RequestBody KnowledgeSection newKnowledgeSection) {
		String requestedRubricKey = newKnowledgeSection.getRubricKey();
		String requestedChapterKey = newKnowledgeSection.getChapterKey();
		String requestedSubChapterKey = newKnowledgeSection.getSubChapterKey();
		Map<String, String> requestedDisplayName = newKnowledgeSection.getDisplayName();
		KnowledgeSection createdKnowledgeSection = knowledgeSectionService.createKnowledgeSection(requestedRubricKey,
				requestedChapterKey, requestedSubChapterKey, requestedDisplayName);
		Long createdKnowledgeSectionId = createdKnowledgeSection.getId();
		String createdKnowledgeSectionPath = "/api/admin/knowledge-section/" + createdKnowledgeSectionId;
		URI createdKnowledgeSectionLocation = URI.create(createdKnowledgeSectionPath);
		return ResponseEntity.created(createdKnowledgeSectionLocation).body(createdKnowledgeSection);
	}

	/** READ: Ein Punkt der Gliederung über seine id. */
	@GetMapping("/{knowledgeSectionId}")
	public ResponseEntity<KnowledgeSection> getKnowledgeSection(@PathVariable Long knowledgeSectionId) {
		KnowledgeSection foundKnowledgeSection = knowledgeSectionService.getKnowledgeSection(knowledgeSectionId);
		return ResponseEntity.ok(foundKnowledgeSection);
	}

	/** UPDATE: Ändert den Anzeigenamen; maßgeblich ist {@code id}, Keys und Platz bleiben (eigene Endpunkte). */
	@PutMapping
	public ResponseEntity<KnowledgeSection> changeKnowledgeSection(@RequestBody KnowledgeSection changedKnowledgeSection) {
		KnowledgeSection savedKnowledgeSection = knowledgeSectionService.changeKnowledgeSection(changedKnowledgeSection);
		return ResponseEntity.ok(savedKnowledgeSection);
	}

	/**
	 * UPDATE: Ändert den Key eines Punkts; alles darunter bekommt ihn mit. Body:
	 * {@code {"knowledgeSectionId": 2, "key": "BASICS"}}; zurück kommt die ganze Gliederung.
	 */
	@PutMapping("/key")
	public ResponseEntity<List<KnowledgeSection>> changeKnowledgeSectionKey(
			@RequestBody KnowledgeSectionKeyChange knowledgeSectionKeyChange) {
		Long knowledgeSectionId = knowledgeSectionKeyChange.knowledgeSectionId();
		String changedKey = knowledgeSectionKeyChange.key();
		List<KnowledgeSection> allKnowledgeSections = knowledgeSectionService.changeKnowledgeSectionKey(knowledgeSectionId,
				changedKey);
		return ResponseEntity.ok(allKnowledgeSections);
	}

	/**
	 * UPDATE: Die neue Reihenfolge von Geschwistern. Body: {@code {"knowledgeSectionIdsInOrder": [12, 7, 9]}}; zurück
	 * kommt die ganze Gliederung.
	 */
	@PutMapping("/listing-position")
	public ResponseEntity<List<KnowledgeSection>> changeKnowledgeSectionListingPositions(
			@RequestBody KnowledgeSectionListingOrder knowledgeSectionListingOrder) {
		List<Long> knowledgeSectionIdsInOrder = knowledgeSectionListingOrder.knowledgeSectionIdsInOrder();
		List<KnowledgeSection> allKnowledgeSections = knowledgeSectionService
				.changeKnowledgeSectionListingPositions(knowledgeSectionIdsInOrder);
		return ResponseEntity.ok(allKnowledgeSections);
	}
}
