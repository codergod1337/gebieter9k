package de.gebiter.solr;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import de.gebiter.solr.model.SolrFieldType;
import de.gebiter.util.Helper;

/**
 * Die Solr-Kerne, die Regeln für Feldnamen und die festen Einstellungen jeder Referenz, gelesen aus
 * {@code gebiter.solr.*} in der {@code application.yaml}.
 * <p>
 * Die Kerne stehen nur dort, nicht in Postgres: Ein Kern ist ein fester Teil der Anwendung, sein Code rechnet mit ihm.
 * In Postgres stehen nur seine Felder ({@code solr_field}). Ein ungültiger oder doppelter Key verhindert den Start.
 */
@Component
public class SolrConfig {

	/** Die Keys der Kerne, in der Reihenfolge der YAML, z. B. {@code FILE}. */
	private final List<String> coreKeys;

	/** Endung des Zwillings für die Vervollständigung beim Tippen, z. B. {@code fileNameSuggest}. */
	private final String suggestTwinSuffix;

	/** Endung des Zwillings, in dem jedes Stück ab 3 Zeichen trifft, z. B. {@code fileNameNgram}. */
	private final String ngramTwinSuffix;

	/** Typ des Feldes jeder Referenz in jedem Kern ({@code gebiter.solr.reference-field.*}). */
	private final SolrFieldType referenceFieldType;

	private final boolean referenceFieldIndexed;

	private final boolean referenceFieldStored;

	private final boolean referenceFieldMultiValued;

	private final boolean referenceFieldDocValues;

	private final boolean referenceFieldSuggestTwin;

	/** Nimmt das Backend den Wert einer Referenz vom Client an? Referenzen setzt der Client. */
	private final boolean referenceFieldClientValueAccepted;

	/** Startwert des Suchgewichts einer neuen Referenz-Zeile; danach je Kern änderbar. */
	private final int referenceFieldStartSearchWeight;

	/** Das kleinste Suchgewicht ({@code gebiter.solr.search-weight.min}): -1, nicht durchsucht. */
	private final int searchWeightMin;

	/** Das größte Suchgewicht ({@code gebiter.solr.search-weight.max}). */
	private final int searchWeightMax;

	public SolrConfig(@Value("${gebiter.solr.core-keys}") List<String> configuredCoreKeys,
			@Value("${gebiter.solr.suggest-twin-suffix}") String suggestTwinSuffix,
			@Value("${gebiter.solr.ngram-twin-suffix}") String ngramTwinSuffix,
			@Value("${gebiter.solr.reference-field.type}") SolrFieldType referenceFieldType,
			@Value("${gebiter.solr.reference-field.indexed}") boolean referenceFieldIndexed,
			@Value("${gebiter.solr.reference-field.stored}") boolean referenceFieldStored,
			@Value("${gebiter.solr.reference-field.multi-valued}") boolean referenceFieldMultiValued,
			@Value("${gebiter.solr.reference-field.doc-values}") boolean referenceFieldDocValues,
			@Value("${gebiter.solr.reference-field.suggest-twin}") boolean referenceFieldSuggestTwin,
			@Value("${gebiter.solr.reference-field.client-value-accepted}") boolean referenceFieldClientValueAccepted,
			@Value("${gebiter.solr.reference-field.search-weight}") int referenceFieldStartSearchWeight,
			@Value("${gebiter.solr.search-weight.min}") int searchWeightMin,
			@Value("${gebiter.solr.search-weight.max}") int searchWeightMax) {
		Set<String> distinctCoreKeys = new LinkedHashSet<>();
		for (String configuredCoreKey : configuredCoreKeys) {
			String coreKey = configuredCoreKey.trim();
			Helper.requireValidKey(coreKey);
			boolean newCoreKey = distinctCoreKeys.add(coreKey);
			if (!newCoreKey) {
				throw new IllegalStateException("Der Kern " + coreKey + " steht doppelt in gebiter.solr.core-keys.");
			}
		}
		this.coreKeys = List.copyOf(distinctCoreKeys);
		this.suggestTwinSuffix = Helper.requireNotBlank(suggestTwinSuffix, "gebiter.solr.suggest-twin-suffix");
		this.ngramTwinSuffix = Helper.requireNotBlank(ngramTwinSuffix, "gebiter.solr.ngram-twin-suffix");
		this.referenceFieldType = referenceFieldType;
		this.referenceFieldIndexed = referenceFieldIndexed;
		this.referenceFieldStored = referenceFieldStored;
		this.referenceFieldMultiValued = referenceFieldMultiValued;
		this.referenceFieldDocValues = referenceFieldDocValues;
		this.referenceFieldSuggestTwin = referenceFieldSuggestTwin;
		this.referenceFieldClientValueAccepted = referenceFieldClientValueAccepted;
		this.referenceFieldStartSearchWeight = referenceFieldStartSearchWeight;
		this.searchWeightMin = searchWeightMin;
		this.searchWeightMax = searchWeightMax;
	}

	public int searchWeightMin() {
		return searchWeightMin;
	}

	public int searchWeightMax() {
		return searchWeightMax;
	}

	public List<String> coreKeys() {
		return coreKeys;
	}

	public String suggestTwinSuffix() {
		return suggestTwinSuffix;
	}

	public String ngramTwinSuffix() {
		return ngramTwinSuffix;
	}

	public SolrFieldType referenceFieldType() {
		return referenceFieldType;
	}

	public boolean referenceFieldIndexed() {
		return referenceFieldIndexed;
	}

	public boolean referenceFieldStored() {
		return referenceFieldStored;
	}

	public boolean referenceFieldMultiValued() {
		return referenceFieldMultiValued;
	}

	public boolean referenceFieldDocValues() {
		return referenceFieldDocValues;
	}

	public boolean referenceFieldSuggestTwin() {
		return referenceFieldSuggestTwin;
	}

	public boolean referenceFieldClientValueAccepted() {
		return referenceFieldClientValueAccepted;
	}

	public int referenceFieldStartSearchWeight() {
		return referenceFieldStartSearchWeight;
	}
}
