package de.gebiter.file.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.file.model.FileCheer;
import de.gebiter.file.model.FileCheerDirection;

/**
 * Datenzugriff auf {@link FileCheer}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.file.service.FileCheerService}.
 */
public interface FileCheerRepository extends JpaRepository<FileCheer, Long> {

	/**
	 * Eine Seite der Stimmen einer Richtung zu einer Datei, die neueste zuerst: Wer zuletzt gestimmt hat, steht vorn.
	 * Nie alle Stimmen auf einmal: Eine Datei kann Tausende haben. Die erste Seite in passender Größe sind „die
	 * neuesten“ für die Anzeige.
	 */
	List<FileCheer> findByFileDocumentIdAndDirectionOrderByCheeredAtDescIdDesc(String fileDocumentId,
			FileCheerDirection direction, Pageable pageable);

	/** Die Stimme eines Users zu einer Datei, wenn er gestimmt hat. */
	Optional<FileCheer> findByFileDocumentIdAndUsersGuid(String fileDocumentId, UUID usersGuid);

	/** Wie viele Stimmen einer Richtung hat die Datei? Für die Anzeige und die Zähler im Solr-Dokument. */
	long countByFileDocumentIdAndDirection(String fileDocumentId, FileCheerDirection direction);

	/**
	 * Löscht alle Stimmen zu einer Datei, wenn sie endgültig gelöscht wird: eine Anweisung für alle Zeilen, eine Datei
	 * kann Tausende Stimmen haben. Liefert, wie viele es waren.
	 */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from FileCheer fileCheer where fileCheer.fileDocumentId = :fileDocumentId")
	int deleteAllByFileDocumentId(@Param("fileDocumentId") String fileDocumentId);
}
