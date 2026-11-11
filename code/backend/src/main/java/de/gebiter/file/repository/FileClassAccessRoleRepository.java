package de.gebiter.file.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.file.model.FileClassAccessRole;

/**
 * Datenzugriff auf {@link FileClassAccessRole}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.file.service.FileClassAccessRoleService}.
 */
public interface FileClassAccessRoleRepository extends JpaRepository<FileClassAccessRole, Long> {

	/** Der Eintrag des Rechts {@code accessRoleKey} an der FileClass {@code fileClassKey}, falls es einen gibt. */
	Optional<FileClassAccessRole> findByFileClassKeyAndAccessRoleKey(String fileClassKey, String accessRoleKey);

	/** Alle Einträge der FileClass {@code fileClassKey}. */
	List<FileClassAccessRole> findByFileClassKey(String fileClassKey);
}
