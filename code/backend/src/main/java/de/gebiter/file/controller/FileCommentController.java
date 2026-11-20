package de.gebiter.file.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.dto.FileCommentCount;
import de.gebiter.file.dto.FileCommentDeleteRequest;
import de.gebiter.file.dto.FileCommentThread;
import de.gebiter.file.dto.NewFileComment;
import de.gebiter.file.service.FileCommentService;

/**
 * Die Kommentare zu Dateien für jeden angemeldeten User (Pfad {@code /api/**}). Wer kommentieren, lesen und löschen
 * darf, prüft der {@link FileCommentService}: kommentieren und lesen jeder, der die Datei lesen darf; löschen der
 * Autor des Kommentars und der Autor der Datei. Anlegen und Löschen antworten mit dem Verlauf danach, die Seite braucht
 * also keine zweite Anfrage. Er nutzt nur Services, nie ein Repository.
 * <p>
 * Ein Besucher ohne Anmeldung liest die Kommentare über den Link einer Galerie-Freigabe
 * ({@code GalleryShareShareController}).
 * <p>
 * Doku: {@code docu/entities/FileComment.md}.
 */
@RestController
@RequestMapping("/api/file-comment")
public class FileCommentController {

	private final FileCommentService fileCommentService;

	public FileCommentController(FileCommentService fileCommentService) {
		this.fileCommentService = fileCommentService;
	}

	/**
	 * CREATE: Eine Datei kommentieren. Body: {@code {"fileDocumentId": "…", "commentText": {"de": "<p>Wahnsinn!</p>"}}}.
	 * Die Antwort ist der Verlauf der Kommentare danach.
	 */
	@PostMapping
	public ResponseEntity<FileCommentThread> createOwnFileComment(@RequestBody NewFileComment newFileComment) {
		String fileDocumentId = newFileComment.fileDocumentId();
		Map<String, String> commentText = newFileComment.commentText();
		FileCommentThread fileCommentThread = fileCommentService.createOwnFileComment(fileDocumentId, commentText);
		return ResponseEntity.ok(fileCommentThread);
	}

	/** READ: Der Verlauf der Kommentare einer Datei, die ältesten zuerst, mit ihren Autoren. 404 ohne lesbare Datei. */
	@GetMapping("/{fileDocumentId}")
	public ResponseEntity<FileCommentThread> getFileCommentThread(@PathVariable String fileDocumentId) {
		FileCommentThread fileCommentThread = fileCommentService.getFileCommentThread(fileDocumentId);
		return ResponseEntity.ok(fileCommentThread);
	}

	/** READ: Wie viele Kommentare eine Datei hat, für die Sprechblase an ihrer Kachel. 404 ohne lesbare Datei. */
	@GetMapping("/count/{fileDocumentId}")
	public ResponseEntity<FileCommentCount> getFileCommentCount(@PathVariable String fileDocumentId) {
		FileCommentCount fileCommentCount = fileCommentService.getFileCommentCount(fileDocumentId);
		return ResponseEntity.ok(fileCommentCount);
	}

	/**
	 * DELETE: Einen Kommentar löschen, als sein Autor oder als Autor der Datei. Body: {@code {"id": 12}}. Die Antwort ist
	 * der Verlauf der Kommentare danach.
	 */
	@DeleteMapping
	public ResponseEntity<FileCommentThread> deleteOwnFileComment(@RequestBody FileCommentDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		FileCommentThread fileCommentThread = fileCommentService.deleteOwnFileComment(id);
		return ResponseEntity.ok(fileCommentThread);
	}
}
