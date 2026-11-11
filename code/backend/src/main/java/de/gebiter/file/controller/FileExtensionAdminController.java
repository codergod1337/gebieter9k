package de.gebiter.file.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileExtension;
import de.gebiter.file.service.FileExtensionService;
import de.gebiter.util.Helper;
import de.gebiter.util.dto.ListingOrder;

/**
 * Admin-Endpunkte der Klasse {@link FileExtension}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den
 * {@link FileExtensionService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/FileExtension.md}.
 */
@RestController
@RequestMapping("/api/admin/file-extension")
public class FileExtensionAdminController {

	private final FileExtensionService fileExtensionService;

	public FileExtensionAdminController(FileExtensionService fileExtensionService) {
		this.fileExtensionService = fileExtensionService;
	}

	/**
	 * CREATE: Legt eine Endung an. Body: {@code {"extension": "jpg", "description": {"de": "JPEG-Bild"},
	 * "fileExtensionGroupKey": "BILD", "imagePreview": true}}, die Gruppe darf {@code null} sein.
	 */
	@PostMapping
	public ResponseEntity<FileExtension> createFileExtension(@RequestBody FileExtension newFileExtension) {
		String requestedFileExtension = newFileExtension.getExtension();
		Map<String, String> requestedDescription = newFileExtension.getDescription();
		String requestedFileExtensionGroupKey = newFileExtension.getFileExtensionGroupKey();
		boolean requestedImagePreview = newFileExtension.isImagePreview();

		FileExtension createdFileExtension = fileExtensionService.createFileExtension(requestedFileExtension,
				requestedDescription, requestedFileExtensionGroupKey, requestedImagePreview);

		String createdExtension = createdFileExtension.getExtension();
		String createdFileExtensionPath = "/api/admin/file-extension/" + createdExtension;
		URI createdFileExtensionLocation = URI.create(createdFileExtensionPath);
		return ResponseEntity.created(createdFileExtensionLocation).body(createdFileExtension);
	}

	/** READ: Eine Endung. Die Form wird zuerst geprüft, nie ein Text mit Sonderzeichen im Pfad. */
	@GetMapping("/{fileExtension}")
	public ResponseEntity<FileExtension> getFileExtension(@PathVariable String fileExtension) {
		Helper.requireValidFileExtension(fileExtension);
		FileExtension foundFileExtension = fileExtensionService.getFileExtension(fileExtension);
		return ResponseEntity.ok(foundFileExtension);
	}

	/** UPDATE: Ändert eine Endung. Body: das volle Objekt, maßgeblich ist {@code extension}. */
	@PutMapping
	public ResponseEntity<FileExtension> changeFileExtension(@RequestBody FileExtension changedFileExtension) {
		FileExtension savedFileExtension = fileExtensionService.changeFileExtension(changedFileExtension);
		return ResponseEntity.ok(savedFileExtension);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop. Body: {@code {"keysInOrder": ["jpg", "png", "mp4"]}}, jede Endung
	 * genau einmal. Zurück kommen alle Endungen in neuer Reihenfolge.
	 */
	@PutMapping("/listing-position")
	public ResponseEntity<List<FileExtension>> changeFileExtensionListingPositions(
			@RequestBody ListingOrder listingOrder) {
		List<String> fileExtensionsInOrder = listingOrder.keysInOrder();
		List<FileExtension> allFileExtensions = fileExtensionService
				.changeFileExtensionListingPositions(fileExtensionsInOrder);
		return ResponseEntity.ok(allFileExtensions);
	}

	/** DELETE: Löscht eine Endung samt ihrer Freischaltungen. Im Body reicht {@code {"extension": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteFileExtension(@RequestBody FileExtension fileExtensionToDelete) {
		String fileExtension = fileExtensionToDelete.getExtension();
		fileExtensionService.deleteFileExtension(fileExtension);
		return ResponseEntity.noContent().build();
	}
}
