package de.gebiter.guestbook.service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.guestbook.model.GuestbookReaction;
import de.gebiter.guestbook.repository.GuestbookReactionRepository;

/**
 * Service der Klasse {@link GuestbookReaction}, der Smileys. Er nutzt nur sein eigenes
 * {@link GuestbookReactionRepository} und prüft keine Rechte: Das tut der {@link GuestbookService}, der ihn als einziger
 * ruft. Es gibt kein Zurücknehmen; gelöscht werden Smileys nur mit ihrem Eintrag bzw. Kommentar.
 */
@Service
public class GuestbookReactionService {

	private final GuestbookReactionRepository guestbookReactionRepository;

	public GuestbookReactionService(GuestbookReactionRepository guestbookReactionRepository) {
		this.guestbookReactionRepository = guestbookReactionRepository;
	}

	/**
	 * CREATE: Ein Smiley an einen Eintrag ({@code guestbookCommentId} {@code null}) oder einen Kommentar. Hat der User
	 * dasselbe Emoji schon an dasselbe Ziel gehängt, passiert nichts: je Ziel jedes Emoji einmal.
	 */
	@Transactional
	public void createGuestbookReaction(Long guestbookId, Long guestbookCommentId, UUID usersGuid, String reactionEmoji) {
		boolean alreadyReacted;
		if (guestbookCommentId == null) {
			alreadyReacted = guestbookReactionRepository
					.existsByGuestbookIdAndGuestbookCommentIdIsNullAndUsersGuidAndReactionEmoji(guestbookId, usersGuid,
							reactionEmoji);
		} else {
			alreadyReacted = guestbookReactionRepository.existsByGuestbookCommentIdAndUsersGuidAndReactionEmoji(
					guestbookCommentId, usersGuid, reactionEmoji);
		}
		if (alreadyReacted) {
			return;
		}
		GuestbookReaction newGuestbookReaction = new GuestbookReaction(guestbookId, guestbookCommentId, usersGuid,
				reactionEmoji);
		guestbookReactionRepository.save(newGuestbookReaction);
	}

	/** READ: Alle Smileys mehrerer Einträge samt ihrer Kommentare, in der Reihenfolge, in der sie kamen. */
	@Transactional(readOnly = true)
	public List<GuestbookReaction> getGuestbookReactionByGuestbookIds(Collection<Long> guestbookIds) {
		if (guestbookIds.isEmpty()) {
			return List.of();
		}
		return guestbookReactionRepository.findByGuestbookIdInOrderByReactedAtAscIdAsc(guestbookIds);
	}

	/** DELETE: Alle Smileys eines Eintrags samt denen seiner Kommentare. */
	@Transactional
	public void deleteGuestbookReactionByGuestbookId(Long guestbookId) {
		guestbookReactionRepository.deleteByGuestbookId(guestbookId);
	}

	/** DELETE: Alle Smileys eines Kommentars. */
	@Transactional
	public void deleteGuestbookReactionByGuestbookCommentId(Long guestbookCommentId) {
		guestbookReactionRepository.deleteByGuestbookCommentId(guestbookCommentId);
	}
}
