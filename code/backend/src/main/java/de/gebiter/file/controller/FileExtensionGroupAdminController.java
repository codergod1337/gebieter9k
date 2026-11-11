package de.gebiter.file.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.model.FileExtensionGroup;
import de.gebiter.file.service.FileExtensionGroupService;
import de.gebiter.util.Helper;
import de.gebiter.util.dto.ListingOrder;

/**
 * Admin-Endpunkte der Klasse {@link FileExtensionGroup}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur
 * den {@link FileExtensionGroupService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/FileExtensionGroup.md}.
 */
@RestController
@RequestMapping("/api/admin/file-extension-group")
public class FileExtensionGroupAdminController {

	private final FileExtensionGroupService fileExtensionGroupService;

	public FileExtensionGroupAdminController(FileExtensionGroupService fileExtensionGroupService) {
		this.fileExtensionGroupService = fileExtensionGroupService;
	}

	/** CREATE: Legt eine Gruppe an. Body: {@code {"key": "BILD", "displayName": {"de": "Bilder"}}}. */
	@PostMapping
	public ResponseEntity<FileExtensionGroup> createFileExtensionGroup(
			@RequestBody FileExtensionGroup newFileExtensionGroup) {
		String requestedFileExtensionGroupKey = newFileExtensionGroup.getKey();
		Map<String, String> requestedDisplayName = newFileExtensionGroup.getDisplayName();

		FileExtensionGroup createdFileExtensionGroup = fileExtensionGroupService
				.createFileExtensionGroup(requestedFileExtensionGroupKey, requestedDisplayName);

		String createdFileExtensionGroupKey = createdFileExtensionGroup.getKey();
		String createdFileExtensionGroupPath = "/api/admin/file-extension-group/" + createdFileExtensionGroupKey;
		URI createdFileExtensionGroupLocation = URI.create(createdFileExtensionGroupPath);
		return ResponseEntity.created(createdFileExtensionGroupLocation).body(createdFileExtensionGroup);
	}

	/** READ: Eine Gruppe. Der Key wird zuerst geprüft, nie ein Text mit Sonderzeichen im Pfad. */
	@GetMapping("/{fileExtensionGroupKey}")
	public ResponseEntity<FileExtensionGroup> getFileExtensionGroup(@PathVariable String fileExtensionGroupKey) {
		Helper.requireValidKey(fileExtensionGroupKey);
		FileExtensionGroup foundFileExtensionGroup = fileExtensionGroupService
				.getFileExtensionGroup(fileExtensionGroupKey);
		return ResponseEntity.ok(foundFileExtensionGroup);
	}

	/** UPDATE: Ändert eine Gruppe. Body: das volle Objekt, maßgeblich ist {@code key}, geändert wird {@code displayName}. */
	@PutMapping
	public ResponseEntity<FileExtensionGroup> changeFileExtensionGroup(
			@RequestBody FileExtensionGroup changedFileExtensionGroup) {
		FileExtensionGroup savedFileExtensionGroup = fileExtensionGroupService
				.changeFileExtensionGroup(changedFileExtensionGroup);
		return ResponseEntity.ok(savedFileExtensionGroup);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop. Body: {@code {"keysInOrder": ["BILD", "VIDEO"]}}, jeder Key genau
	 * einmal. Zurück kommen alle Gruppen in neuer Reihenfolge.
	 */
	@PutMapping("/listing-position")
	public ResponseEntity<List<FileExtensionGroup>> changeFileExtensionGroupListingPositions(
			@RequestBody ListingOrder listingOrder) {
		List<String> fileExtensionGroupKeysInOrder = listingOrder.keysInOrder();
		List<FileExtensionGroup> allFileExtensionGroups = fileExtensionGroupService
				.changeFileExtensionGroupListingPositions(fileExtensionGroupKeysInOrder);
		return ResponseEntity.ok(allFileExtensionGroups);
	}

	/** DELETE: Löscht eine Gruppe, ihre Endungen stehen danach ohne Gruppe. Im Body reicht {@code {"key": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteFileExtensionGroup(@RequestBody FileExtensionGroup fileExtensionGroupToDelete) {
		String fileExtensionGroupKey = fileExtensionGroupToDelete.getKey();
		fileExtensionGroupService.deleteFileExtensionGroup(fileExtensionGroupKey);
		return ResponseEntity.noContent().build();
	}
}
