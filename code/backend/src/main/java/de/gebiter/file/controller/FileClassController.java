package de.gebiter.file.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileClass;
import de.gebiter.file.service.FileClassService;

/**
 * Endpunkte der Klasse {@link FileClass} für jeden angemeldeten User: nur die Liste, z. B. für die Stammdaten des Frontends
 * und die Auswahl beim Upload. Die Verwaltung steht im {@link FileClassAdminController}.
 * <p>
 * Doku: {@code docu/entities/FileClass.md}.
 */
@RestController
@RequestMapping("/api/file-class")
public class FileClassController {

	private final FileClassService fileClassService;

	public FileClassController(FileClassService fileClassService) {
		this.fileClassService = fileClassService;
	}

	/** READ: Alle FileClasses in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<FileClass>> getAllFileClass() {
		List<FileClass> allFileClass = fileClassService.getAllFileClass();
		return ResponseEntity.ok(allFileClass);
	}
}
