package de.gebiter.file.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileExtension;
import de.gebiter.file.service.FileExtensionService;

/**
 * Endpunkte der Klasse {@link FileExtension} für jeden angemeldeten User: nur die Liste, z. B. für die Stammdaten des
 * Frontends. Die Verwaltung steht im {@link FileExtensionAdminController}.
 * <p>
 * Doku: {@code docu/entities/FileExtension.md}.
 */
@RestController
@RequestMapping("/api/file-extension")
public class FileExtensionController {

	private final FileExtensionService fileExtensionService;

	public FileExtensionController(FileExtensionService fileExtensionService) {
		this.fileExtensionService = fileExtensionService;
	}

	/** READ: Alle Endungen in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<FileExtension>> getAllFileExtension() {
		List<FileExtension> allFileExtension = fileExtensionService.getAllFileExtension();
		return ResponseEntity.ok(allFileExtension);
	}
}
