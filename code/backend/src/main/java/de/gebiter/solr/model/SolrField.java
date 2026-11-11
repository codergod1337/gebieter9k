package de.gebiter.solr.model;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Ein Feld eines Solr-Kerns, so wie wir es in Postgres definieren: Name, Typ, die Schalter für Solr, die Zwillinge,
 * wer das Feld in einer Antwort bekommt, wer es setzen darf und wie schwer es in der Suche wiegt. Je Kern ist jeder Name
 * nur einmal vergeben. Den Kern nennt {@code solrCoreKey}, einer der Kerne aus {@code gebiter.solr.core-keys}.
 * <p>
 * Das Backend hält die Felder als Kopie im Speicher und liest sie nicht je Anfrage aus Postgres. Nach Solr bringt sie
 * der {@code SolrSchemaSyncService} (Schema-API, beim Start und nach jeder Änderung).
 * <p>
 * Eine Referenz ({@code SolrReference}, die Hooks der Vorlage) liegt in jedem Kern als eigene Zeile hier, mit
 * {@link #solrReferenceKey} gleich ihrem Key und {@code name} gleich dem Key. Typ, Schalter, Zwilling und „vom Client“
 * stehen fest ({@code gebiter.solr.reference-field.*}), je Kern änderbar sind nur Leserollen und Suchgewicht. Die Zeilen
 * entstehen und verschwinden mit der Referenz.
 * <p>
 * Doku: {@code docu/entities/SolrField.md}.
 */
@Entity
@Table(name = "solr_field", uniqueConstraints = @UniqueConstraint(name = "uq_solr_field",
		columnNames = { "solr_core_key", "name" }))
public class SolrField {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Zu welchem Kern das Feld gehört. */
	@Column(name = "solr_core_key", nullable = false, updatable = false, length = 100)
	private String solrCoreKey;

	/** Der Feldname in Solr, nach der Feldnamen-Regel ({@code Helper.requireValidSolrFieldName}), z. B. {@code authorUsersGuid}. */
	@Column(nullable = false, length = 100)
	private String name;

	/** Der Feldtyp in Solr aus dem Katalog {@code SolrFieldType}, z. B. STRING oder TEXT_SUCHE. */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private SolrFieldType type;

	/** Solr: Kann man nach dem Feld suchen, filtern, sortieren? */
	@Column(nullable = false)
	private boolean indexed;

	/** Solr: Liefert Solr den Wert zurück? */
	@Column(nullable = false)
	private boolean stored;

	/** Solr: Darf das Feld mehrere Werte haben? */
	@Column(nullable = false)
	private boolean multiValued;

	/** Solr: Spaltenspeicher für schnelles Sortieren und Facetten. */
	@Column(nullable = false)
	private boolean docValues;

	/** Solr: Muss jedes Dokument das Feld haben? */
	@Column(nullable = false)
	private boolean required;

	/**
	 * Zwilling {@code <name>Suggest} für die Vervollständigung beim Tippen, Solr füllt ihn per copyField. Nur bei Typen,
	 * die ihn erlauben ({@link SolrFieldType#isSuggestTwinAllowed()}).
	 */
	@Column(nullable = false)
	private boolean suggestTwin;

	/**
	 * Zwilling {@code <name>Ngram}, in dem jedes Stück ab 3 Zeichen trifft, an jeder Stelle des Werts. Das Feld selbst
	 * bleibt, wie es ist. Nur bei Werten mit Text ({@link SolrFieldType#isNgramTwinAllowed()}).
	 */
	@Column(nullable = false)
	private boolean ngramTwin;

	/**
	 * Vom Client übernehmbar: Schickt der Client beim Upload oder Bearbeiten einen Wert für das Feld mit, nimmt das Backend
	 * ihn an. Ein Kann, kein Muss: Ohne Wert bleibt das Feld leer oder bekommt den Wert des Backends. Aus heißt: Der Wert
	 * kommt nie vom Client, er fällt still weg; das Backend oder die Auswertung (Tika) ist Herr der Information. Nur in
	 * Postgres, nie in Solr.
	 */
	@Column(nullable = false)
	private boolean clientValueAccepted;

	/**
	 * Gewicht in der Freitextsuche: -1 nicht durchsucht, 0 durchsucht ohne Punkte (ein Treffer zählt, ordnet aber nicht),
	 * ab 1 das Gewicht. Ab 0 nur mit {@code indexed}. Nur in Postgres, nie in Solr.
	 */
	@Column(nullable = false)
	private int searchWeight;

	/**
	 * Der Key des einen Rechts, mit dem man das Feld in einer Antwort des Backends bekommt („Wer liest“). Wer es nicht hat,
	 * bekommt das Feld nicht. {@code null} heißt: kein User bekommt es (nur das Backend selbst nutzt es, z. B.
	 * {@code sftpPath}).
	 */
	private String readerAccessRoleKey;

	/** Mehrsprachiger Anzeigename als JSON, z. B. {@code {"de": "Besitzer"}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/** Mehrsprachige Beschreibung als JSON: wozu das Feld da ist und was hineingehört. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, String> description;

	/** Reihenfolge in der Feldtabelle des Kerns, nicht eindeutig. */
	@Column(nullable = false)
	private int listingPosition;

	/** Gesetzt nur an der Zeile einer Referenz: ihr Key. {@code null} bei einem normalen Feld. */
	@Column(length = 100)
	private String solrReferenceKey;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected SolrField() {
	}

	public SolrField(String solrCoreKey, String name, SolrFieldType type) {
		this.solrCoreKey = solrCoreKey;
		this.name = name;
		this.type = type;
	}

	public Long getId() {
		return id;
	}

	public String getSolrCoreKey() {
		return solrCoreKey;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public SolrFieldType getType() {
		return type;
	}

	public void setType(SolrFieldType type) {
		this.type = type;
	}

	public boolean isIndexed() {
		return indexed;
	}

	public void setIndexed(boolean indexed) {
		this.indexed = indexed;
	}

	public boolean isStored() {
		return stored;
	}

	public void setStored(boolean stored) {
		this.stored = stored;
	}

	public boolean isMultiValued() {
		return multiValued;
	}

	public void setMultiValued(boolean multiValued) {
		this.multiValued = multiValued;
	}

	public boolean isDocValues() {
		return docValues;
	}

	public void setDocValues(boolean docValues) {
		this.docValues = docValues;
	}

	public boolean isRequired() {
		return required;
	}

	public void setRequired(boolean required) {
		this.required = required;
	}

	public boolean isSuggestTwin() {
		return suggestTwin;
	}

	public void setSuggestTwin(boolean suggestTwin) {
		this.suggestTwin = suggestTwin;
	}

	public boolean isNgramTwin() {
		return ngramTwin;
	}

	public void setNgramTwin(boolean ngramTwin) {
		this.ngramTwin = ngramTwin;
	}

	public boolean isClientValueAccepted() {
		return clientValueAccepted;
	}

	public void setClientValueAccepted(boolean clientValueAccepted) {
		this.clientValueAccepted = clientValueAccepted;
	}

	public int getSearchWeight() {
		return searchWeight;
	}

	public void setSearchWeight(int searchWeight) {
		this.searchWeight = searchWeight;
	}

	public String getReaderAccessRoleKey() {
		return readerAccessRoleKey;
	}

	public void setReaderAccessRoleKey(String readerAccessRoleKey) {
		this.readerAccessRoleKey = readerAccessRoleKey;
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

	public String getSolrReferenceKey() {
		return solrReferenceKey;
	}

	public void setSolrReferenceKey(String solrReferenceKey) {
		this.solrReferenceKey = solrReferenceKey;
	}

	/** Ist das die Zeile einer Referenz? Dann sind nur Leserollen und Suchgewicht änderbar. */
	public boolean isSolrReferenceField() {
		return solrReferenceKey != null;
	}
}
