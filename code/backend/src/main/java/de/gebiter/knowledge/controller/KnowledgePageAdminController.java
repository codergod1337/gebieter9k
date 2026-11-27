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

import de.gebiter.knowledge.KnowledgeSolrFieldNames;
import de.gebiter.knowledge.dto.KnowledgePageChangeRequest;
import de.gebiter.knowledge.dto.KnowledgePageResolveRequest;
import de.gebiter.knowledge.dto.NewKnowledgePage;
import de.gebiter.knowledge.service.KnowledgePageService;

/**
 * Pflege der Seiten der Wissensdatenbank, nur ADMIN (Pfad {@code /api/admin/**}): anlegen, lesen in jedem Status,
 * auflösen, ändern. Er nutzt nur den {@link KnowledgePageService}. Eine Seite ist eine Feld-Map mit den Namen der
 * Felder im Solr-Kern; welche Felder gesetzt und gelesen werden dürfen, steht in der Feldtabelle des Kerns
 * (SolrManager). Ein DELETE gibt es nicht: Eine Seite wird über ihren Status weich gelöscht ({@code DELETED}). Besucher
 * lesen über den {@link KnowledgePageShareController}.
 * <p>
 * Doku: {@code docu/solr-cores/KNOWLEDGE.md}.
 */
@RestController
@RequestMapping("/api/admin/knowledge-page")
public class KnowledgePageAdminController {

	private final KnowledgePageService knowledgePageService;

	private final KnowledgeSolrFieldNames knowledgeSolrFieldNames;

	public KnowledgePageAdminController(KnowledgePageService knowledgePageService,
			KnowledgeSolrFieldNames knowledgeSolrFieldNames) {
		this.knowledgePageService = knowledgePageService;
		this.knowledgeSolrFieldNames = knowledgeSolrFieldNames;
	}

	/**
	 * CREATE: Legt eine Seite am Ende ihres Kapitels an. Body z. B.
	 * {@code {"fieldValuesByFieldName": {"language": "de", "rubricKey": "MATHE", "chapterKey": "GRUNDLAGEN",
	 * "pageKey": "KOORDINATENTRANSFORMATION", "title": "Koordinatentransformation", "summary": "…",
	 * "content": "{\"blocks\":[]}", "tags": ["polarkoordinaten"], "status": "PUBLISHED"}}}. Das Kapitel muss es geben; der
	 * {@code pageKey} darf im Kapitel noch nicht vergeben sein (409).
	 */
	@PostMapping
	public ResponseEntity<Map<String, Object>> createKnowledgePage(@RequestBody NewKnowledgePage newKnowledgePage) {
		Map<String, Object> requestedFieldValues = newKnowledgePage.fieldValuesByFieldName();
		Map<String, Object> createdKnowledgePage = knowledgePageService.createKnowledgePage(requestedFieldValues);
		String idFieldName = knowledgeSolrFieldNames.getId();
		Object createdKnowledgePageId = createdKnowledgePage.get(idFieldName);
		String createdKnowledgePagePath = "/api/admin/knowledge-page/" + createdKnowledgePageId;
		URI createdKnowledgePageLocation = URI.create(createdKnowledgePagePath);
		return ResponseEntity.created(createdKnowledgePageLocation).body(createdKnowledgePage);
	}

	/** READ: Eine Seite samt Inhalt über ihre id ({@code pageGuid_language}), in jedem Status. Gibt es sie nicht: 404. */
	@GetMapping("/{knowledgePageId}")
	public ResponseEntity<Map<String, Object>> getKnowledgePage(@PathVariable String knowledgePageId) {
		Map<String, Object> foundKnowledgePage = knowledgePageService.getKnowledgePage(knowledgePageId);
		return ResponseEntity.ok(foundKnowledgePage);
	}

	/**
	 * READ: Löst Seiten auf, in jedem Status, ohne Inhalt. Body mit exakten Sollwerten, z. B.
	 * {@code {"language": "de", "rubricKey": "MATHE", "chapterKey": "GRUNDLAGEN"}}; {@code {}} sind alle Seiten.
	 */
	@PostMapping("/resolve")
	public ResponseEntity<List<Map<String, Object>>> resolveKnowledgePages(
			@RequestBody KnowledgePageResolveRequest resolveRequest) {
		List<Map<String, Object>> foundKnowledgePages = knowledgePageService.resolveKnowledgePages(resolveRequest);
		return ResponseEntity.ok(foundKnowledgePages);
	}

	/**
	 * UPDATE: Ändert eine Seite. Body: {@code {"id": "…", "fieldValuesByFieldName": {"status": "PUBLISHED"}}}. Nur die
	 * genannten Felder; ein leerer Wert nimmt das Feld heraus. So lässt sich eine Seite veröffentlichen, weich löschen
	 * ({@code "status": "DELETED"}), umbenennen ({@code pageKey}) oder in ein anderes Kapitel verschieben.
	 */
	@PutMapping
	public ResponseEntity<Map<String, Object>> changeKnowledgePage(
			@RequestBody KnowledgePageChangeRequest knowledgePageChangeRequest) {
		String requestedId = knowledgePageChangeRequest.id();
		Map<String, Object> requestedFieldValues = knowledgePageChangeRequest.fieldValuesByFieldName();
		Map<String, Object> savedKnowledgePage = knowledgePageService.changeKnowledgePage(requestedId,
				requestedFieldValues);
		return ResponseEntity.ok(savedKnowledgePage);
	}
}
