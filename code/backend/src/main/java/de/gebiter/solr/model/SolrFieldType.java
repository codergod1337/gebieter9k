package de.gebiter.solr.model;

/**
 * Die Typen, die ein Feld eines Solr-Kerns haben kann. Jeder steht für einen Feldtyp aus dem Basis-Configset
 * ({@code code/docker/solr/configsets/gebiter9k/conf/managed-schema.xml}); den Namen dort liefert
 * {@link #getSolrTypeName()}. Die Namen sind fest an das Configset gebunden, deshalb stehen sie hier und nicht in der
 * YAML: Ändert sich das Configset, ändert sich auch diese Liste.
 * <p>
 * Zwei Zwillinge kann ein Feld bekommen, beide füllt Solr selbst per copyField: den für die Vervollständigung beim
 * Tippen ({@code code_suggest}, nur bei exakten Werten und Zahlen) und den, in dem jedes Stück ab 3 Zeichen trifft
 * ({@code text_ngram}, nur bei Werten mit Text).
 */
public enum SolrFieldType {

	/** Ein exakter Wert, z. B. eine GUID, ein Key oder ein Pfad. */
	STRING("string", "code_suggest", "text_ngram"),

	/** Ja oder nein. */
	BOOLEAN("boolean", null, null),

	/** Ganze Zahl, z. B. Größe in Bytes oder ein Zähler. */
	LONG("plong", "code_suggest", null),

	/** Kommazahl, z. B. ein GPS-Wert. */
	DOUBLE("pdouble", "code_suggest", null),

	/** Zeitpunkt. */
	DATE("pdate", null, null),

	/** Text, der beim Tippen über Wortanfänge gefunden wird, z. B. Dateiname oder Titel. */
	TEXT_EDGE("text_edge", null, "text_ngram"),

	/** Volltext deutsch, z. B. der Text aus einer Datei. */
	TEXT_SUCHE("text_suche", null, "text_ngram");

	private final String solrTypeName;

	/** Der Feldtyp des Zwillings für die Vervollständigung, {@code null}: dieser Typ bekommt keinen. */
	private final String suggestTwinSolrTypeName;

	/** Der Feldtyp des Ngram-Zwillings, {@code null}: dieser Typ bekommt keinen. */
	private final String ngramTwinSolrTypeName;

	SolrFieldType(String solrTypeName, String suggestTwinSolrTypeName, String ngramTwinSolrTypeName) {
		this.solrTypeName = solrTypeName;
		this.suggestTwinSolrTypeName = suggestTwinSolrTypeName;
		this.ngramTwinSolrTypeName = ngramTwinSolrTypeName;
	}

	/** Der Name des Feldtyps im Configset, z. B. {@code plong}. */
	public String getSolrTypeName() {
		return solrTypeName;
	}

	/** Der Feldtyp des Zwillings für die Vervollständigung, {@code null} wenn dieser Typ keinen bekommt. */
	public String getSuggestTwinSolrTypeName() {
		return suggestTwinSolrTypeName;
	}

	/** Kann ein Feld dieses Typs den Zwilling für die Vervollständigung bekommen? */
	public boolean isSuggestTwinAllowed() {
		return suggestTwinSolrTypeName != null;
	}

	/** Der Feldtyp des Ngram-Zwillings, {@code null} wenn dieser Typ keinen bekommt. */
	public String getNgramTwinSolrTypeName() {
		return ngramTwinSolrTypeName;
	}

	/** Kann ein Feld dieses Typs den Ngram-Zwilling bekommen? Nur bei Werten mit Text. */
	public boolean isNgramTwinAllowed() {
		return ngramTwinSolrTypeName != null;
	}
}
