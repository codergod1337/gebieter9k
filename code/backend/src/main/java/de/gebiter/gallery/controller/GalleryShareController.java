package de.gebiter.gallery.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.gallery.dto.GalleryShareDeleteRequest;
import de.gebiter.gallery.dto.GalleryShareForClient;
import de.gebiter.gallery.dto.GalleryShareResolveRequest;
import de.gebiter.gallery.dto.NewGalleryShare;
import de.gebiter.gallery.service.GalleryShareService;

/**
 * Die Freigaben der eigenen Galerien für den angemeldeten User (Konzept {@code docu/konzept-galerie-freigabe.md}). Wer
 * was darf, prüft der {@link GalleryShareService}: anlegen nur mit dem Recht ADMIN oder FREIGABE und nur für eine eigene
 * Galerie; die GUID kommt aus dem Token.
 * <p>
 * Doku: {@code docu/entities/Gallery.md}, {@code docu/entities/GalleryShare.md}.
 */
@RestController
@RequestMapping("/api/gallery-share")
public class GalleryShareController {

	private final GalleryShareService galleryShareService;

	public GalleryShareController(GalleryShareService galleryShareService) {
		this.galleryShareService = galleryShareService;
	}

	/**
	 * CREATE: Eine eigene Galerie freigeben. Body: {@code {"galleryId": 7, "label": "für Oma"}} (dauerhaft), dazu
	 * wahlweise {@code "expiresAt": "2026-12-31T23:00:00Z"} (zeitlich begrenzt) oder {@code "maxAccessCount": 100} (auf
	 * Aufrufe begrenzt). Die Antwort ist die angelegte Freigabe mit ihrem Token für den Link.
	 */
	@PostMapping
	public ResponseEntity<GalleryShareForClient> createOwnGalleryShare(@RequestBody NewGalleryShare newGalleryShare) {
		Long galleryId = newGalleryShare.galleryId();
		String label = newGalleryShare.label();
		Instant expiresAt = newGalleryShare.expiresAt();
		Long maxAccessCount = newGalleryShare.maxAccessCount();
		GalleryShareForClient createdGalleryShare = galleryShareService.createOwnGalleryShare(galleryId, label, expiresAt,
				maxAccessCount);
		return ResponseEntity.ok(createdGalleryShare);
	}

	/**
	 * READ: Die Freigaben einer eigenen Galerie, je mit ihrem Token für den Link und der Kontrollzahl aus Solr. Body:
	 * {@code {"galleryId": 7}}.
	 */
	@PostMapping("/resolve")
	public ResponseEntity<List<GalleryShareForClient>> resolveOwnGalleryShares(
			@RequestBody GalleryShareResolveRequest resolveRequest) {
		Long galleryId = resolveRequest.galleryId();
		List<GalleryShareForClient> galleryShares = galleryShareService.resolveOwnGalleryShares(galleryId);
		return ResponseEntity.ok(galleryShares);
	}

	/**
	 * DELETE: Eine Freigabe einer eigenen Galerie löschen; ihr Link öffnet danach nichts mehr. Zuerst kommt sie aus den
	 * Bildern in Solr, dann aus Postgres. Body: {@code {"id": 3}}.
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnGalleryShare(@RequestBody GalleryShareDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		galleryShareService.deleteOwnGalleryShare(id);
		return ResponseEntity.noContent().build();
	}
}
