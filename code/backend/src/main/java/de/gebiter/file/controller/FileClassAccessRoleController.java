package de.gebiter.file.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileClassAccessRole;
import de.gebiter.file.service.FileClassAccessRoleService;

/**
 * Endpunkte der Klasse {@link FileClassAccessRole} für jeden angemeldeten User: nur die Liste. Das Frontend bietet beim
 * Upload damit nur die FileClasses an, die der User hochladen darf. Die Verwaltung steht im
 * {@link FileClassAccessRoleAdminController}.
 * <p>
 * Doku: {@code docu/entities/FileClassAccessRole.md}.
 */
@RestController
@RequestMapping("/api/file-class-access-role")
public class FileClassAccessRoleController {

	private final FileClassAccessRoleService fileClassAccessRoleService;

	public FileClassAccessRoleController(FileClassAccessRoleService fileClassAccessRoleService) {
		this.fileClassAccessRoleService = fileClassAccessRoleService;
	}

	/** READ: Alle Einträge aller FileClasses. */
	@GetMapping
	public ResponseEntity<List<FileClassAccessRole>> getAllFileClassAccessRole() {
		List<FileClassAccessRole> allFileClassAccessRole = fileClassAccessRoleService.getAllFileClassAccessRole();
		return ResponseEntity.ok(allFileClassAccessRole);
	}
}
