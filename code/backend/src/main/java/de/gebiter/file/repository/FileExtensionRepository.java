package de.gebiter.file.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.file.model.FileExtension;

/**
 * Datenzugriff auf {@link FileExtension}, Primärschlüssel ist die Endung. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.file.service.FileExtensionService}.
 */
public interface FileExtensionRepository extends JpaRepository<FileExtension, String> {

	/** Alle Endungen in der Reihenfolge der Anzeige, bei gleichem Platz nach Endung. */
	List<FileExtension> findAllByOrderByListingPositionAscExtensionAsc();

	/** Der Eintrag mit dem höchsten Platz, für den Platz eines neuen am Ende. */
	Optional<FileExtension> findTopByOrderByListingPositionDesc();

	/** Alle Endungen der Gruppe {@code fileExtensionGroupKey}. */
	List<FileExtension> findAllByFileExtensionGroupKey(String fileExtensionGroupKey);
}
