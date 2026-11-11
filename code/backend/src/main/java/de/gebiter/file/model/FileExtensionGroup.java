package de.gebiter.file.model;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Eine Übergruppe der Endungen, z. B. Bilder, Videos oder Dokumente (bei der Vorlage FileExtensionCollection). Sie dient
 * der Verwaltung: Der Tab „Endungen“ und die Matrix FileClass × Endung zeigen die Endungen nach Gruppen, mit
 * Zwischenüberschrift. Welche Gruppe eine Endung hat, steht an der {@link FileExtension}.
 * <p>
 * Anlegen, Ändern, Verschieben und Löschen darf nur der Admin. Eine gelöschte Gruppe nimmt keine Endung mit, ihre
 * Endungen stehen danach ohne Gruppe.
 * <p>
 * Doku: {@code docu/entities/FileExtensionGroup.md}.
 */
@Entity
@Table(name = "file_extension_group")
public class FileExtensionGroup {

	/** Fester technischer Schlüssel nach der Key-Regel, z. B. {@code BILD}. Spaltenname mit Präfix, {@code key} ist SQL. */
	@Id
	@Column(name = "file_extension_group_key", nullable = false, updatable = false, length = 100)
	private String key;

	/** Mehrsprachiger Anzeigename als JSON, z. B. {@code {"de": "Bilder"}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/** Platz der Gruppe in Katalog und Matrix, von oben nach unten ab 1. Neue kommen ans Ende. */
	@Column(nullable = false)
	private int listingPosition;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected FileExtensionGroup() {
	}

	public FileExtensionGroup(String key, Map<String, String> displayName, int listingPosition) {
		this.key = Helper.requireValidKey(key);
		this.displayName = displayName;
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

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}
}
