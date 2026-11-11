package de.gebiter.security.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.security.model.UsersRefreshToken;

/**
 * Datenzugriff auf {@link UsersRefreshToken}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.security.service.UsersRefreshTokenService}.
 */
public interface UsersRefreshTokenRepository extends JpaRepository<UsersRefreshToken, Long> {

	Optional<UsersRefreshToken> findByTokenHash(String tokenHash);

	/** Das aktuelle Glied jeder lebenden Sitzung eines Users: unverbraucht und nicht abgelaufen. */
	List<UsersRefreshToken> findByUsersGuidAndUsedAtIsNullAndExpiresAtAfter(UUID usersGuid, Instant now);

	/**
	 * Verbraucht das Glied in einem Schritt, nur wenn es noch unverbraucht ist. 0 heißt: Ein anderer Request war
	 * schneller.
	 */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update UsersRefreshToken usersRefreshToken set usersRefreshToken.usedAt = :now"
			+ " where usersRefreshToken.id = :id and usersRefreshToken.usedAt is null")
	int markUsedIfUnused(@Param("id") Long id, @Param("now") Instant now);

	/** Löscht eine ganze Kette, also eine Sitzung. */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from UsersRefreshToken usersRefreshToken where usersRefreshToken.chainGuid = :chainGuid")
	int deleteByChainGuid(@Param("chainGuid") UUID chainGuid);

	/** Löscht alle Ketten eines Users, also alle seine Sitzungen. */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from UsersRefreshToken usersRefreshToken where usersRefreshToken.usersGuid = :usersGuid")
	int deleteByUsersGuid(@Param("usersGuid") UUID usersGuid);

	/** Räumt die abgelaufenen Glieder eines Users weg. */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from UsersRefreshToken usersRefreshToken where usersRefreshToken.usersGuid = :usersGuid"
			+ " and usersRefreshToken.expiresAt <= :now")
	int deleteExpiredByUsersGuid(@Param("usersGuid") UUID usersGuid, @Param("now") Instant now);
}
