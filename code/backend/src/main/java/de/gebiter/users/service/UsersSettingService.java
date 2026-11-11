package de.gebiter.users.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.model.UsersSetting;
import de.gebiter.users.repository.UsersSettingRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link UsersSetting}. Er nutzt nur sein eigenes {@link UsersSettingRepository}.
 * <p>
 * Ob es einen User gibt, prüft der Controller über den {@link UsersService}.
 * <p>
 * RECHTE: Der Pfad ({@code SecurityConfig}) lässt Lesen über {@code /api/…} (AR USER oder ADMIN) und Schreiben fremder
 * Einträge nur über {@code /api/admin/…} (AR ADMIN) zu. Dazu prüfen die {@code @PreAuthorize} an den Methoden selbst
 * ({@code @EnableMethodSecurity} ist seit 2026-11-09 aktiv).
 */
@Service
public class UsersSettingService {

	private final UsersSettingRepository usersSettingRepository;

	private final CurrentUsersProvider currentUsersProvider;

	public UsersSettingService(UsersSettingRepository usersSettingRepository, CurrentUsersProvider currentUsersProvider) {
		this.usersSettingRepository = usersSettingRepository;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE: Legt eine Einstellung für den User mit {@code usersGuid} an. Der Schlüssel wird nach der
	 * Key-Regel umgewandelt, z. B. aus {@code " theme "} wird {@code THEME}.
	 *
	 * @throws IllegalArgumentException wenn die GUID fehlt oder der Schlüssel ungültig ist
	 * @throws DuplicateKeyException wenn der User diesen Schlüssel schon hat
	 */
	@Transactional
	public UsersSetting createUsersSetting(UUID usersGuid, String rawSettingKey, String settingValue) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		String settingKey = Helper.parseKey(rawSettingKey);

		boolean settingKeyTaken = usersSettingRepository.existsByUsersGuidAndSettingKey(usersGuid, settingKey);
		if (settingKeyTaken) {
			throw new DuplicateKeyException("Der User " + usersGuid + " hat die Einstellung " + settingKey
					+ " schon.");
		}
		return doCreateUsersSetting(usersGuid, settingKey, settingValue);
	}

	/**
	 * READ: Ein Eintrag über seine {@code id}.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional(readOnly = true)
	public UsersSetting getUsersSetting(Long id) {
		return doGetUsersSetting(id);
	}

	/** READ: Alle Einstellungen des Users mit {@code usersGuid}. */
	@Transactional(readOnly = true)
	public List<UsersSetting> getUsersSettingByUsersGuid(UUID usersGuid) {
		return doGetUsersSettingByUsersGuid(usersGuid);
	}

	/** READ: Alle Einstellungen aller User. */
	@Transactional(readOnly = true)
	public List<UsersSetting> getAllUsersSetting() {
		return doGetAllUsersSetting();
	}

