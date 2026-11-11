package de.gebiter.gallery.controller;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.dto.FileDocumentPage;
import de.gebiter.file.dto.FileUploadResult;
import de.gebiter.file.service.FileUploadService;
import de.gebiter.gallery.dto.GalleryChangeRequest;
import de.gebiter.gallery.dto.GalleryDeleteRequest;
import de.gebiter.gallery.dto.GalleryFileListingOrder;
import de.gebiter.gallery.dto.GalleryFileResolveRequest;
import de.gebiter.gallery.dto.GalleryForClient;
import de.gebiter.gallery.dto.GalleryListingOrder;
import de.gebiter.gallery.dto.GalleryResolveRequest;
import de.gebiter.gallery.dto.NewGallery;
import de.gebiter.gallery.model.Gallery;
import de.gebiter.gallery.service.GalleryService;
import de.gebiter.status.model.Visibility;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Die Galerien im Profil für jeden angemeldeten User (Konzept {@code docu/konzept-galerie.md}). Wer was sehen und ändern
 * darf, prüft der {@link GalleryService}; geändert wird nur Eigenes, die GUID kommt aus dem Token. Hochladen in eine
 * Galerie läuft über den {@link FileUploadService}, wie jeder Upload: JSON plus Bytes, je Request eine Datei.
 * <p>
 * Doku: {@code docu/entities/Gallery.md}, {@code docu/solr-cores/FILE.md}.
 */
@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

	private final GalleryService galleryService;

	private final FileUploadService fileUploadService;

	public GalleryController(GalleryService galleryService, FileUploadService fileUploadService) {
		this.galleryService = galleryService;
		this.fileUploadService = fileUploadService;
	}

	/** CREATE: Eine eigene Galerie anlegen. Body: {@code {"title": "…", "description": "…", "visibility": "FRIENDS"}}. */
	@PostMapping
	public ResponseEntity<Gallery> createOwnGallery(@RequestBody NewGallery newGallery) {
		String title = newGallery.title();
		Map<String, String> description = newGallery.description();
		Visibility visibility = newGallery.visibility();
		Gallery createdGallery = galleryService.createOwnGallery(title, description, visibility);
		return ResponseEntity.ok(createdGallery);
	}

	/**
	 * CREATE: Eine Datei in eine eigene Galerie hochladen. Multipart: erst {@code data} als JSON
	 * {@code {"galleryId": 7, "fieldValuesByFieldName": {"fileClassKey": "…"}}}, dann {@code file}.
	 */
	@PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<FileUploadResult> uploadFileIntoGallery(HttpServletRequest request) throws IOException {
		InputStream requestBody = request.getInputStream();
		String contentType = request.getContentType();
		long requestContentLength = request.getContentLengthLong();
		FileUploadResult uploadResult = fileUploadService.uploadFileIntoGallery(requestBody, contentType,
				requestContentLength);
		return ResponseEntity.ok(uploadResult);
	}

	/** READ: Eine Galerie, wenn man sie sehen darf; sonst 404. */
	@GetMapping("/{id}")
	public ResponseEntity<GalleryForClient> getGalleryForClient(@PathVariable Long id) {
		GalleryForClient galleryForClient = galleryService.getGalleryForClient(id);
		return ResponseEntity.ok(galleryForClient);
	}

	/** READ: Die Galerien eines Profils, die man sehen darf. Body: {@code {"ownerUsersGuid": "…"}}. */
	@PostMapping("/resolve")
	public ResponseEntity<List<GalleryForClient>> resolveGalleries(@RequestBody GalleryResolveRequest resolveRequest) {
		UUID ownerUsersGuid = resolveRequest.ownerUsersGuid();
		List<GalleryForClient> galleries = galleryService.resolveGalleries(ownerUsersGuid);
		return ResponseEntity.ok(galleries);
	}

	/** READ: Eine Seite der Bilder einer Galerie. Body: {@code {"galleryId": 7, "page": 0}}. */
	@PostMapping("/file/resolve")
	public ResponseEntity<FileDocumentPage> resolveGalleryFiles(@RequestBody GalleryFileResolveRequest resolveRequest) {
		Long galleryId = resolveRequest.galleryId();
		int page = resolveRequest.page();
		FileDocumentPage galleryFilePage = galleryService.resolveGalleryFiles(galleryId, page);
		return ResponseEntity.ok(galleryFilePage);
	}

	/** UPDATE: Titel, Beschreibung und Sichtbarkeit einer eigenen Galerie. */
	@PutMapping
	public ResponseEntity<Gallery> changeOwnGallery(@RequestBody GalleryChangeRequest changeRequest) {
		Long id = changeRequest.id();
		String title = changeRequest.title();
		Map<String, String> description = changeRequest.description();
		Visibility visibility = changeRequest.visibility();
		Gallery changedGallery = galleryService.changeOwnGallery(id, title, description, visibility);
		return ResponseEntity.ok(changedGallery);
	}

	/** UPDATE: Die eigenen Galerien neu sortieren. Body: {@code {"galleryIdsInOrder": [3, 1, 2]}}. */
	@PutMapping("/listing-position")
	public ResponseEntity<List<Gallery>> changeOwnGalleryListingPositions(@RequestBody GalleryListingOrder listingOrder) {
		List<Long> galleryIdsInOrder = listingOrder.galleryIdsInOrder();
		List<Gallery> reorderedGalleries = galleryService.changeOwnGalleryListingPositions(galleryIdsInOrder);
		return ResponseEntity.ok(reorderedGalleries);
	}

	/**
	 * UPDATE: Die Bilder einer Seite einer eigenen Galerie neu sortieren. Body: {@code {"galleryId": 7, "page": 0,
	 * "fileDocumentIdsInOrder": ["…", "…"]}}.
	 */
	@PutMapping("/file/listing-position")
	public ResponseEntity<Void> changeOwnGalleryFileListingPositions(@RequestBody GalleryFileListingOrder listingOrder) {
		Long galleryId = listingOrder.galleryId();
		int page = listingOrder.page();
		List<String> fileDocumentIdsInOrder = listingOrder.fileDocumentIdsInOrder();
		galleryService.changeOwnGalleryFileListingPositions(galleryId, page, fileDocumentIdsInOrder);
		return ResponseEntity.noContent().build();
	}

	/** DELETE: Eine eigene Galerie löschen; ihre Bilder bleiben, ohne Galerie und privat. Body: {@code {"id": 7}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnGallery(@RequestBody GalleryDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		galleryService.deleteOwnGallery(id);
		return ResponseEntity.noContent().build();
	}
}
