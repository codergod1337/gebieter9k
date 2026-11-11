package de.gebiter.access.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.access.model.AccessRole;

/**
 * Datenzugriff auf {@link AccessRole}, Primärschlüssel ist der {@code key}. Genutzt wird es
 * ausschließlich vom {@link de.gebiter.access.service.AccessRoleService}.
 */
public interface AccessRoleRepository extends JpaRepository<AccessRole, String> {

	/** Alle Rechte, in der Reihenfolge der Anzeige, bei gleichem Platz nach Key. */
	List<AccessRole> findAllByOrderByListingPositionAscKeyAsc();

	/** Der Eintrag mit dem höchsten Platz, für den Platz eines neuen am Ende. */
	Optional<AccessRole> findTopByOrderByListingPositionDesc();
}
