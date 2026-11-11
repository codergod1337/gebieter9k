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
 * Eine Dateiendung, die das System kennt, wie in der Vorlage jede einzeln angelegt. Welche FileClass sie annimmt, steht in
 * {@link FileClassFileExtension}. Die Endung selbst ist der Schlüssel, nach der Endungs-Regel ({@code jpg}, {@code mp4}).
 * Für die Verwaltung gehört sie zu einer Übergruppe ({@link FileExtensionGroup}, z. B. Bilder) und hat darin einen Platz:
 * Die wichtigen stehen vorn, nicht das Alphabet entscheidet.
 * <p>
 * Anlegen, Ändern, Verschieben und Löschen darf nur der Admin.
 * <p>
 * Doku: {@code docu/entities/FileExtension.md}.
 */
@Entity
@Table(name = "file_extension")
public class FileExtension {

	/** Die Endung, klein, ohne Punkt. Ändert sich nie. */
	@Id
	@Column(name = "file_extension", nullable = false, updatable = false, length = 20)
	private String extension;

	/** Mehrsprachige Beschreibung, z. B. {@code {"de": "JPEG-Bild"}}. Optional. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, String> description;

	/** Verweis auf {@link FileExtensionGroup#getKey()}, z. B. {@code BILD}. {@code null}: ohne Gruppe. */
	@Column(name = "file_extension_group_key", length = 100)
	private String fileExtensionGroupKey;

	/**
	 * Platz in der Anzeige, von oben nach unten ab 1, über alle Endungen. Innerhalb einer Gruppe bestimmt er die
	 * Reihenfolge. Neue kommen ans Ende.
	 */
	@Column(nullable = false)
	private int listingPosition;

	/** Rechnet das Backend beim Upload ein Vorschaubild (PNG 200 × 200) für Dateien mit dieser Endung? */
	@Column(nullable = false)
	private boolean imagePreview;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected FileExtension() {
	}

	public FileExtension(String extension, Map<String, String> description, String fileExtensionGroupKey,
			int listingPosition, boolean imagePreview) {
		this.extension = Helper.requireValidFileExtension(extension);
		this.description = description;
		this.fileExtensionGroupKey = fileExtensionGroupKey;
		this.listingPosition = listingPosition;
		this.imagePreview = imagePreview;
	}

	public String getExtension() {
		return extension;
	}

	public Map<String, String> getDescription() {
		return description;
	}

	public void setDescription(Map<String, String> description) {
		this.description = description;
	}

	public String getFileExtensionGroupKey() {
		return fileExtensionGroupKey;
	}

	public void setFileExtensionGroupKey(String fileExtensionGroupKey) {
		this.fileExtensionGroupKey = fileExtensionGroupKey;
	}

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}

	public boolean isImagePreview() {
		return imagePreview;
	}

	public void setImagePreview(boolean imagePreview) {
		this.imagePreview = imagePreview;
	}
}
