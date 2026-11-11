package de.gebiter.users.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.status.model.UsersStatus;
import de.gebiter.users.model.Users;

/**
 * Datenzugriff auf {@link Users}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.users.service.UsersService}, nie von einem Controller oder einem anderen Service.
 */
public interface UsersRepository extends JpaRepository<Users, UUID> {

	/**
	 * Ändert den Kontostand atomar in der Datenbank, nie ins Minus: Reicht der Stand nicht, ändert sich keine Zeile. Die
	 * Zeile bleibt bis zum Commit gesperrt, zwei gleichzeitige Buchungen können das Konto also nicht überziehen.
	 *
	 * @return die Zahl der geänderten Zeilen: 1 gebucht, 0 kein User oder Stand reicht nicht
	 */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update Users users set users.points = users.points + :amountPoints where users.guid = :usersGuid "
			+ "and users.points + :amountPoints >= 0")
	int changePoints(@Param("usersGuid") UUID usersGuid, @Param("amountPoints") long amountPoints);

	/** Hat schon ein User diesen Username? */
	boolean existsByUsername(String username);

	/** Hat schon ein User diese E-Mail-Adresse? */
	boolean existsByEmail(String email);

	/** Hat ein anderer User als der mit {@code guid} schon diesen Username? */
	boolean existsByUsernameAndGuidNot(String username, UUID guid);

	/** Hat ein anderer User als der mit {@code guid} schon diese E-Mail-Adresse? */
	boolean existsByEmailAndGuidNot(String email, UUID guid);

	/** Gibt es den User mit {@code guid} mit einem anderen Status als {@code status}? */
	boolean existsByGuidAndStatusNot(UUID guid, UsersStatus status);

	/** Gibt es den User mit {@code guid} mit genau dem Status {@code status}? */
	boolean existsByGuidAndStatus(UUID guid, UsersStatus status);

	/** Der User mit {@code guid}, falls er einen anderen Status als {@code status} hat. */
	Optional<Users> findByGuidAndStatusNot(UUID guid, UsersStatus status);

	/** Der User mit dieser E-Mail-Adresse, falls er einen anderen Status als {@code status} hat. */
	Optional<Users> findByEmailAndStatusNot(String email, UsersStatus status);

	/** Alle User mit einem anderen Status als {@code status}. */
	List<Users> findByStatusNot(UsersStatus status);

	/** Alle User mit genau dem Status {@code status}. */
	List<Users> findByStatus(UsersStatus status);
}
