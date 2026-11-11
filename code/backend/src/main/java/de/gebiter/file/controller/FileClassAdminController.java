package de.gebiter.file.controller;

import java.net.URI;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.badge.model.BadgeLook;
import de.gebiter.file.model.FileClass;
import de.gebiter.file.service.FileClassService;

/**
 * Admin-Endpunkte der Klasse {@link FileClass}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den
 * {@link FileClassService}, nie ein Repository. DELETE fehlt noch, siehe {@link FileClassService}.
 * <p>
 * Doku: {@code docu/entities/FileClass.md}.
 */
@RestController
@RequestMapping("/api/admin/file-class")
public class FileClassAdminController {

	private final FileClassService fileClassService;

	public FileClassAdminController(FileClassService fileClassService) {
		this.fileClassService = fileClassService;
	}

	/**
	 * CREATE: Legt eine FileClass an. Body: {@code {"key": "FOTO_URLAUB", "displayName": {"de": "Urlaubsbilder"},
	 * "description": {"de": "…"}, "badgeLook": {"symbolPack": "bi", "symbolName": "sun", …}}}.
	 */
	@PostMapping
	public ResponseEntity<FileClass> createFileClass(@RequestBody FileClass newFileClass) {
		String requestedFileClassKey = newFileClass.getKey();
		Map<String, String> requestedDisplayName = newFileClass.getDisplayName();
		Map<String, String> requestedDescription = newFileClass.getDescription();
		BadgeLook requestedBadgeLook = newFileClass.getBadgeLook();

		FileClass createdFileClass = fileClassService.createFileClass(requestedFileClassKey, requestedDisplayName,
				requestedDescription, requestedBadgeLook);

		String createdFileClassKey = createdFileClass.getKey();
		String createdFileClassPath = "/api/admin/file-class/" + createdFileClassKey;
		URI createdFileClassLocation = URI.create(createdFileClassPath);
		return ResponseEntity.created(createdFileClassLocation).body(createdFileClass);
	}

	/** READ: Eine FileClass über ihren Key. */
	@GetMapping("/{fileClassKey}")
	public ResponseEntity<FileClass> getFileClass(@PathVariable String fileClassKey) {
		FileClass foundFileClass = fileClassService.getFileClass(fileClassKey);
		return ResponseEntity.ok(foundFileClass);
	}

	/** UPDATE: Ändert eine FileClass. Body: das volle Objekt, maßgeblich ist {@code key}. */
	@PutMapping
	public ResponseEntity<FileClass> changeFileClass(@RequestBody FileClass changedFileClass) {
		FileClass savedFileClass = fileClassService.changeFileClass(changedFileClass);
		return ResponseEntity.ok(savedFileClass);
	}
}
