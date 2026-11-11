package de.gebiter.file.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileClassFileExtension;
import de.gebiter.file.service.FileClassFileExtensionService;

/**
 * Admin-Endpunkte der Klasse {@link FileClassFileExtension}: welche Endungen eine FileClass annimmt, nur mit der AR ADMIN
 * (Pfad {@code /api/admin/**}). Er nutzt nur den {@link FileClassFileExtensionService}, nie ein Repository. Genutzt von der
 * Matrix „FileClass × Endung“.
 * <p>
 * Kein UPDATE: Ein Eintrag besteht nur aus FileClass und Endung. Ändern heißt entfernen und neu freischalten.
 * <p>
 * Doku: {@code docu/entities/FileClassFileExtension.md}.
 */
@RestController
@RequestMapping("/api/admin/file-class-file-extension")
public class FileClassFileExtensionAdminController {

	private final FileClassFileExtensionService fileClassFileExtensionService;

	public FileClassFileExtensionAdminController(FileClassFileExtensionService fileClassFileExtensionService) {
		this.fileClassFileExtensionService = fileClassFileExtensionService;
	}

	/** CREATE: Schaltet eine Endung für eine FileClass frei. Body: {@code {"fileClassKey": "FOTO_URLAUB", "fileExtension": "jpg"}}. */
	@PostMapping
	public ResponseEntity<FileClassFileExtension> createFileClassFileExtension(
			@RequestBody FileClassFileExtension newFileClassFileExtension) {
		String requestedFileClassKey = newFileClassFileExtension.getFileClassKey();
		String requestedFileExtension = newFileClassFileExtension.getFileExtension();

		FileClassFileExtension createdFileClassFileExtension = fileClassFileExtensionService
				.createFileClassFileExtension(requestedFileClassKey, requestedFileExtension);

		Long createdFileClassFileExtensionId = createdFileClassFileExtension.getId();
		String createdFileClassFileExtensionPath = "/api/admin/file-class-file-extension/"
				+ createdFileClassFileExtensionId;
		URI createdFileClassFileExtensionLocation = URI.create(createdFileClassFileExtensionPath);
		return ResponseEntity.created(createdFileClassFileExtensionLocation).body(createdFileClassFileExtension);
	}

	/** READ: Ein Eintrag über seine {@code id}. */
	@GetMapping("/{id}")
	public ResponseEntity<FileClassFileExtension> getFileClassFileExtension(@PathVariable Long id) {
		FileClassFileExtension foundFileClassFileExtension = fileClassFileExtensionService
				.getFileClassFileExtension(id);
		return ResponseEntity.ok(foundFileClassFileExtension);
	}

	/** DELETE: Nimmt die Freischaltung zurück. Im Body reicht {@code {"id": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteFileClassFileExtension(
			@RequestBody FileClassFileExtension fileClassFileExtensionToDelete) {
		Long id = fileClassFileExtensionToDelete.getId();
		fileClassFileExtensionService.deleteFileClassFileExtension(id);
		return ResponseEntity.noContent().build();
	}
}
