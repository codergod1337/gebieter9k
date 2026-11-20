package de.gebiter.gallery.model;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Eine Freigabe einer Galerie über einen Token (Konzept {@code docu/konzept-galerie-freigabe.md}): Wer den Link mit
 * dem Token hat, sieht die Bilder der Galerie ohne Anmeldung. Eine Galerie kann mehrere Freigaben nebeneinander
 * haben. Jede ist dauerhaft, zeitlich begrenzt ({@code expiresAt}) oder auf eine Zahl von Aufrufen begrenzt
 * ({@code maxAccessCount}).
 * <p>
 * Zwei Stellen müssen zusammenpassen, damit ein Besucher ein Bild bekommt: diese Zeile (gibt es die Freigabe, ist sie
 * noch gültig?) und das Solr-Dokument des Bildes, in dessen Feld {@code galleryShareTokenHashes} der Hash des Tokens
 * steht. Der Token selbst steht nur hier ({@code shareToken}): Aus ihm wird der Link, den der Besitzer der Galerie
 * jederzeit wieder ansehen und weiterschicken kann (Nutzer 2026-11-20). In Solr steht nur sein SHA-256. Lose gekoppelt,
 * ohne JPA-Beziehungen.
 * <p>
 * Doku: {@code docu/entities/GalleryShare.md}.
 */
@Entity
@Table(name = "gallery_share")
public class GalleryShare {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Die Galerie, die freigegeben ist. */
	@Column(nullable = false, updatable = false)
	private Long galleryId;

	/**
	 * Die Bezeichnung der Freigabe, z. B. „für Oma“, höchstens {@code gebiter.gallery-share.label-max-length} Zeichen. An
	 * ihr erkennt der Besitzer seine Freigaben wieder; ein Besucher sieht sie nicht.
	 */
	@Column(nullable = false, length = 500)
	private String label;

	/**
	 * Der Token der Freigabe als Hex-Text ({@code gebiter.gallery-share.token-bytes} Byte Zufall). Er steht im Link, den
	 * der Besitzer weiterschickt: {@code /share/galerie/<shareToken>}. Nur der Besitzer der Galerie bekommt ihn zu sehen.
	 */
	@Column(nullable = false, unique = true, updatable = false, length = 500)
	private String shareToken;

	/** SHA-256 des Tokens als Hex-Text. Derselbe Wert steht in den Solr-Dokumenten der Bilder. */
	@Column(nullable = false, unique = true, updatable = false, length = 64)
	private String shareTokenHash;

	/** Bis wann die Freigabe gilt, {@code null} ohne zeitliche Grenze. */
	@Column
	private Instant expiresAt;

	/** Wie viele Aufrufe die Freigabe höchstens erlaubt, {@code null} ohne Grenze. */
	@Column
	private Long maxAccessCount;

	/** Wie viele Aufrufe es schon gab. Ein Aufruf: Ein Bild wird heruntergeladen oder der Viewer lädt es. */
	@Column(nullable = false)
	private long accessCount;

	/**
	 * In wie vielen Bildern der Hash stehen soll: beim Anlegen die Zahl der beschriebenen Dokumente, danach mitgezählt bei
	 * jedem Upload in die Galerie und jedem gelöschten Bild. Die Kontrolle vergleicht sie mit der Zahl in Solr.
	 */
	@Column(nullable = false)
	private long fileCount;

	/** Wann die Freigabe angelegt wurde. */
	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	/** Für JPA. */
	protected GalleryShare() {
	}

	public GalleryShare(Long galleryId, String label, String shareToken, String shareTokenHash, Instant expiresAt,
			Long maxAccessCount) {
		this.galleryId = galleryId;
		this.label = label;
		this.shareToken = shareToken;
		this.shareTokenHash = shareTokenHash;
		this.expiresAt = expiresAt;
		this.maxAccessCount = maxAccessCount;
	}

	public Long getId() {
		return id;
	}

	public Long getGalleryId() {
		return galleryId;
	}

	public String getLabel() {
		return label;
	}

	public String getShareToken() {
		return shareToken;
	}

	public String getShareTokenHash() {
		return shareTokenHash;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Long getMaxAccessCount() {
		return maxAccessCount;
	}

	public long getAccessCount() {
		return accessCount;
	}

	public long getFileCount() {
		return fileCount;
	}

	public void setFileCount(long fileCount) {
		this.fileCount = fileCount;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
