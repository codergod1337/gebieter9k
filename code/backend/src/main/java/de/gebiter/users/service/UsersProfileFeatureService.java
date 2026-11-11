package de.gebiter.users.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.users.model.UsersProfileFeature;
import de.gebiter.users.repository.UsersProfileFeatureRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link UsersProfileFeature}. Er nutzt nur sein eigenes
 * {@link UsersProfileFeatureRepository}.
 * <p>
 * Ob es einen User gibt, prüft der Controller über den {@link UsersService}.
 * <p>
 * RECHTE: Der Pfad ({@code SecurityConfig}) lässt Lesen über {@code /api/…} (AR USER oder ADMIN) und Schreiben fremder
 * Einträge nur über {@code /api/admin/…} (AR ADMIN) zu. Dazu prüfen die {@code @PreAuthorize} an den Methoden selbst
 * ({@code @EnableMethodSecurity} ist seit 2026-11-09 aktiv).
 */
@Service
public class UsersProfileFeatureService {

	private final UsersProfileFeatureRepository usersProfileFeatureRepository;

	public UsersProfileFeatureService(UsersProfileFeatureRepository usersProfileFeatureRepository) {
		this.usersProfileFeatureRepository = usersProfileFeatureRepository;
	}

	/**
	 * CREATE: Schaltet für den User mit {@code usersGuid} ein Feature frei. Der Schlüssel wird nach der
	 * Key-Regel umgewandelt.
	 *
	 * @throws IllegalArgumentException wenn die GUID fehlt oder der Schlüssel ungültig ist
	 * @throws DuplicateKeyException wenn der User das Feature schon hat
	 */
	@Transactional
	public UsersProfileFeature createUsersProfileFeature(UUID usersGuid, String rawFeatureKey) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		String featureKey = Helper.parseKey(rawFeatureKey);

		boolean featureAlreadyUnlocked = usersProfileFeatureRepository.existsByUsersGuidAndFeatureKey(usersGuid,
				featureKey);
		if (featureAlreadyUnlocked) {
			throw new DuplicateKeyException("Der User " + usersGuid + " hat das Feature " + featureKey + " schon.");
		}
		return doCreateUsersProfileFeature(usersGuid, featureKey);
	}

	/**
	 * READ: Ein Eintrag über seine {@code id}.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional(readOnly = true)
	public UsersProfileFeature getUsersProfileFeature(Long id) {
		return doGetUsersProfileFeature(id);
	}

	/** READ: Alle freigeschalteten Features des Users mit {@code usersGuid}. */
	@Transactional(readOnly = true)
	public List<UsersProfileFeature> getUsersProfileFeatureByUsersGuid(UUID usersGuid) {
		return doGetUsersProfileFeatureByUsersGuid(usersGuid);
	}

	/** READ: Alle freigeschalteten Features aller User. */
	@Transactional(readOnly = true)
	public List<UsersProfileFeature> getAllUsersProfileFeature() {
		return doGetAllUsersProfileFeature();
	}

	// Kein UPDATE: Ein Eintrag besteht nur aus User und Feature. Ändern heißt löschen und neu anlegen.

	/**
	 * DELETE: Löscht einen Eintrag über seine {@code id}, das Feature ist danach gesperrt.
	 *
	 * @throws IllegalArgumentException wenn die {@code id} fehlt
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional
	public void deleteUsersProfileFeature(Long id) {
		Helper.requireNotNull(id, "id");
		UsersProfileFeature existingUsersProfileFeature = doGetUsersProfileFeature(id);
		doDeleteUsersProfileFeature(existingUsersProfileFeature);
	}

	/**
	 * DELETE: Löscht alle Features des Users mit {@code usersGuid}.
	 * <p>
	 * Derzeit ruft sie niemand auf: Ein gelöschter User bekommt nur den Status {@code DELETED}, seine
	 * Einträge bleiben stehen. Ob es ein endgültiges Löschen gibt, ist noch offen.
	 */
	@Transactional
	public void deleteUsersProfileFeatureByUsersGuid(UUID usersGuid) {
		doDeleteUsersProfileFeatureByUsersGuid(usersGuid);
	}

	private UsersProfileFeature doCreateUsersProfileFeature(UUID usersGuid, String featureKey) {
		UsersProfileFeature newUsersProfileFeature = new UsersProfileFeature(usersGuid, featureKey);
		return usersProfileFeatureRepository.save(newUsersProfileFeature);
	}

	private UsersProfileFeature doGetUsersProfileFeature(Long id) {
		Optional<UsersProfileFeature> foundUsersProfileFeature = usersProfileFeatureRepository.findById(id);
		if (foundUsersProfileFeature.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen UsersProfileFeature-Eintrag mit der id " + id + ".");
		}
		return foundUsersProfileFeature.get();
	}

	private List<UsersProfileFeature> doGetUsersProfileFeatureByUsersGuid(UUID usersGuid) {
		return usersProfileFeatureRepository.findByUsersGuid(usersGuid);
	}

	private List<UsersProfileFeature> doGetAllUsersProfileFeature() {
		return usersProfileFeatureRepository.findAll();
	}

	private void doDeleteUsersProfileFeature(UsersProfileFeature existingUsersProfileFeature) {
		usersProfileFeatureRepository.delete(existingUsersProfileFeature);
	}

	private void doDeleteUsersProfileFeatureByUsersGuid(UUID usersGuid) {
		usersProfileFeatureRepository.deleteByUsersGuid(usersGuid);
	}
}
