package de.gebiter.file.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.file.model.FileClass;

/**
 * Datenzugriff auf {@link FileClass}, Primärschlüssel ist der {@code key}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.file.service.FileClassService}.
 */
public interface FileClassRepository extends JpaRepository<FileClass, String> {

	/** Alle FileClasses in der Reihenfolge der Anzeige, bei gleichem Platz nach Key. */
	List<FileClass> findAllByOrderByListingPositionAscKeyAsc();

	/** Der Eintrag mit dem höchsten Platz, für den Platz eines neuen am Ende. */
	Optional<FileClass> findTopByOrderByListingPositionDesc();
}
