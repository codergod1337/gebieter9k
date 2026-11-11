package de.gebiter.guestbook.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Ein Eintrag, wie die Darstellung ihn braucht: mit seinen Smileys, seinem Kommentar-Verlauf (die ältesten zuerst) und
 * ob der angemeldete User ihn löschen darf.
 */
public record GuestbookEntryForClient(Long id, UUID authorUsersGuid, Map<String, String> entryText, OffsetDateTime writtenAt,
		List<GuestbookReactionCount> reactionCounts, List<GuestbookCommentForClient> comments,
		boolean deletableByCurrentUsers) {
}
