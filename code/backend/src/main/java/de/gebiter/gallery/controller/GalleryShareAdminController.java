package de.gebiter.gallery.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.gallery.dto.GalleryShareForAdmin;
import de.gebiter.gallery.service.GalleryShareService;

/**
 * Admin-Endpunkte der Freigaben einer Galerie über einen Token, nur mit der AR ADMIN (Pfad {@code /api/admin/**}): die
 * Übersicht über alle Freigaben aller Galerien (Nutzer 2026-11-20, Konzept {@code docu/konzept-galerie-freigabe.md},
 * Abschnitt 9). Er nutzt nur den {@link GalleryShareService}, nie ein Repository.
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
}
