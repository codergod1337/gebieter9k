package de.gebiter.solr.controller;

import java.io.IOException;
import java.io.OutputStream;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.solr.service.SolrCoreExportService;
import de.gebiter.solr.service.SolrCoreService;
import de.gebiter.util.Helper;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Admin-Endpunkte der Solr-Kerne für den SolrManager, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Nur lesen: Die
 * Kerne stehen in der {@code application.yaml}. Dazu der Export eines ganzen Kerns (Backup). Er nutzt nur den
 * {@link SolrCoreService} und den {@link SolrCoreExportService}. Doku: {@code docu/solr-cores/README.md}.
 */
@RestController
@RequestMapping("/api/admin/solr-core")
public class SolrCoreAdminController {

	private final SolrCoreService solrCoreService;

	private final SolrCoreExportService solrCoreExportService;

	public SolrCoreAdminController(SolrCoreService solrCoreService, SolrCoreExportService solrCoreExportService) {
		this.solrCoreService = solrCoreService;
		this.solrCoreExportService = solrCoreExportService;
	}

	/** READ: Die Keys aller Kerne, z. B. {@code ["FILE"]}. */
	@GetMapping
	public ResponseEntity<List<String>> getAllSolrCoreKey() {
		List<String> allSolrCoreKey = solrCoreService.getAllSolrCoreKey();
		return ResponseEntity.ok(allSolrCoreKey);
	}

	/**
	 * READ: Exportiert einen Kern komplett als JSON-Datei zum Herunterladen (Backup): Felddefinitionen, Referenzen und alle
	 * Dokumente, z. B. {@code solr-core-FILE-2026-11-09T15-30-00Z.json}.
	 */
	@GetMapping("/export/{solrCoreKey}")
	public void exportSolrCore(@PathVariable String solrCoreKey, HttpServletResponse response) throws IOException {
		String checkedSolrCoreKey = Helper.requireValidKey(solrCoreKey);
		String exportedAtText = Instant.now().toString();
		String exportFileName = "solr-core-" + checkedSolrCoreKey + "-" + exportedAtText.replace(':', '-') + ".json";
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");
		response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + exportFileName + "\"");
		OutputStream responseOutputStream = response.getOutputStream();
		solrCoreExportService.exportSolrCore(checkedSolrCoreKey, responseOutputStream);
	}
}
