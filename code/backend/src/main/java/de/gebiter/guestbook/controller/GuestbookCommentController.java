package de.gebiter.guestbook.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.guestbook.dto.GuestbookCommentDeleteRequest;
import de.gebiter.guestbook.dto.NewGuestbookComment;
import de.gebiter.guestbook.model.GuestbookComment;
import de.gebiter.guestbook.service.GuestbookService;

/**
 * Die Kommentare unter Gästebucheinträgen für jeden angemeldeten User. Die Rechte prüft der {@link GuestbookService},
 * die eine Stelle für alle Rechte des Gästebuchs. Kein PUT: Kommentare werden nie geändert.
 * <p>
 * Doku: {@code docu/entities/GuestbookComment.md}.
 */
@RestController
@RequestMapping("/api/guestbook-comment")
public class GuestbookCommentController {

	private final GuestbookService guestbookService;

	public GuestbookCommentController(GuestbookService guestbookService) {
		this.guestbookService = guestbookService;
	}

	/** CREATE: Einen Kommentar schreiben. Body: {@code {"guestbookId": 7, "commentText": "…"}}. */
	@PostMapping
	public ResponseEntity<GuestbookComment> createOwnGuestbookComment(@RequestBody NewGuestbookComment newGuestbookComment) {
		Long guestbookId = newGuestbookComment.guestbookId();
		Map<String, String> commentText = newGuestbookComment.commentText();
		GuestbookComment createdGuestbookComment = guestbookService.createOwnGuestbookComment(guestbookId, commentText);
		return ResponseEntity.ok(createdGuestbookComment);
	}

	/** DELETE: Einen Kommentar löschen, als Autor oder Besitzer des Gästebuchs. Body: {@code {"id": 12}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnGuestbookComment(@RequestBody GuestbookCommentDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		guestbookService.deleteOwnGuestbookComment(id);
		return ResponseEntity.noContent().build();
	}
}
