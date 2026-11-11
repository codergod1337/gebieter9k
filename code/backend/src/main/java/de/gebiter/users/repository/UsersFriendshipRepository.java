package de.gebiter.users.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.users.model.UsersFriendship;

/**
 * Datenzugriff auf {@link UsersFriendship}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.users.service.UsersFriendshipService}.
 */
public interface UsersFriendshipRepository extends JpaRepository<UsersFriendship, Long> {

	/** Die Freundesliste eines Users: alle Einträge mit seiner GUID. */
	List<UsersFriendship> findByUsersGuid(UUID usersGuid);

	/** Hat {@code usersGuid} {@code friendUsersGuid} schon als Freund? */
	boolean existsByUsersGuidAndFriendUsersGuid(UUID usersGuid, UUID friendUsersGuid);

	/** Löscht einen Eintrag einer Richtung; liefert, wie viele es waren (0 oder 1). */
	long deleteByUsersGuidAndFriendUsersGuid(UUID usersGuid, UUID friendUsersGuid);
}
