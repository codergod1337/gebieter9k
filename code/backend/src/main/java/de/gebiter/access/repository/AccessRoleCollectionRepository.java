package de.gebiter.access.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.access.model.AccessRoleCollection;

/**
 * Datenzugriff auf {@link AccessRoleCollection}, Primärschlüssel ist der {@code key}. Genutzt wird
 * es ausschließlich vom {@link de.gebiter.access.service.AccessRoleCollectionService}.
 */
public interface AccessRoleCollectionRepository extends JpaRepository<AccessRoleCollection, String> {

	/** Alle Positionen, in der Reihenfolge der Anzeige, bei gleichem Platz nach Key. */
	List<AccessRoleCollection> findAllByOrderByListingPositionAscKeyAsc();

	/** Der Eintrag mit dem höchsten Platz, für den Platz eines neuen am Ende. */
	Optional<AccessRoleCollection> findTopByOrderByListingPositionDesc();
}
