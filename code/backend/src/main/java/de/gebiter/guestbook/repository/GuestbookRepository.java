package de.gebiter.guestbook.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.guestbook.model.Guestbook;

/** Datenzugriff auf {@link Guestbook}. Genutzt wird es ausschließlich vom {@link de.gebiter.guestbook.service.GuestbookService}. */
public interface GuestbookRepository extends JpaRepository<Guestbook, Long> {

	/** Eine Seite des Gästebuchs eines Users, die neuesten Einträge zuerst. */
	Page<Guestbook> findByProfileUsersGuidOrderByWrittenAtDescIdDesc(UUID profileUsersGuid, Pageable pageable);
}
