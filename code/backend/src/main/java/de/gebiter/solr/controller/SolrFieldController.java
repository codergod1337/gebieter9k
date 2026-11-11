package de.gebiter.solr.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.solr.model.SolrField;
import de.gebiter.solr.service.SolrFieldService;
import de.gebiter.util.Helper;

/**
 * Endpunkte der Klasse {@link SolrField} für jeden angemeldeten User: nur Lesen. Masken wie der Upload bauen ihre Felder
 * daraus (Typ, mehrwertig, wer setzt). Die Verwaltung steht im {@link SolrFieldAdminController}.
 * <p>
 * Doku: {@code docu/entities/SolrField.md}.
 */
@RestController
@RequestMapping("/api/solr-field")
public class SolrFieldController {

	private final SolrFieldService solrFieldService;

	public SolrFieldController(SolrFieldService solrFieldService) {
		this.solrFieldService = solrFieldService;
	}

	/** READ: Alle Felder eines Kerns, in der Reihenfolge der Feldtabelle. Die Form des Keys wird zuerst geprüft. */
	@GetMapping("/solr-core/{solrCoreKey}")
	public ResponseEntity<List<SolrField>> getSolrFieldBySolrCoreKey(@PathVariable String solrCoreKey) {
		Helper.requireValidKey(solrCoreKey);
		List<SolrField> foundSolrField = solrFieldService.getSolrFieldBySolrCoreKey(solrCoreKey);
		return ResponseEntity.ok(foundSolrField);
	}
}
