package de.gebiter.solr.service;

import java.util.List;

import org.springframework.stereotype.Service;

import de.gebiter.solr.SolrConfig;
import de.gebiter.util.Helper;

/**
 * Die Solr-Kerne, die das Backend kennt. Sie stehen in der {@code application.yaml} ({@code gebiter.solr.core-keys}),
 * nicht in Postgres; anlegen, ändern und löschen gibt es deshalb nicht. Ihre Felder führt der {@link SolrFieldService}.
 */
@Service
public class SolrCoreService {

	private final SolrConfig solrConfig;

	public SolrCoreService(SolrConfig solrConfig) {
		this.solrConfig = solrConfig;
	}

	/** READ: Gibt es den Kern mit {@code solrCoreKey}? */
	public boolean existsSolrCore(String solrCoreKey) {
		Helper.requireNotNull(solrCoreKey, "solrCoreKey");
		List<String> coreKeys = solrConfig.coreKeys();
		return coreKeys.contains(solrCoreKey);
	}

	/** READ: Die Keys aller Kerne, in der Reihenfolge der YAML. */
	public List<String> getAllSolrCoreKey() {
		return solrConfig.coreKeys();
	}
}