	/** READ: Die eigenen Einstellungen des angemeldeten Users, z. B. die Spaltenbreiten seiner Tabellen. */
	@Transactional(readOnly = true)
	public List<UsersSetting> getOwnUsersSetting() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		return doGetUsersSettingByUsersGuid(currentUsersGuid);
	}

	/**
	 * UPDATE: Setzt eine eigene Einstellung des angemeldeten Users. Hat er den Schlüssel noch nicht, wird er angelegt,
	 * sonst bekommt er den neuen Wert. Fremde Einstellungen erreicht er so nie, die GUID kommt aus dem Token.
	 *
	 * @throws IllegalArgumentException wenn der Schlüssel die Key-Regel verletzt
	 */
	@Transactional
	public UsersSetting saveOwnUsersSetting(String rawSettingKey, String settingValue) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		String settingKey = Helper.parseKey(rawSettingKey);
		Optional<UsersSetting> foundUsersSetting = usersSettingRepository.findByUsersGuidAndSettingKey(currentUsersGuid,
				settingKey);
		if (foundUsersSetting.isEmpty()) {
			return doCreateUsersSetting(currentUsersGuid, settingKey, settingValue);
		}
		UsersSetting existingUsersSetting = foundUsersSetting.get();
		existingUsersSetting.setSettingValue(settingValue);
		return usersSettingRepository.save(existingUsersSetting);
	}

	/**
	 * DELETE: Löscht eine eigene Einstellung des angemeldeten Users. Gibt es sie nicht, passiert nichts.
	 *
	 * @throws IllegalArgumentException wenn der Schlüssel die Key-Regel verletzt
	 */
	@Transactional
	public void deleteOwnUsersSetting(String rawSettingKey) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		String settingKey = Helper.parseKey(rawSettingKey);
		Optional<UsersSetting> foundUsersSetting = usersSettingRepository.findByUsersGuidAndSettingKey(currentUsersGuid,
				settingKey);
		if (foundUsersSetting.isPresent()) {
			UsersSetting existingUsersSetting = foundUsersSetting.get();
			doDeleteUsersSetting(existingUsersSetting);
		}
	}

	/**
	 * UPDATE: Ändert den Wert einer Einstellung. Übernommen wird nur {@code settingValue}; User und
	 * Schlüssel bleiben, wie sie sind.
	 *
	 * @param changedUsersSetting der Request Body, maßgeblich sind {@code id} und {@code settingValue}
	 * @throws IllegalArgumentException wenn die {@code id} fehlt
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional
	public UsersSetting changeUsersSetting(UsersSetting changedUsersSetting) {
		Long id = changedUsersSetting.getId();
		Helper.requireNotNull(id, "id");
		UsersSetting existingUsersSetting = doGetUsersSetting(id);
		return doChangeUsersSetting(existingUsersSetting, changedUsersSetting);
	}

	/**
	 * DELETE: Löscht einen Eintrag über seine {@code id}.
	 *
	 * @throws IllegalArgumentException wenn die {@code id} fehlt
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional
	public void deleteUsersSetting(Long id) {
		Helper.requireNotNull(id, "id");
		UsersSetting existingUsersSetting = doGetUsersSetting(id);
		doDeleteUsersSetting(existingUsersSetting);
	}

	/**
	 * DELETE: Löscht alle Einstellungen des Users mit {@code usersGuid}.
	 * <p>
	 * Derzeit ruft sie niemand auf: Ein gelöschter User bekommt nur den Status {@code DELETED}, seine
	 * Einträge bleiben stehen. Ob es ein endgültiges Löschen gibt, ist noch offen.
	 */
	@Transactional
	public void deleteUsersSettingByUsersGuid(UUID usersGuid) {
		doDeleteUsersSettingByUsersGuid(usersGuid);
	}

	private UsersSetting doCreateUsersSetting(UUID usersGuid, String settingKey, String settingValue) {
		UsersSetting newUsersSetting = new UsersSetting(usersGuid, settingKey, settingValue);
		return usersSettingRepository.save(newUsersSetting);
	}

	private UsersSetting doGetUsersSetting(Long id) {
		Optional<UsersSetting> foundUsersSetting = usersSettingRepository.findById(id);
		if (foundUsersSetting.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen UsersSetting-Eintrag mit der id " + id + ".");
		}
		return foundUsersSetting.get();
	}

	private List<UsersSetting> doGetUsersSettingByUsersGuid(UUID usersGuid) {
		return usersSettingRepository.findByUsersGuid(usersGuid);
	}

	private List<UsersSetting> doGetAllUsersSetting() {
		return usersSettingRepository.findAll();
	}

	private UsersSetting doChangeUsersSetting(UsersSetting existingUsersSetting, UsersSetting changedUsersSetting) {
		String changedSettingValue = changedUsersSetting.getSettingValue();
		existingUsersSetting.setSettingValue(changedSettingValue);
		return usersSettingRepository.save(existingUsersSetting);
	}

	private void doDeleteUsersSetting(UsersSetting existingUsersSetting) {
		usersSettingRepository.delete(existingUsersSetting);
	}

	private void doDeleteUsersSettingByUsersGuid(UUID usersGuid) {
		usersSettingRepository.deleteByUsersGuid(usersGuid);
	}
}
