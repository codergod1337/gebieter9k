package de.gebiter.file.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.file.model.FileExtensionGroup;

/**
 * Datenzugriff auf {@link FileExtensionGroup}, Primärschlüssel ist der Key. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.file.service.FileExtensionGroupService}.
 */
public interface FileExtensionGroupRepository extends JpaRepository<FileExtensionGroup, String> {

	/** Alle Gruppen in der Reihenfolge der Anzeige, bei gleichem Platz nach Key. */
	List<FileExtensionGroup> findAllByOrderByListingPositionAscKeyAsc();

	/** Der Eintrag mit dem höchsten Platz, für den Platz eines neuen am Ende. */
	Optional<FileExtensionGroup> findTopByOrderByListingPositionDesc();
}
