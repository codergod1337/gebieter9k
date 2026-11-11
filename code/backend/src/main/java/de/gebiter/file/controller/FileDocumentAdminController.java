package de.gebiter.file.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.dto.FileDocumentIdRequest;
import de.gebiter.file.service.FileDocumentWriteService;
import de.gebiter.util.Helper;

/**
 * Admin-Endpunkte der Dateien, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur Services, nie ein
 * Repository.
 * <p>
 * Doku: {@code docu/solr-cores/FILE.md}.
 */
@RestController
@RequestMapping("/api/admin/file-document")
public class FileDocumentAdminController {

	private final FileDocumentWriteService fileDocumentWriteService;

	public FileDocumentAdminController(FileDocumentWriteService fileDocumentWriteService) {
		this.fileDocumentWriteService = fileDocumentWriteService;
	}

	/**
	 * DELETE (weich): Setzt JEDE aktive Datei auf DELETED. Body: {@code {"id": "…"}}. Weich löschen dürfen nur der Autor
	 * (über {@code /api/file-document}) und der Admin (Nutzer 2026-11-09).
	 */
	@DeleteMapping
	public ResponseEntity<Void> deleteFileDocument(@RequestBody FileDocumentIdRequest idRequest) {
		String id = idRequest.id();
		Helper.requireSha256Hex(id);
		fileDocumentWriteService.deleteFileDocument(id);
		return ResponseEntity.noContent().build();
	}

	/**
	 * DELETE (endgültig): Löscht eine weich gelöschte Datei aus Solr und vom SFTP. Body: {@code {"id": "…"}}. Eine aktive
	 * Datei muss vorher weich gelöscht werden.
	 */
	@DeleteMapping("/finally")
	public ResponseEntity<Void> deleteFileDocumentFinally(@RequestBody FileDocumentIdRequest idRequest) {
		String id = idRequest.id();
		Helper.requireSha256Hex(id);
		fileDocumentWriteService.deleteFileDocumentFinally(id);
		return ResponseEntity.noContent().build();
	}
}
