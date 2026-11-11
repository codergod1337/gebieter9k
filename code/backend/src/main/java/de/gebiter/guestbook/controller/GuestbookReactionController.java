package de.gebiter.guestbook.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.guestbook.dto.NewGuestbookReaction;
import de.gebiter.guestbook.service.GuestbookService;

/**
 * Die Smileys an Gästebucheinträgen und Kommentaren für jeden angemeldeten User. Nur Anlegen: Smileys gehen in eine
 * Richtung und verschwinden nur mit ihrem Eintrag bzw. Kommentar. Die Rechte prüft der {@link GuestbookService}.
 * <p>
 * Doku: {@code docu/entities/GuestbookReaction.md}.
 */
@RestController
@RequestMapping("/api/guestbook-reaction")
public class GuestbookReactionController {

	private final GuestbookService guestbookService;

	public GuestbookReactionController(GuestbookService guestbookService) {
		this.guestbookService = guestbookService;
	}

	/**
	 * CREATE: Einen Smiley vergeben. Body: {@code {"guestbookId": 7, "guestbookCommentId": null, "reactionEmoji": "😂"}};
	 * mit {@code guestbookCommentId} an einen Kommentar statt an den Eintrag.
	 */
	@PostMapping
	public ResponseEntity<Void> createOwnGuestbookReaction(@RequestBody NewGuestbookReaction newGuestbookReaction) {
		Long guestbookId = newGuestbookReaction.guestbookId();
		Long guestbookCommentId = newGuestbookReaction.guestbookCommentId();
		String reactionEmoji = newGuestbookReaction.reactionEmoji();
		guestbookService.createOwnGuestbookReaction(guestbookId, guestbookCommentId, reactionEmoji);
		return ResponseEntity.noContent().build();
	}
}
