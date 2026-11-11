package de.gebiter.access.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.access.model.AccessRoleUsersAssignment;

/**
 * Datenzugriff auf {@link AccessRoleUsersAssignment}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.access.service.AccessRoleUsersAssignmentService}.
 */
public interface AccessRoleUsersAssignmentRepository extends JpaRepository<AccessRoleUsersAssignment, Long> {

	/** Hat der User mit {@code usersGuid} das Recht {@code accessRoleKey} schon? */
	boolean existsByUsersGuidAndAccessRoleKey(UUID usersGuid, String accessRoleKey);

	/** Alle Zuweisungen des Users mit {@code usersGuid}. */
	List<AccessRoleUsersAssignment> findByUsersGuid(UUID usersGuid);
}
