package de.gebiter.guestbook.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Eine Seite eines Gästebuchs, alles, was die Darstellung braucht, in einer Antwort: die Einträge (die neuesten
 * zuerst) samt Kommentaren und Smileys, dazu einmal je vorkommendem Autor Username und Profilbild. So steht jedes
 * Profilbild nur einmal in der Antwort.
 */
public record GuestbookPage(UUID profileUsersGuid, List<GuestbookEntryForClient> entries,
		Map<UUID, GuestbookAuthor> authorsByUsersGuid, long totalCount, int page, int pageSize) {
}
