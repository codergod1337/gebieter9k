package de.gebiter.file.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileClassDestinationAssignment;
import de.gebiter.file.service.FileClassDestinationAssignmentService;

/**
 * Die Ziele der FileClasses für jeden angemeldeten User, nur lesen: Daraus baut das Frontend das Dropdown eines
 * Upload-Wegs, z. B. beim Hochladen in eine Galerie. Zuordnen steht im {@link FileClassDestinationAssignmentAdminController}.
 * <p>
 * Doku: {@code docu/entities/FileClassDestinationAssignment.md}.
 */
@RestController
@RequestMapping("/api/file-class-destination-assignment")
public class FileClassDestinationAssignmentController {

	private final FileClassDestinationAssignmentService fileClassDestinationAssignmentService;

	public FileClassDestinationAssignmentController(
			FileClassDestinationAssignmentService fileClassDestinationAssignmentService) {
		this.fileClassDestinationAssignmentService = fileClassDestinationAssignmentService;
	}

	/** READ: Alle Zuordnungen. */
	@GetMapping
	public ResponseEntity<List<FileClassDestinationAssignment>> getAllFileClassDestinationAssignment() {
		List<FileClassDestinationAssignment> allAssignments = fileClassDestinationAssignmentService
				.getAllFileClassDestinationAssignment();
		return ResponseEntity.ok(allAssignments);
	}
}
