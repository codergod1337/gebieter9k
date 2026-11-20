package de.gebiter.file.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.file.dto.FileCommentCount;
import de.gebiter.file.model.FileComment;

/**
 * Datenzugriff auf {@link FileComment}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.file.service.FileCommentService}.
 */
public interface FileCommentRepository extends JpaRepository<FileComment, Long> {

	/** Die Kommentare einer Datei als Verlauf, die ältesten zuerst. */
	List<FileComment> findByFileDocumentIdOrderByWrittenAtAscIdAsc(String fileDocumentId);

	/** Wie viele Kommentare eine Datei hat. */
	long countByFileDocumentId(String fileDocumentId);

	/**
	 * Wie viele Kommentare mehrere Dateien haben, in EINER Abfrage: je Datei mit mindestens einem Kommentar eine Zeile.
	 * Eine Datei ohne Kommentar fehlt im Ergebnis.
	 */
	@Query("select new de.gebiter.file.dto.FileCommentCount(fileComment.fileDocumentId, count(fileComment)) "
			+ "from FileComment fileComment where fileComment.fileDocumentId in :fileDocumentIds "
			+ "group by fileComment.fileDocumentId")
	List<FileCommentCount> countByFileDocumentIds(@Param("fileDocumentIds") Collection<String> fileDocumentIds);

	/** Löscht alle Kommentare einer Datei, wenn sie endgültig gelöscht wird. */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from FileComment fileComment where fileComment.fileDocumentId = :fileDocumentId")
	int deleteAllByFileDocumentId(@Param("fileDocumentId") String fileDocumentId);
}
