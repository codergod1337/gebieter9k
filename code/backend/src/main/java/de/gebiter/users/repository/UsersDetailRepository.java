package de.gebiter.users.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.users.model.UsersDetail;

/**
 * Datenzugriff auf {@link UsersDetail}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.users.service.UsersDetailService}.
 */
public interface UsersDetailRepository extends JpaRepository<UsersDetail, UUID> {

	/**
	 * Zählt die Uploads des Users um eins hoch, als EIN atomares UPDATE in der Datenbank: Zwei gleichzeitige Uploads
	 * überschreiben sich so nicht gegenseitig. Liefert die Zahl der geänderten Zeilen (0, wenn es den Eintrag nicht gibt).
	 */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update UsersDetail usersDetail set usersDetail.uploadCount = usersDetail.uploadCount + 1 "
			+ "where usersDetail.usersGuid = :usersGuid")
	int increaseUploadCount(@Param("usersGuid") UUID usersGuid);

	/** Zählt die geschriebenen Gästebucheinträge des Users um eins hoch, als EIN atomares UPDATE. */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update UsersDetail usersDetail set usersDetail.writtenGuestbookEntryCount = "
			+ "usersDetail.writtenGuestbookEntryCount + 1 where usersDetail.usersGuid = :usersGuid")
	int increaseWrittenGuestbookEntryCount(@Param("usersGuid") UUID usersGuid);
}
