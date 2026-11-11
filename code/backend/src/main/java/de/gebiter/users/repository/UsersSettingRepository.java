package de.gebiter.users.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.users.model.UsersSetting;

/**
 * Datenzugriff auf {@link UsersSetting}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.users.service.UsersSettingService}.
 */
public interface UsersSettingRepository extends JpaRepository<UsersSetting, Long> {

	/** Alle Einstellungen des Users mit {@code usersGuid}. */
	List<UsersSetting> findByUsersGuid(UUID usersGuid);

	/** Die Einstellung eines Users mit diesem Schlüssel, falls es sie gibt. */
	Optional<UsersSetting> findByUsersGuidAndSettingKey(UUID usersGuid, String settingKey);

	/** Hat der User mit {@code usersGuid} schon eine Einstellung mit diesem Schlüssel? */
	boolean existsByUsersGuidAndSettingKey(UUID usersGuid, String settingKey);

	/** Löscht alle Einstellungen des Users mit {@code usersGuid}. */
	void deleteByUsersGuid(UUID usersGuid);
}
