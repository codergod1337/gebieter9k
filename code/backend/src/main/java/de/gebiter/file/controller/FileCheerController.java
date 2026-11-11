package de.gebiter.file.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.dto.FileCheerDeleteRequest;
import de.gebiter.file.dto.FileCheerState;
import de.gebiter.file.dto.FileCheerUsersPage;
import de.gebiter.file.dto.FileCheerUsersResolveRequest;
import de.gebiter.file.dto.NewFileCheer;
import de.gebiter.file.model.FileCheerDirection;
import de.gebiter.file.service.FileCheerService;

/**
 * Die Stimmen zu Dateien (begeistert, angewidert) für jeden angemeldeten User (Pfad {@code /api/**}). Wer stimmen und
 * die Stimmen sehen darf, prüft der {@link FileCheerService}: jeder, der die Datei lesen darf. Jede Antwort ist der Stand
 * der Stimmen danach, die Seite braucht also nach einem Klick keine zweite Anfrage. Er nutzt nur Services, nie ein
 * Repository.
 * <p>
 * Doku: {@code docu/entities/FileCheer.md}.
 */
@RestController
@RequestMapping("/api/file-cheer")
public class FileCheerController {

	private final FileCheerService fileCheerService;

	public FileCheerController(FileCheerService fileCheerService) {
		this.fileCheerService = fileCheerService;
	}

	/**
	 * CREATE: Für eine Datei stimmen. Body: {@code {"fileDocumentId": "…", "direction": "UP"}} (oder {@code "DOWN"}). Hat
	 * der User schon gestimmt, ersetzt die neue Stimme die alte.
	 */
	@PostMapping
	public ResponseEntity<FileCheerState> createOwnFileCheer(@RequestBody NewFileCheer newFileCheer) {
		String fileDocumentId = newFileCheer.fileDocumentId();
		FileCheerDirection direction = newFileCheer.direction();
		FileCheerState fileCheerState = fileCheerService.createOwnFileCheer(fileDocumentId, direction);
		return ResponseEntity.ok(fileCheerState);
	}

	/** READ: Wer die Datei wie bewertet hat und wie der angemeldete User selbst gestimmt hat. 404 ohne lesbare Datei. */
	@GetMapping("/{fileDocumentId}")
	public ResponseEntity<FileCheerState> getFileCheerState(@PathVariable String fileDocumentId) {
		FileCheerState fileCheerState = fileCheerService.getFileCheerState(fileDocumentId);
		return ResponseEntity.ok(fileCheerState);
	}

	/**
	 * READ (Auflösen): Eine Seite der User, die in einer Richtung für die Datei gestimmt haben, der neueste zuerst. Body:
	 * {@code {"fileDocumentId": "…", "direction": "UP", "page": 0}}. Für „Alle laden“: Seite für Seite, bis alle da sind.
	 */
	@PostMapping("/users/resolve")
	public ResponseEntity<FileCheerUsersPage> resolveFileCheerUsersGuids(
			@RequestBody FileCheerUsersResolveRequest resolveRequest) {
		String fileDocumentId = resolveRequest.fileDocumentId();
		FileCheerDirection direction = resolveRequest.direction();
		int page = resolveRequest.page();
		FileCheerUsersPage fileCheerUsersPage = fileCheerService.resolveFileCheerUsersGuids(fileDocumentId, direction,
				page);
		return ResponseEntity.ok(fileCheerUsersPage);
	}

	/** DELETE: Die eigene Stimme zurücknehmen. Body: {@code {"fileDocumentId": "…"}}. */
	@DeleteMapping
	public ResponseEntity<FileCheerState> deleteOwnFileCheer(@RequestBody FileCheerDeleteRequest deleteRequest) {
		String fileDocumentId = deleteRequest.fileDocumentId();
		FileCheerState fileCheerState = fileCheerService.deleteOwnFileCheer(fileDocumentId);
		return ResponseEntity.ok(fileCheerState);
	}
}
