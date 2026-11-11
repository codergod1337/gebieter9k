package de.gebiter.solr.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.solr.dto.SolrCoreSyncReport;
import de.gebiter.solr.service.SolrSchemaSyncService;

/**
 * Admin-Endpunkte des Schema-Abgleichs Postgres → Solr, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur
 * den {@link SolrSchemaSyncService}.
 */
@RestController
@RequestMapping("/api/admin/solr-sync")
public class SolrSyncAdminController {

	private final SolrSchemaSyncService solrSchemaSyncService;

	public SolrSyncAdminController(SolrSchemaSyncService solrSchemaSyncService) {
		this.solrSchemaSyncService = solrSchemaSyncService;
	}

	/** READ: Die letzten Berichte je Kern. Fehlt ein Kern, lief sein Abgleich noch nicht. */
	@GetMapping
	public ResponseEntity<List<SolrCoreSyncReport>> getAllSolrCoreSyncReport() {
		List<SolrCoreSyncReport> allSolrCoreSyncReports = solrSchemaSyncService.getAllSolrCoreSyncReport();
		return ResponseEntity.ok(allSolrCoreSyncReports);
	}

	/**
	 * UPDATE: Jetzt abgleichen. Body: {@code {"solrCoreKey": "FILE"}} für einen Kern, {@code {}} für alle. Zurück kommen
	 * alle Berichte.
	 */
	@PostMapping
	public ResponseEntity<List<SolrCoreSyncReport>> syncSolrCoresNow(@RequestBody Map<String, String> syncRequest) {
		String requestedSolrCoreKey = syncRequest.get("solrCoreKey");
		List<SolrCoreSyncReport> allSolrCoreSyncReports = solrSchemaSyncService.syncSolrCoresNow(requestedSolrCoreKey);
		return ResponseEntity.ok(allSolrCoreSyncReports);
	}
}
