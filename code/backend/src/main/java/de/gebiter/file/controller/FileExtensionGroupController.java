package de.gebiter.file.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileExtensionGroup;
import de.gebiter.file.service.FileExtensionGroupService;

/**
 * Endpunkte der Klasse {@link FileExtensionGroup} für jeden angemeldeten User: nur die Liste, für die Stammdaten des
 * Frontends. Die Verwaltung steht im {@link FileExtensionGroupAdminController}.
 * <p>
 * Doku: {@code docu/entities/FileExtensionGroup.md}.
 */
@RestController
@RequestMapping("/api/file-extension-group")
public class FileExtensionGroupController {

	private final FileExtensionGroupService fileExtensionGroupService;

	public FileExtensionGroupController(FileExtensionGroupService fileExtensionGroupService) {
		this.fileExtensionGroupService = fileExtensionGroupService;
	}

	/** READ: Alle Gruppen in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<FileExtensionGroup>> getAllFileExtensionGroup() {
		List<FileExtensionGroup> allFileExtensionGroup = fileExtensionGroupService.getAllFileExtensionGroup();
		return ResponseEntity.ok(allFileExtensionGroup);
	}
}
