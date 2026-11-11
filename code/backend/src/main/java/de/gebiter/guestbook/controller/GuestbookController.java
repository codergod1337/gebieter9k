package de.gebiter.guestbook.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.guestbook.dto.GuestbookDeleteRequest;
import de.gebiter.guestbook.dto.GuestbookPage;
import de.gebiter.guestbook.dto.GuestbookResolveRequest;
import de.gebiter.guestbook.dto.NewGuestbook;
import de.gebiter.guestbook.model.Guestbook;
import de.gebiter.guestbook.service.GuestbookService;

/**
 * Die Gästebucheinträge für jeden angemeldeten User (AR USER oder ADMIN). Wer schreibt und löscht, kommt aus dem Token;
 * die Rechte prüft der {@link GuestbookService}. Kein PUT: Einträge werden nie geändert.
 * <p>
 * Doku: {@code docu/entities/Guestbook.md}.
 */
@RestController
@RequestMapping("/api/guestbook")
public class GuestbookController {

	private final GuestbookService guestbookService;

	public GuestbookController(GuestbookService guestbookService) {
		this.guestbookService = guestbookService;
	}

	/** CREATE: Einen Eintrag schreiben. Body: {@code {"profileUsersGuid": "…", "entryText": "…"}}. */
	@PostMapping
	public ResponseEntity<Guestbook> createOwnGuestbook(@RequestBody NewGuestbook newGuestbook) {
		UUID profileUsersGuid = newGuestbook.profileUsersGuid();
		Map<String, String> entryText = newGuestbook.entryText();
		Guestbook createdGuestbook = guestbookService.createOwnGuestbook(profileUsersGuid, entryText);
		return ResponseEntity.ok(createdGuestbook);
	}

	/** READ: Eine Seite des Gästebuchs eines Users. Body: {@code {"profileUsersGuid": "…", "page": 0}}. */
	@PostMapping("/resolve")
	public ResponseEntity<GuestbookPage> resolveGuestbookPage(@RequestBody GuestbookResolveRequest resolveRequest) {
		UUID profileUsersGuid = resolveRequest.profileUsersGuid();
		int page = resolveRequest.page();
		GuestbookPage guestbookPage = guestbookService.resolveGuestbookPage(profileUsersGuid, page);
		return ResponseEntity.ok(guestbookPage);
	}

	/** DELETE: Einen Eintrag löschen, als Autor oder Besitzer des Gästebuchs. Body: {@code {"id": 7}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnGuestbook(@RequestBody GuestbookDeleteRequest deleteRequest) {
		Long id = deleteRequest.id();
		guestbookService.deleteOwnGuestbook(id);
		return ResponseEntity.noContent().build();
	}
}
