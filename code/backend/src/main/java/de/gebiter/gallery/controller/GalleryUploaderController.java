package de.gebiter.gallery.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.gallery.dto.GalleryUploaderDeleteRequest;
import de.gebiter.gallery.dto.GalleryUploaderResolveRequest;
import de.gebiter.gallery.dto.NewGalleryUploader;
import de.gebiter.gallery.model.GalleryUploader;
import de.gebiter.gallery.service.GalleryUploaderService;

/**
 * Die Uploadberechtigten der Galerien für den angemeldeten User (Nutzer 2026-11-22, Konzept
 * {@code docu/konzept-galerie.md}, Abschnitt „Gemeinsame Galerie“). Wer was darf, prüft der
 * {@link GalleryUploaderService}: eintragen und austragen nur der Besitzer der Galerie, die GUID kommt aus dem Token.
 * <p>
 * Doku: {@code docu/entities/GalleryUploader.md}, {@code docu/entities/Gallery.md}.
 */
@RestController
@RequestMapping("/api/gallery-uploader")
public class GalleryUploaderController {

	private final GalleryUploaderService galleryUploaderService;

	public GalleryUploaderController(GalleryUploaderService galleryUploaderService) {
		this.galleryUploaderService = galleryUploaderService;
	}

	/**
	 * CREATE: Einen User als Uploadberechtigten in eine eigene Galerie eintragen. Body:
	 * {@code {"galleryId": 7, "uploaderUsersGuid": "…"}}. 409, wenn er schon eingetragen ist.
	 */
	@PostMapping
	public ResponseEntity<GalleryUploader> createOwnGalleryUploader(@RequestBody NewGalleryUploader newGalleryUploader) {
		Long galleryId = newGalleryUploader.galleryId();
		UUID uploaderUsersGuid = newGalleryUploader.uploaderUsersGuid();
		GalleryUploader createdGalleryUploader = galleryUploaderService.createOwnGalleryUploader(galleryId,
				uploaderUsersGuid);
		return ResponseEntity.ok(createdGalleryUploader);
	}

	/**
	 * READ: Alle Einträge, in denen man selbst der Uploadberechtigte ist: die fremden Galerien, in die man hochladen darf.
	 * Für die Liste der Galerien im eigenen Profil; die Galerie selbst holt der Client über {@code GET /api/gallery/{id}}.
	 */
	@GetMapping
	public ResponseEntity<List<GalleryUploader>> getAllOwnGalleryUploader() {
		List<GalleryUploader> ownGalleryUploaders = galleryUploaderService.getAllOwnGalleryUploader();
		return ResponseEntity.ok(ownGalleryUploaders);
	}

	/**
	 * READ: Die Uploadberechtigten einer Galerie, die man sehen darf. Body: {@code {"galleryId": 7}}. 404, wenn man die
	 * Galerie nicht sehen darf.
	 */
	@PostMapping("/resolve")
	public ResponseEntity<List<GalleryUploader>> resolveGalleryUploaders(
			@RequestBody GalleryUploaderResolveRequest resolveRequest) {
		Long galleryId = resolveRequest.galleryId();
		List<GalleryUploader> galleryUploaders = galleryUploaderService.resolveGalleryUploaders(galleryId);
		return ResponseEntity.ok(galleryUploaders);
	}

	/**
	 * DELETE: Einen Uploadberechtigten aus einer eigenen Galerie austragen; seine Bilder bleiben in der Galerie. Body:
	 * {@code {"id": 3}}.
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnGalleryUploader(@RequestBody GalleryUploaderDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		galleryUploaderService.deleteOwnGalleryUploader(id);
		return ResponseEntity.noContent().build();
	}
}
