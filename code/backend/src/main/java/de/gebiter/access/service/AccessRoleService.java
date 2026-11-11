package de.gebiter.access.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.access.model.AccessRole;
import de.gebiter.access.repository.AccessRoleRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link AccessRole}. Er nutzt nur sein eigenes {@link AccessRoleRepository}.
 * <p>
 * Anlegen und Ändern darf nur der Admin, lesen darf jeder (Stammdaten des Frontends). DELETE fehlt
 * noch: Beim Löschen müssen die Zuweisungen des Rechts mit weg, und der
 * {@code AccessRoleUsersAssignmentService} nutzt umgekehrt diesen Service. Der Weg um diesen Zirkel
 * wird erst besprochen.
 */
@Service
public class AccessRoleService {

	private final AccessRoleRepository accessRoleRepository;

	/** In dieser Sprache muss jeder Anzeigename Text haben ({@code gebiter.language.default-code}). */
	private final String defaultLanguageCode;

	public AccessRoleService(AccessRoleRepository accessRoleRepository,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.accessRoleRepository = accessRoleRepository;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt ein neues Recht an. Der Anzeigename ist mehrsprachig, z. B. {@code {"de": "User"}}.
	 *
	 * @throws IllegalArgumentException wenn der Key der Key-Regel nicht entspricht oder der Name in der
	 *         Pflichtsprache fehlt
	 * @throws DuplicateKeyException wenn es den Key schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public AccessRole createAccessRole(String accessRoleKey, Map<String, String> displayName) {
		Helper.requireValidKey(accessRoleKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		// Ohne diese Prüfung würde save() ein bestehendes Recht still überschreiben.
		boolean accessRoleKeyTaken = doExistsAccessRole(accessRoleKey);
		if (accessRoleKeyTaken) {
			throw new DuplicateKeyException("Das Recht " + accessRoleKey + " gibt es schon.");
		}
		return doCreateAccessRole(accessRoleKey, displayName);
	}

	/** READ: Gibt es das Recht mit {@code accessRoleKey}? */
	@Transactional(readOnly = true)
	public boolean existsAccessRole(String accessRoleKey) {
		Helper.requireNotNull(accessRoleKey, "accessRoleKey");
		return doExistsAccessRole(accessRoleKey);
	}

	/**
	 * READ: Ein Recht über seinen {@code accessRoleKey}.
	 *
	 * @throws IllegalArgumentException wenn der Key fehlt
	 * @throws EntityNotFoundException wenn es das Recht nicht gibt
	 */
	@Transactional(readOnly = true)
	public AccessRole getAccessRole(String accessRoleKey) {
		Helper.requireNotNull(accessRoleKey, "accessRoleKey");
		return doGetAccessRole(accessRoleKey);
	}

	/** READ: Alle Rechte in der Reihenfolge der Anzeige, z. B. für die Stammdaten des Frontends. */
	@Transactional(readOnly = true)
	public List<AccessRole> getAllAccessRole() {
		return doGetAllAccessRole();
	}

	/**
	 * UPDATE: Ändert ein Recht. Der Key bestimmt nur, welches Recht geändert wird, er selbst ändert sich
	 * nie. Übernommen wird der {@code displayName}.
	 *
	 * @param changedAccessRole der Request Body, maßgeblich ist {@code key}
	 * @throws IllegalArgumentException wenn der Key fehlt oder der Name in der Pflichtsprache fehlt
	 * @throws EntityNotFoundException wenn es das Recht nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public AccessRole changeAccessRole(AccessRole changedAccessRole) {
		String accessRoleKey = changedAccessRole.getKey();
		Helper.requireNotNull(accessRoleKey, "key");
		Map<String, String> changedDisplayName = changedAccessRole.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);

		AccessRole existingAccessRole = doGetAccessRole(accessRoleKey);
		return doChangeAccessRole(existingAccessRole, changedDisplayName);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop im Tab „AR“. Der erste Key bekommt Platz 1, der nächste 2 usw.
	 *
	 * @param accessRoleKeysInOrder jeder Key genau einmal, von oben nach unten
	 * @return alle Rechte in der neuen Reihenfolge
	 * @throws IllegalArgumentException wenn ein Key fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<AccessRole> changeAccessRoleListingPositions(List<String> accessRoleKeysInOrder) {
		List<AccessRole> allAccessRoles = doGetAllAccessRole();
		List<String> existingAccessRoleKeys = new ArrayList<>();
		for (AccessRole accessRole : allAccessRoles) {
			String existingAccessRoleKey = accessRole.getKey();
			existingAccessRoleKeys.add(existingAccessRoleKey);
		}
		Helper.requireCompleteKeyOrder(accessRoleKeysInOrder, existingAccessRoleKeys, "keysInOrder");
		for (AccessRole accessRole : allAccessRoles) {
			String accessRoleKey = accessRole.getKey();
			int newListingPosition = accessRoleKeysInOrder.indexOf(accessRoleKey) + 1;
			// verwaltet in dieser Transaktion: Hibernate schreibt die Änderung beim Commit (Dirty Checking)
			accessRole.setListingPosition(newListingPosition);
		}
		accessRoleRepository.saveAll(allAccessRoles);
		return doGetAllAccessRole();
	}

	private AccessRole doCreateAccessRole(String accessRoleKey, Map<String, String> displayName) {
		// Ein neues Recht kommt ans Ende der Liste.
		int newListingPosition = 1;
		Optional<AccessRole> lastAccessRole = accessRoleRepository.findTopByOrderByListingPositionDesc();
		if (lastAccessRole.isPresent()) {
			int lastListingPosition = lastAccessRole.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		AccessRole newAccessRole = new AccessRole(accessRoleKey, displayName, newListingPosition);
		return accessRoleRepository.save(newAccessRole);
	}

	private boolean doExistsAccessRole(String accessRoleKey) {
		return accessRoleRepository.existsById(accessRoleKey);
	}

	private AccessRole doGetAccessRole(String accessRoleKey) {
		Optional<AccessRole> foundAccessRole = accessRoleRepository.findById(accessRoleKey);
		if (foundAccessRole.isEmpty()) {
			throw new EntityNotFoundException("Das Recht " + accessRoleKey + " gibt es nicht.");
		}
		return foundAccessRole.get();
	}

	private List<AccessRole> doGetAllAccessRole() {
		// Die Reihenfolge der Anzeige, bei gleichem Platz nach Key: So springen Listen im Frontend nie.
		return accessRoleRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	private AccessRole doChangeAccessRole(AccessRole existingAccessRole, Map<String, String> changedDisplayName) {
		// existingAccessRole ist in dieser Transaktion verwaltet: Hibernate schreibt die Änderung beim
		// Commit ohnehin (Dirty Checking). save() steht trotzdem da, damit sichtbar ist, dass gespeichert wird.
		existingAccessRole.setDisplayName(changedDisplayName);
		return accessRoleRepository.save(existingAccessRole);
	}
}
