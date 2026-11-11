package de.gebiter.file.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileClassAccessRole;
import de.gebiter.file.service.FileClassAccessRoleService;

/**
 * Admin-Endpunkte der Klasse {@link FileClassAccessRole}: welches Recht an einer FileClass lesen, bearbeiten und hochladen
 * darf, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den {@link FileClassAccessRoleService}, nie ein Repository.
 * Genutzt von der Matrix „FileClass × AR“.
 * <p>
 * Doku: {@code docu/entities/FileClassAccessRole.md}.
 */
@RestController
@RequestMapping("/api/admin/file-class-access-role")
public class FileClassAccessRoleAdminController {

	private final FileClassAccessRoleService fileClassAccessRoleService;

	public FileClassAccessRoleAdminController(FileClassAccessRoleService fileClassAccessRoleService) {
		this.fileClassAccessRoleService = fileClassAccessRoleService;
	}

	/**
	 * CREATE: Gibt einem Recht Zugriff auf eine FileClass. Body: {@code {"fileClassKey": "MEME", "accessRoleKey": "USER",
	 * "readGranted": true, "editGranted": false, "uploadGranted": true}}. Ein fehlender Schalter gilt als aus.
	 */
	@PostMapping
	public ResponseEntity<FileClassAccessRole> createFileClassAccessRole(
			@RequestBody FileClassAccessRole newFileClassAccessRole) {
		String requestedFileClassKey = newFileClassAccessRole.getFileClassKey();
		String requestedAccessRoleKey = newFileClassAccessRole.getAccessRoleKey();
		boolean requestedReadGranted = newFileClassAccessRole.isReadGranted();
		boolean requestedEditGranted = newFileClassAccessRole.isEditGranted();
		boolean requestedUploadGranted = newFileClassAccessRole.isUploadGranted();

		FileClassAccessRole createdFileClassAccessRole = fileClassAccessRoleService.createFileClassAccessRole(
				requestedFileClassKey, requestedAccessRoleKey, requestedReadGranted, requestedEditGranted,
				requestedUploadGranted);

		Long createdFileClassAccessRoleId = createdFileClassAccessRole.getId();
		String createdFileClassAccessRolePath = "/api/admin/file-class-access-role/" + createdFileClassAccessRoleId;
		URI createdFileClassAccessRoleLocation = URI.create(createdFileClassAccessRolePath);
		return ResponseEntity.created(createdFileClassAccessRoleLocation).body(createdFileClassAccessRole);
	}

	/** READ: Ein Eintrag über seine {@code id}. */
	@GetMapping("/{id}")
	public ResponseEntity<FileClassAccessRole> getFileClassAccessRole(@PathVariable Long id) {
		FileClassAccessRole foundFileClassAccessRole = fileClassAccessRoleService.getFileClassAccessRole(id);
		return ResponseEntity.ok(foundFileClassAccessRole);
	}

	/**
	 * UPDATE: Setzt die drei Schalter neu. Body: {@code {"id": 5, "readGranted": true, "editGranted": false,
	 * "uploadGranted": true}}.
	 */
	@PutMapping
	public ResponseEntity<FileClassAccessRole> changeFileClassAccessRole(
			@RequestBody FileClassAccessRole changedFileClassAccessRole) {
		FileClassAccessRole savedFileClassAccessRole = fileClassAccessRoleService
				.changeFileClassAccessRole(changedFileClassAccessRole);
		return ResponseEntity.ok(savedFileClassAccessRole);
	}

	/** DELETE: Nimmt dem Recht den Zugriff auf die FileClass. Im Body reicht {@code {"id": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteFileClassAccessRole(@RequestBody FileClassAccessRole fileClassAccessRoleToDelete) {
		Long id = fileClassAccessRoleToDelete.getId();
		fileClassAccessRoleService.deleteFileClassAccessRole(id);
		return ResponseEntity.noContent().build();
	}
}
