package de.gebiter.guestbook.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.guestbook.dto.GuestbookCommentDeleteRequest;
import de.gebiter.guestbook.dto.GuestbookDeleteRequest;
import de.gebiter.guestbook.service.GuestbookService;

/**
 * Das Gästebuch für den Admin (Pfad {@code /api/admin/**}, nur ADMIN): Einträge und Kommentare in jedem Gästebuch löschen.
 * <p>
 * Doku: {@code docu/entities/Guestbook.md}, {@code docu/entities/GuestbookComment.md}.
 */
@RestController
@RequestMapping("/api/admin/guestbook")
public class GuestbookAdminController {

	private final GuestbookService guestbookService;

	public GuestbookAdminController(GuestbookService guestbookService) {
		this.guestbookService = guestbookService;
	}

	/** DELETE: Einen Eintrag samt Kommentaren und Smileys löschen. Body: {@code {"id": 7}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteGuestbook(@RequestBody GuestbookDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		guestbookService.deleteGuestbook(id);
		return ResponseEntity.noContent().build();
	}

	/** DELETE: Einen Kommentar samt Smileys löschen. Body: {@code {"id": 12}}. */
	@DeleteMapping("/comment")
	public ResponseEntity<Void> deleteGuestbookComment(@RequestBody GuestbookCommentDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		guestbookService.deleteGuestbookComment(id);
		return ResponseEntity.noContent().build();
	}
}
