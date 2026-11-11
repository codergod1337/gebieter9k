package de.gebiter.guestbook.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.guestbook.model.GuestbookComment;
import de.gebiter.guestbook.repository.GuestbookCommentRepository;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link GuestbookComment}. Er nutzt nur sein eigenes {@link GuestbookCommentRepository} und prüft
 * keine Rechte: Das tut der {@link GuestbookService}, der ihn als einziger ruft, bevor er etwas anlegt oder löscht.
 */
@Service
public class GuestbookCommentService {

	private final GuestbookCommentRepository guestbookCommentRepository;

	public GuestbookCommentService(GuestbookCommentRepository guestbookCommentRepository) {
		this.guestbookCommentRepository = guestbookCommentRepository;
	}

	/** CREATE: Ein Kommentar unter einem Eintrag, Rechte und Text hat der {@link GuestbookService} schon geprüft. */
	@Transactional
	public GuestbookComment createGuestbookComment(Long guestbookId, UUID authorUsersGuid, Map<String, String> commentText) {
		GuestbookComment newGuestbookComment = new GuestbookComment(guestbookId, authorUsersGuid, commentText);
		return guestbookCommentRepository.save(newGuestbookComment);
	}

	/**
	 * READ: Ein Kommentar über seine id.
	 *
	 * @throws EntityNotFoundException wenn es ihn nicht gibt
	 */
	@Transactional(readOnly = true)
	public GuestbookComment getGuestbookComment(Long id) {
		Optional<GuestbookComment> foundGuestbookComment = guestbookCommentRepository.findById(id);
		if (foundGuestbookComment.isEmpty()) {
			throw new EntityNotFoundException("Den Kommentar gibt es nicht.");
		}
		return foundGuestbookComment.get();
	}

	/** READ: Die Kommentare mehrerer Einträge, je Eintrag als Verlauf, die ältesten zuerst. */
	@Transactional(readOnly = true)
	public List<GuestbookComment> getGuestbookCommentByGuestbookIds(Collection<Long> guestbookIds) {
		if (guestbookIds.isEmpty()) {
			return List.of();
		}
		return guestbookCommentRepository.findByGuestbookIdInOrderByWrittenAtAscIdAsc(guestbookIds);
	}

	/** DELETE: Ein Kommentar, seine Smileys hat der {@link GuestbookService} schon gelöscht. */
	@Transactional
	public void deleteGuestbookComment(Long id) {
		guestbookCommentRepository.deleteById(id);
	}

	/** DELETE: Alle Kommentare eines Eintrags. */
	@Transactional
	public void deleteGuestbookCommentByGuestbookId(Long guestbookId) {
		guestbookCommentRepository.deleteByGuestbookId(guestbookId);
	}
}
