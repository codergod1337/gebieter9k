package de.gebiter.gallery.model;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Ein Uploadberechtigter einer Galerie (Nutzer 2026-11-22, Konzept {@code docu/konzept-galerie.md}, Abschnitt
 * „Gemeinsame Galerie“): Der Besitzer trägt einen anderen User ein, der dann Bilder in diese Galerie hochladen darf,
 * z. B. für eine gemeinsame Ablage von Urlaubsbildern. Ein Uploadberechtigter sieht immer die ganze Galerie mit allen
 * Bildern, egal wie sie eingestellt ist, und bearbeitet und löscht seine eigenen Uploads; über jedes Bild der Galerie
 * bestimmt der Besitzer.
 * <p>
 * Je Galerie und User höchstens ein Eintrag. Die Bilder merken sich nichts davon: Wer in welche Galerie hochladen darf,
 * liegt je angemeldetem User im Hauptspeicher (wie die Freundesliste), der Lesefilter fragt dafür kein Postgres. Lose
 * gekoppelt, ohne JPA-Beziehungen.
 * <p>
 * Doku: {@code docu/entities/GalleryUploader.md}.
 */
@Entity
@Table(name = "gallery_uploader", uniqueConstraints = @UniqueConstraint(name = "uq_gallery_uploader", columnNames = {
		"gallery_id", "uploader_users_guid" }))
public class GalleryUploader {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Die Galerie, in die der User hochladen darf. */
	@Column(nullable = false, updatable = false)
	private Long galleryId;

	/** GUID des Users, der in die Galerie hochladen darf. Nie der Besitzer der Galerie: Der darf es ohnehin. */
	@Column(nullable = false, updatable = false)
	private UUID uploaderUsersGuid;

	/** Für JPA. */
	protected GalleryUploader() {
	}

	public GalleryUploader(Long galleryId, UUID uploaderUsersGuid) {
		this.galleryId = galleryId;
		this.uploaderUsersGuid = uploaderUsersGuid;
	}

	public Long getId() {
		return id;
	}

	public Long getGalleryId() {
		return galleryId;
	}

	public UUID getUploaderUsersGuid() {
		return uploaderUsersGuid;
	}
}
