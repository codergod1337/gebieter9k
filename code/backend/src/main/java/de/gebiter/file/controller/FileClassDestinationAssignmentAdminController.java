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

import de.gebiter.file.model.FileClassDestination;
import de.gebiter.file.model.FileClassDestinationAssignment;
import de.gebiter.file.service.FileClassDestinationAssignmentService;

/**
 * Admin-Endpunkte der Ziele der FileClasses (Matrix „FileClass × Ziel“), nur mit der AR ADMIN.
 * <p>
 * Doku: {@code docu/entities/FileClassDestinationAssignment.md}.
 */
@RestController
@RequestMapping("/api/admin/file-class-destination-assignment")
public class FileClassDestinationAssignmentAdminController {

	private final FileClassDestinationAssignmentService fileClassDestinationAssignmentService;

	public FileClassDestinationAssignmentAdminController(
			FileClassDestinationAssignmentService fileClassDestinationAssignmentService) {
		this.fileClassDestinationAssignmentService = fileClassDestinationAssignmentService;
	}

	/** CREATE: Bietet eine FileClass an einem Ziel an. Body: {@code {"fileClassKey": "FOTO_URLAUB", "destination": "GALLERY"}}. */
	@PostMapping
	public ResponseEntity<FileClassDestinationAssignment> createFileClassDestinationAssignment(
			@RequestBody FileClassDestinationAssignment newAssignment) {
		String requestedFileClassKey = newAssignment.getFileClassKey();
		FileClassDestination requestedDestination = newAssignment.getDestination();
		FileClassDestinationAssignment createdAssignment = fileClassDestinationAssignmentService
				.createFileClassDestinationAssignment(requestedFileClassKey, requestedDestination);
		Long createdAssignmentId = createdAssignment.getId();
		String createdAssignmentPath = "/api/admin/file-class-destination-assignment/" + createdAssignmentId;
		URI createdAssignmentLocation = URI.create(createdAssignmentPath);
		return ResponseEntity.created(createdAssignmentLocation).body(createdAssignment);
	}

	/** READ: Eine Zuordnung über ihre {@code id}. */
	@GetMapping("/{id}")
	public ResponseEntity<FileClassDestinationAssignment> getFileClassDestinationAssignment(@PathVariable Long id) {
		FileClassDestinationAssignment foundAssignment = fileClassDestinationAssignmentService
				.getFileClassDestinationAssignment(id);
		return ResponseEntity.ok(foundAssignment);
	}

	/** DELETE: Nimmt die Zuordnung zurück. Im Body reicht {@code {"id": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteFileClassDestinationAssignment(
			@RequestBody FileClassDestinationAssignment assignmentToDelete) {
		Long id = assignmentToDelete.getId();
		fileClassDestinationAssignmentService.deleteFileClassDestinationAssignment(id);
		return ResponseEntity.noContent().build();
	}
}
