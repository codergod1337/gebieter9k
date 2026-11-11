package de.gebiter.file.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.file.model.FileClassFileExtension;

/**
 * Datenzugriff auf {@link FileClassFileExtension}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.file.service.FileClassFileExtensionService}.
 */
public interface FileClassFileExtensionRepository extends JpaRepository<FileClassFileExtension, Long> {

	/** Nimmt die FileClass {@code fileClassKey} die Endung {@code fileExtension} an? */
	boolean existsByFileClassKeyAndFileExtension(String fileClassKey, String fileExtension);

	/** Alle Freischaltungen der Endung {@code fileExtension}, an jeder FileClass. */
	List<FileClassFileExtension> findAllByFileExtension(String fileExtension);
}
