package de.gebiter.access.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.access.model.AccessRoleCollectionRole;

/**
 * Datenzugriff auf {@link AccessRoleCollectionRole}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.access.service.AccessRoleCollectionRoleService}.
 */
public interface AccessRoleCollectionRoleRepository extends JpaRepository<AccessRoleCollectionRole, Long> {

	/** Enthält die Collection {@code accessRoleCollectionKey} das Recht {@code accessRoleKey} schon? */
	boolean existsByAccessRoleCollectionKeyAndAccessRoleKey(String accessRoleCollectionKey, String accessRoleKey);

	/** Alle Rechte der Collection {@code accessRoleCollectionKey}. */
	List<AccessRoleCollectionRole> findByAccessRoleCollectionKey(String accessRoleCollectionKey);
}
