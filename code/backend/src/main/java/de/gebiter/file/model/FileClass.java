package de.gebiter.file.model;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import de.gebiter.badge.model.BadgeLook;
import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Eine Dateiart, z. B. {@code FOTO_URLAUB} oder {@code VIDEO_GAMEPLAY} (bei der Vorlage FileSubClass). Jede Datei im
 * Solr-Kern {@code FILE} gehört zu genau einer FileClass. Die FileClass bestimmt, wer die Datei lesen und schreiben darf
 * ({@link FileClassAccessRole}) und welche Endungen sie annimmt ({@link FileClassFileExtension}).
 * <p>
 * Wie in der Vorlage hat jede FileClass ein Symbol, bei uns gleich ein ganzes Badge ({@link BadgeLook}: Symbol, Verlauf,
 * Struktur, Effekte, Farben), damit sie in Auswahl und Listen ein Hingucker ist (Wunsch des Nutzers 2026-11-08).
 * <p>
 * Anlegen und Ändern darf nur der Admin.
 * <p>
 * Doku: {@code docu/entities/FileClass.md}.
 */
@Entity
@Table(name = "file_class")
public class FileClass {

	/** Fester technischer Schlüssel nach der Key-Regel. Spaltenname mit Präfix, weil {@code key} in SQL ein Schlüsselwort ist. */
	@Id
	@Column(name = "file_class_key", nullable = false, updatable = false, length = 100)
	private String key;

	/** Mehrsprachiger Anzeigename als JSON, z. B. {@code {"de": "Urlaubsbilder"}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/** Mehrsprachige Beschreibung: was in diese Dateiart gehört. Optional. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, String> description;

	/** Platz in der Anzeige, von oben nach unten ab 1. Neue kommen ans Ende. */
	@Column(nullable = false)
	private int listingPosition;

	/** Das Aussehen als Badge (Kachel), samt Symbol. {@code null}: der Standard aus base.css. */
	@Embedded
	private BadgeLook badgeLook;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected FileClass() {
	}

	public FileClass(String key, Map<String, String> displayName, Map<String, String> description, int listingPosition,
			BadgeLook badgeLook) {
		this.key = Helper.requireValidKey(key);
		this.displayName = displayName;
		this.description = description;
		this.listingPosition = listingPosition;
		this.badgeLook = badgeLook;
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

	public BadgeLook getBadgeLook() {
		return badgeLook;
	}

	public void setBadgeLook(BadgeLook badgeLook) {
		this.badgeLook = badgeLook;
	}
}
