package de.gebiter.guestbook.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.guestbook.model.GuestbookReaction;

/**
 * Datenzugriff auf {@link GuestbookReaction}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.guestbook.service.GuestbookReactionService}.
 */
public interface GuestbookReactionRepository extends JpaRepository<GuestbookReaction, Long> {

	/** Alle Smileys mehrerer Einträge samt ihrer Kommentare, in der Reihenfolge, in der sie kamen. */
	List<GuestbookReaction> findByGuestbookIdInOrderByReactedAtAscIdAsc(Collection<Long> guestbookIds);

	/** Hat der User dieses Emoji schon an den Eintrag selbst gehängt? */
	boolean existsByGuestbookIdAndGuestbookCommentIdIsNullAndUsersGuidAndReactionEmoji(Long guestbookId, UUID usersGuid,
			String reactionEmoji);

	/** Hat der User dieses Emoji schon an den Kommentar gehängt? */
	boolean existsByGuestbookCommentIdAndUsersGuidAndReactionEmoji(Long guestbookCommentId, UUID usersGuid,
			String reactionEmoji);

	/** Löscht alle Smileys eines Eintrags samt denen seiner Kommentare. */
	void deleteByGuestbookId(Long guestbookId);

	/** Löscht alle Smileys eines Kommentars. */
	void deleteByGuestbookCommentId(Long guestbookCommentId);
}
