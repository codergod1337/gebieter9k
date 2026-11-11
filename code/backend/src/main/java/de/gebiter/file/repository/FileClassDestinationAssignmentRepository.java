package de.gebiter.file.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.file.model.FileClassDestination;
import de.gebiter.file.model.FileClassDestinationAssignment;

/**
 * Datenzugriff auf {@link FileClassDestinationAssignment}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.file.service.FileClassDestinationAssignmentService}.
 */
public interface FileClassDestinationAssignmentRepository extends JpaRepository<FileClassDestinationAssignment, Long> {

	/** Wird die FileClass {@code fileClassKey} am Ziel {@code destination} angeboten? */
	boolean existsByFileClassKeyAndDestination(String fileClassKey, FileClassDestination destination);

	/** Alle Zuordnungen eines Ziels. */
	List<FileClassDestinationAssignment> findAllByDestination(FileClassDestination destination);
}
