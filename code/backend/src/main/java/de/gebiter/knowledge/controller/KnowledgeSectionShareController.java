package de.gebiter.knowledge.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.knowledge.model.KnowledgeSection;
import de.gebiter.knowledge.service.KnowledgeSectionService;

/**
 * Die Gliederung der Wissensdatenbank zum Lesen, OHNE Token (Pfad {@code /api/share/**}): Die Wissensdatenbank ist für
 * jeden zum Ansehen da (Nutzer 2026-11-27), also braucht auch ein Besucher ohne Konto die Namen der Rubriken und
 * Kapitel. Nur die Liste; die Pflege steht im {@link KnowledgeSectionAdminController}.
 * <p>
 * Doku: {@code docu/entities/KnowledgeSection.md}.
 */
@RestController
@RequestMapping("/api/share/knowledge-section")
public class KnowledgeSectionShareController {

	private final KnowledgeSectionService knowledgeSectionService;

	public KnowledgeSectionShareController(KnowledgeSectionService knowledgeSectionService) {
		this.knowledgeSectionService = knowledgeSectionService;
	}

	/** READ: Die ganze Gliederung: alle Rubriken, Kapitel und Unterkapitel, nach ihrem Platz unter den Geschwistern. */
	@GetMapping
	public ResponseEntity<List<KnowledgeSection>> getAllKnowledgeSection() {
		List<KnowledgeSection> allKnowledgeSection = knowledgeSectionService.getAllKnowledgeSection();
		return ResponseEntity.ok(allKnowledgeSection);
	}
}
