package de.gebiter.gallery.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.gallery.dto.GalleryShareChangeRequest;
import de.gebiter.gallery.dto.GalleryShareDeleteRequest;
import de.gebiter.gallery.dto.GalleryShareForAdmin;
import de.gebiter.gallery.dto.GalleryShareForClient;
import de.gebiter.gallery.service.GalleryShareService;

/**
 * Admin-Endpunkte der Freigaben einer Galerie über einen Token, nur mit der AR ADMIN (Pfad {@code /api/admin/**}): die
 * Übersicht über alle Freigaben aller Galerien (Nutzer 2026-11-20, Konzept {@code docu/konzept-galerie-freigabe.md},
 * Abschnitt 9), dazu jede Freigabe ändern und löschen (Nutzer 2026-11-21). Er nutzt nur den
 * {@link GalleryShareService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/Gallery.md}, {@code docu/entities/GalleryShare.md}.
 */
@RestController
@RequestMapping("/api/admin/gallery-share")
public class GalleryShareAdminController {

	private final GalleryShareService galleryShareService;

	public GalleryShareAdminController(GalleryShareService galleryShareService) {
		this.galleryShareService = galleryShareService;
	}

	/**
	 * READ: Alle Freigaben aller Galerien, die neueste zuerst, je mit ihrem Token für den Link, der Kontrollzahl aus
	 * Solr, dem Titel der Galerie und ihrem Besitzer.
	 */
	@GetMapping
	public ResponseEntity<List<GalleryShareForAdmin>> getAllGalleryShare() {
		List<GalleryShareForAdmin> allGalleryShare = galleryShareService.getAllGalleryShare();
		return ResponseEntity.ok(allGalleryShare);
	}

	/**
	 * UPDATE: Eine beliebige Freigabe ändern: Bezeichnung und Laufzeit. Body: {@code {"id": 15, "label": "Für alle",
	 * "expiresAt": null, "maxAccessCount": 500}}; ohne {@code expiresAt} und ohne {@code maxAccessCount} gilt sie
	 * dauerhaft, höchstens eins von beiden darf gesetzt sein. Der Link bleibt derselbe. Die Antwort ist die geänderte
	 * Freigabe.
	 */
	@PutMapping
	public ResponseEntity<GalleryShareForClient> changeGalleryShare(@RequestBody GalleryShareChangeRequest changeRequest) {
		Long id = changeRequest.id();
		String label = changeRequest.label();
		Instant expiresAt = changeRequest.expiresAt();
		Long maxAccessCount = changeRequest.maxAccessCount();
		GalleryShareForClient changedGalleryShare = galleryShareService.changeGalleryShare(id, label, expiresAt,
				maxAccessCount);
		return ResponseEntity.ok(changedGalleryShare);
	}

	/**
	 * DELETE: Eine beliebige Freigabe löschen; ihr Link öffnet danach nichts mehr. Zuerst kommt sie aus den Bildern in
	 * Solr, dann aus Postgres. Body: {@code {"id": 15}}.
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteGalleryShare(@RequestBody GalleryShareDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		galleryShareService.deleteGalleryShare(id);
		return ResponseEntity.noContent().build();
	}
}
