package de.gebiter.security.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.security.model.UsersLogin2fa;

/**
 * Datenzugriff auf {@link UsersLogin2fa}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.security.service.UsersLogin2faService}.
 * <p>
 * Zählen und Einlösen sind je eine SQL-Anweisung: So gewinnt bei zwei gleichzeitigen Anfragen genau eine, und niemand
 * bekommt eine Sitzung doppelt oder einen Fehlversuch geschenkt.
 */
public interface UsersLogin2faRepository extends JpaRepository<UsersLogin2fa, Long> {

	/** Die Zeile zum Anmeldeschein. */
	Optional<UsersLogin2fa> findByLoginTokenHash(String loginTokenHash);

	/** Räumt Abgelaufenes weg. */
	@Modifying
	void deleteByExpiresAtBefore(Instant now);

	/** Zählt einen falschen Code. Liefert, wie viele Zeilen es traf (0 oder 1). */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update UsersLogin2fa usersLogin2fa set usersLogin2fa.failedCodeCount = usersLogin2fa.failedCodeCount + 1"
			+ " where usersLogin2fa.loginTokenHash = :loginTokenHash")
	int increaseFailedCodeCount(@Param("loginTokenHash") String loginTokenHash);

	/** Löscht die Zeile, wenn sie noch gültig ist. Liefert, wie viele Zeilen es traf (0 oder 1). */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from UsersLogin2fa usersLogin2fa where usersLogin2fa.loginTokenHash = :loginTokenHash"
			+ " and usersLogin2fa.expiresAt > :now")
	int deleteIfActive(@Param("loginTokenHash") String loginTokenHash, @Param("now") Instant now);

	/** Löscht die Zeile, egal ob noch gültig (zu viele falsche Codes). */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from UsersLogin2fa usersLogin2fa where usersLogin2fa.loginTokenHash = :loginTokenHash")
	int deleteByLoginTokenHash(@Param("loginTokenHash") String loginTokenHash);
}
