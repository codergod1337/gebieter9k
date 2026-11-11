package de.gebiter.gallery.model;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import de.gebiter.status.model.Visibility;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Eine Galerie im Profil (Konzept {@code docu/konzept-galerie.md}): Titel, Beschreibung und Sichtbarkeit legt der
 * Besitzer selbst fest. Sie ist der Einhängepunkt, über den normale User Bilder hochladen; jedes Bild liegt in genau
 * einer Galerie (Feld {@code galleryIds} im Solr-Dokument). Eine FileClass hat die Galerie nicht, die gehört zu jedem
 * Upload. Lose gekoppelt, ohne JPA-Beziehungen.
 * <p>
 * Doku: {@code docu/entities/Gallery.md}.
 */
@Entity
@Table(name = "gallery")
public class Gallery {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Wem die Galerie gehört. */
	@Column(nullable = false, updatable = false)
	private UUID ownerUsersGuid;

	/** Der Titel der Galerie, höchstens {@code gebiter.gallery.title-max-length} Zeichen. */
	@Column(nullable = false, length = 500)
	private String title;

	/**
	 * Die Beschreibung als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML aus dem Rich-Text-Editor
	 * (Nutzer 2026-11-09; vorerst nur Deutsch), {@code null} ohne.
	 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, String> description;

	/** Wer die Galerie und ihre Bilder sieht; die Bilder tragen sie in ihrem Solr-Dokument. */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private Visibility visibility;

	/** Platz unter den Galerien des Besitzers, per Drag and Drop. */
	@Column(nullable = false)
	private int listingPosition;

	/** Wann die Galerie angelegt wurde. */
	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected Gallery() {
	}

	public Gallery(UUID ownerUsersGuid, String title, Map<String, String> description, Visibility visibility,
			int listingPosition) {
		this.ownerUsersGuid = ownerUsersGuid;
		this.title = title;
		this.description = description;
		this.visibility = visibility;
		this.listingPosition = listingPosition;
	}

	public Long getId() {
		return id;
	}

	public UUID getOwnerUsersGuid() {
		return ownerUsersGuid;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public Map<String, String> getDescription() {
		return description;
	}

	public void setDescription(Map<String, String> description) {
		this.description = description;
	}

	public Visibility getVisibility() {
		return visibility;
	}

	public void setVisibility(Visibility visibility) {
		this.visibility = visibility;
	}

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}
