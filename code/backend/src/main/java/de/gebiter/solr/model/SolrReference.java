package de.gebiter.solr.model;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Eine Referenz, bei uns der Name für die Hooks der Vorlage: ein Feld mit festem Aufbau (exakter Wert, mehrfach,
 * filterbar, Vervollständigung), das in JEDEM Kern gleich heißt und so über Kerne hinweg auffindbar macht. Erste
 * Referenz ist {@code wtf}: beliebige Markierungen an einem Dokument, z. B. {@code PROFILE_BANNER}.
 * <p>
 * Hier steht nur die Definition. In jedem Kern liegt die Referenz als eigene Zeile in {@code solr_field}
 * ({@link SolrField#getSolrReferenceKey()}), mit festen Einstellungen aus {@code gebiter.solr.reference-field.*}; dort
 * stehen je Kern auch Leserollen und Suchgewicht. Die Zeilen entstehen und verschwinden mit der Referenz.
 * <p>
 * Doku: {@code docu/entities/SolrReference.md}.
 */
@Entity
@Table(name = "solr_reference")
public class SolrReference {

	/** Der Name des Feldes in Solr (Feldnamen-Regel), z. B. {@code wtf}. Ändert sich nie. */
	@Id
	@Column(name = "solr_reference_key", nullable = false, updatable = false, length = 100)
	private String key;

	/** Mehrsprachiger Anzeigename als JSON, z. B. {@code {"de": "WTF"}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/** Mehrsprachige Beschreibung: wofür die Referenz da ist und welche Werte hineingehören. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, String> description;

	/** Platz in Listen und in der Feldtabelle jedes Kerns (unter den Feldern), ab 1. */
	@Column(nullable = false)
	private int listingPosition;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected SolrReference() {
	}

	public SolrReference(String key, Map<String, String> displayName, Map<String, String> description,
			int listingPosition) {
		this.key = key;
		this.displayName = displayName;
		this.description = description;
		this.listingPosition = listingPosition;
	}

	public String getKey() {
		return key;
	}

	public Map<String, String> getDisplayName() {
		return displayName;
	}

	public void setDisplayName(Map<String, String> displayName) {
		this.displayName = displayName;
	}

	public Map<String, String> getDescription() {
		return description;
	}

	public void setDescription(Map<String, String> description) {
		this.description = description;
	}

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}
}
