package de.gebiter.file.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileClassFileExtension;
import de.gebiter.file.service.FileClassFileExtensionService;

/**
 * Endpunkte der Klasse {@link FileClassFileExtension} für jeden angemeldeten User: nur die Liste. Das Frontend prüft damit
 * die Endung einer Datei schon beim Ablegen. Die Verwaltung steht im {@link FileClassFileExtensionAdminController}.
 * <p>
 * Doku: {@code docu/entities/FileClassFileExtension.md}.
 */
@RestController
@RequestMapping("/api/file-class-file-extension")
public class FileClassFileExtensionController {

	private final FileClassFileExtensionService fileClassFileExtensionService;

	public FileClassFileExtensionController(FileClassFileExtensionService fileClassFileExtensionService) {
		this.fileClassFileExtensionService = fileClassFileExtensionService;
	}

	/** READ: Alle Freischaltungen aller FileClasses. */
	@GetMapping
	public ResponseEntity<List<FileClassFileExtension>> getAllFileClassFileExtension() {
		List<FileClassFileExtension> allFileClassFileExtension = fileClassFileExtensionService
				.getAllFileClassFileExtension();
		return ResponseEntity.ok(allFileClassFileExtension);
	}
}
