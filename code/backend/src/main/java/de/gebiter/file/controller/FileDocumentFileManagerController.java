package de.gebiter.file.controller;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.dto.FileDocumentChangeRequest;
import de.gebiter.status.model.Visibility;
import de.gebiter.file.dto.FileDocumentVisibilityChangeRequest;
import de.gebiter.file.dto.FileUploadResult;
import de.gebiter.file.model.FileUploadStatus;
import de.gebiter.file.service.FileDocumentWriteService;
import de.gebiter.file.service.FileUploadService;
import de.gebiter.util.Helper;
import jakarta.servlet.http.HttpServletRequest;

/**
 * File-Manager-Endpunkte der Dateien: hochladen ohne Ziel und jede Datei verwalten, nicht nur die eigenen. Pfad
 * {@code /api/file-manager/**}, in der {@code SecurityConfig} nur mit der AR FILE_MANAGER oder ADMIN. Der File-Manager
 * ist kein Admin: Löschen (weich und endgültig) steht nur im {@link FileDocumentAdminController}, weich dazu für den
 * Autor. Er nutzt nur Services, nie ein Repository.
 * <p>
 * Doku: {@code docu/solr-cores/FILE.md}; die Upload-Wege im Überblick: {@code docu/konzept-file-kern.md}, „Upload-Wege“.
 */
@RestController
@RequestMapping("/api/file-manager/file-document")
public class FileDocumentFileManagerController {

	private final FileUploadService fileUploadService;

	private final FileDocumentWriteService fileDocumentWriteService;

	public FileDocumentFileManagerController(FileUploadService fileUploadService,
			FileDocumentWriteService fileDocumentWriteService) {
		this.fileUploadService = fileUploadService;
		this.fileDocumentWriteService = fileDocumentWriteService;
	}

	/**
	 * CREATE: Lädt eine Datei hoch, der Upload-Weg des File-Managers: ohne Ziel, in jede FileClass, an der der User eine
	 * Schreibrolle hat. Ein normaler User erreicht ihn nicht; er lädt nur über ein Ziel hoch, z. B. in seine Galerie
	 * ({@code POST /api/gallery/upload}), wo nur die dafür freigegebenen FileClasses gelten.
	 * <p>
	 * Multipart in fester Reihenfolge: zuerst {@code data}, ein JSON-Objekt mit den Feldern unter ihrem Solr-Namen,
	 * mindestens {@code fileClassKey}, mehrwertige als Liste, z. B. {@code {"fileClassKey": "DOKUMENT",
	 * "fileDescription": "Handbuch", "tags": ["anleitung"], "wtf": ["TEST_DATA"]}}, danach {@code file}, die Datei. Der
	 * Body geht als Strom an den Service: Spring legt ihn nicht erst ab (Multipart ist in der YAML aus). Antwort 201 mit
	 * CREATED oder 200 mit EXISTS (dieselbe Datei gibt es schon, gespeichert wurde nichts).
	 */
	@PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<FileUploadResult> uploadFile(HttpServletRequest request) throws IOException {
		InputStream requestBody = request.getInputStream();
		String contentType = request.getContentType();
		long requestContentLength = request.getContentLengthLong();
		FileUploadResult fileUploadResult = fileUploadService.uploadFile(requestBody, contentType,
				requestContentLength);
		boolean created = fileUploadResult.status() == FileUploadStatus.CREATED;
		HttpStatus responseStatus = HttpStatus.OK;
		if (created) {
			responseStatus = HttpStatus.CREATED;
		}
		return ResponseEntity.status(responseStatus).body(fileUploadResult);
	}

	/**
	 * UPDATE: Ändert die Metadaten JEDER aktiven Datei. Body: {@code {"id": "…", "fieldValuesByFieldName": {"fileDescription": "…"}}};
	 * ein leerer Wert nimmt das Feld heraus.
	 */
	@PutMapping
	public ResponseEntity<Map<String, Object>> changeFileDocument(@RequestBody FileDocumentChangeRequest changeRequest) {
		String id = changeRequest.id();
		Helper.requireSha256Hex(id);
		Map<String, Object> rawClientFieldValues = changeRequest.fieldValuesByFieldName();
		if (rawClientFieldValues == null) {
			rawClientFieldValues = Map.of();
		}
		Map<String, Object> changedDocument = fileDocumentWriteService.changeFileDocument(id, rawClientFieldValues);
		return ResponseEntity.ok(changedDocument);
	}

	/** UPDATE: Ändert die Sichtbarkeit JEDER aktiven Datei. Body: {@code {"id": "…", "visibility": "FRIENDS"}}. */
	@PutMapping("/visibility")
	public ResponseEntity<Map<String, Object>> changeFileDocumentVisibility(
			@RequestBody FileDocumentVisibilityChangeRequest changeRequest) {
		String id = changeRequest.id();
		Helper.requireSha256Hex(id);
		Visibility visibility = changeRequest.visibility();
		Map<String, Object> changedDocument = fileDocumentWriteService.changeFileDocumentVisibility(id, visibility);
		return ResponseEntity.ok(changedDocument);
	}
}
