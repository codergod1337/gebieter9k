package de.gebiter.knowledge.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.knowledge.dto.KnowledgePageResolveRequest;
import de.gebiter.knowledge.dto.KnowledgeSolrFieldNameSet;
import de.gebiter.knowledge.service.KnowledgePageService;

/**
 * Die Seiten der Wissensdatenbank zum Lesen, OHNE Token (Pfad {@code /api/share/**}): Die Wissensdatenbank ist für
 * jeden zum Ansehen da (Nutzer 2026-11-27). Es kommen nur veröffentlichte Seiten; ein Entwurf oder eine gelöschte Seite
 * gilt hier als nicht vorhanden. Eine Seite ist eine Feld-Map; ein Besucher ohne Anmeldung bekommt die Felder, deren
 * „Wer liest“ in der Feldtabelle des Kerns auf „jeder“ steht (SolrManager). Die Pflege steht im
 * {@link KnowledgePageAdminController}.
 * <p>
 * Doku: {@code docu/solr-cores/KNOWLEDGE.md}.
 */
@RestController
@RequestMapping("/api/share/knowledge-page")
public class KnowledgePageShareController {

	private final KnowledgePageService knowledgePageService;

	public KnowledgePageShareController(KnowledgePageService knowledgePageService) {
		this.knowledgePageService = knowledgePageService;
	}

	/** READ: Wie die Felder einer Seite im Kern heißen: Damit findet das Frontend Titel, Inhalt usw. in der Feld-Map. */
	@GetMapping("/field-name-set")
	public ResponseEntity<KnowledgeSolrFieldNameSet> getKnowledgeSolrFieldNameSet() {
		KnowledgeSolrFieldNameSet knowledgeSolrFieldNameSet = knowledgePageService.getKnowledgeSolrFieldNameSet();
		return ResponseEntity.ok(knowledgeSolrFieldNameSet);
	}

	/**
	 * READ: Eine veröffentlichte Seite samt Inhalt über ihre id ({@code pageGuid_language}). Gibt es sie nicht oder ist
	 * sie nicht veröffentlicht: 404.
	 */
	@GetMapping("/{knowledgePageId}")
	public ResponseEntity<Map<String, Object>> getPublishedKnowledgePage(@PathVariable String knowledgePageId) {
		Map<String, Object> foundKnowledgePage = knowledgePageService.getPublishedKnowledgePage(knowledgePageId);
		return ResponseEntity.ok(foundKnowledgePage);
	}

	/**
	 * READ: Löst veröffentlichte Seiten auf, ohne Inhalt, nach ihrem Platz sortiert. Body mit exakten Sollwerten:
	 * {@code {"language": "de"}} sind alle deutschen Seiten (die Übersicht der Wissensdatenbank), mit
	 * {@code "rubricKey"}, {@code "chapterKey"} und {@code "pageKey"} dazu die eine Seite einer Adresse.
	 */
	@PostMapping("/resolve")
	public ResponseEntity<List<Map<String, Object>>> resolvePublishedKnowledgePages(
			@RequestBody KnowledgePageResolveRequest resolveRequest) {
		List<Map<String, Object>> foundKnowledgePages = knowledgePageService
				.resolvePublishedKnowledgePages(resolveRequest);
		return ResponseEntity.ok(foundKnowledgePages);
	}
}
