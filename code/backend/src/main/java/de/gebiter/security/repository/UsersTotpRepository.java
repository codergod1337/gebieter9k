package de.gebiter.security.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.security.model.UsersTotp;

/**
 * Datenzugriff auf {@link UsersTotp}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.security.service.UsersTotpService}.
 */
public interface UsersTotpRepository extends JpaRepository<UsersTotp, Long> {

	/** Der Eintrag des Users, leer ohne Authenticator-App. */
	Optional<UsersTotp> findByUsersGuid(UUID usersGuid);
}
