package de.gebiter.guestbook.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.guestbook.model.GuestbookComment;

/**
 * Datenzugriff auf {@link GuestbookComment}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.guestbook.service.GuestbookCommentService}.
 */
public interface GuestbookCommentRepository extends JpaRepository<GuestbookComment, Long> {

	/** Die Kommentare mehrerer Einträge, je Eintrag als Verlauf: die ältesten zuerst. */
	List<GuestbookComment> findByGuestbookIdInOrderByWrittenAtAscIdAsc(Collection<Long> guestbookIds);

	/** Löscht alle Kommentare eines Eintrags. */
	void deleteByGuestbookId(Long guestbookId);
}
