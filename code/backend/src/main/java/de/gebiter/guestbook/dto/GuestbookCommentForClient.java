package de.gebiter.guestbook.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Ein Kommentar, wie die Darstellung ihn braucht: mit seinen Smileys und ob der angemeldete User ihn löschen darf. */
public record GuestbookCommentForClient(Long id, UUID authorUsersGuid, Map<String, String> commentText, OffsetDateTime writtenAt,
		List<GuestbookReactionCount> reactionCounts, boolean deletableByCurrentUsers) {
}
