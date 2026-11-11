package de.gebiter.users.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.users.model.UsersProfileFeature;

/**
 * Datenzugriff auf {@link UsersProfileFeature}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.users.service.UsersProfileFeatureService}.
 */
public interface UsersProfileFeatureRepository extends JpaRepository<UsersProfileFeature, Long> {

	/** Alle freigeschalteten Features des Users mit {@code usersGuid}. */
	List<UsersProfileFeature> findByUsersGuid(UUID usersGuid);

	/** Hat der User mit {@code usersGuid} dieses Feature schon? */
	boolean existsByUsersGuidAndFeatureKey(UUID usersGuid, String featureKey);

	/** Löscht alle Features des Users mit {@code usersGuid}. */
	void deleteByUsersGuid(UUID usersGuid);
}
