package de.gebiter.access.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.access.model.AccessRoleCollectionRole;
import de.gebiter.access.repository.AccessRoleCollectionRoleRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link AccessRoleCollectionRole}: welche Rechte zu welcher Collection gehören. Er
 * nutzt nur sein eigenes {@link AccessRoleCollectionRoleRepository}. Ob es die Collection und das
 * Recht gibt, prüft er über den {@link AccessRoleCollectionService} und den {@link AccessRoleService}.
 * <p>
 * Aufnehmen und Entfernen darf nur der Admin. Lesen darf jeder, z. B. beim Login: Die Rechte der Collection eines
 * Users kommen mit ins Token.
 */
@Service
public class AccessRoleCollectionRoleService {

	private final AccessRoleCollectionRoleRepository accessRoleCollectionRoleRepository;

	private final AccessRoleCollectionService accessRoleCollectionService;

	private final AccessRoleService accessRoleService;

	public AccessRoleCollectionRoleService(AccessRoleCollectionRoleRepository accessRoleCollectionRoleRepository,
			AccessRoleCollectionService accessRoleCollectionService, AccessRoleService accessRoleService) {
		this.accessRoleCollectionRoleRepository = accessRoleCollectionRoleRepository;
		this.accessRoleCollectionService = accessRoleCollectionService;
		this.accessRoleService = accessRoleService;
	}

	/**
	 * CREATE: Nimmt das Recht {@code accessRoleKey} in die Collection {@code accessRoleCollectionKey} auf.
	 *
	 * @throws IllegalArgumentException wenn ein Key der Key-Regel nicht entspricht oder es die Collection
	 *         bzw. das Recht nicht gibt
	 * @throws DuplicateKeyException wenn die Collection das Recht schon enthält
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public AccessRoleCollectionRole createAccessRoleCollectionRole(String accessRoleCollectionKey,
			String accessRoleKey) {
		Helper.requireValidKey(accessRoleCollectionKey);
		Helper.requireValidKey(accessRoleKey);

		boolean accessRoleCollectionExists = accessRoleCollectionService
				.existsAccessRoleCollection(accessRoleCollectionKey);
		if (!accessRoleCollectionExists) {
			throw new IllegalArgumentException("Die Collection " + accessRoleCollectionKey + " gibt es nicht.");
		}
		boolean accessRoleExists = accessRoleService.existsAccessRole(accessRoleKey);
		if (!accessRoleExists) {
			throw new IllegalArgumentException("Das Recht " + accessRoleKey + " gibt es nicht.");
		}
		boolean accessRoleAlreadyInCollection = doExistsAccessRoleCollectionRole(accessRoleCollectionKey,
				accessRoleKey);
		if (accessRoleAlreadyInCollection) {
			throw new DuplicateKeyException(
					"Die Collection " + accessRoleCollectionKey + " enthält das Recht " + accessRoleKey + " schon.");
		}
		return doCreateAccessRoleCollectionRole(accessRoleCollectionKey, accessRoleKey);
	}

	/** READ: Enthält die Collection {@code accessRoleCollectionKey} das Recht {@code accessRoleKey}? */
	@Transactional(readOnly = true)
	public boolean existsAccessRoleCollectionRole(String accessRoleCollectionKey, String accessRoleKey) {
		Helper.requireNotNull(accessRoleCollectionKey, "accessRoleCollectionKey");
		Helper.requireNotNull(accessRoleKey, "accessRoleKey");
		return doExistsAccessRoleCollectionRole(accessRoleCollectionKey, accessRoleKey);
	}

	/**
	 * READ: Ein Eintrag über seine {@code id}.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional(readOnly = true)
	public AccessRoleCollectionRole getAccessRoleCollectionRole(Long id) {
		Helper.requireNotNull(id, "id");
		return doGetAccessRoleCollectionRole(id);
	}

	/** READ: Alle Einträge aller Collections, z. B. für die Matrix ARC × AR. */
	@Transactional(readOnly = true)
	public List<AccessRoleCollectionRole> getAllAccessRoleCollectionRole() {
		return accessRoleCollectionRoleRepository.findAll();
	}

	/** READ: Nur die Keys der Rechte in der Collection {@code accessRoleCollectionKey}, z. B. für das JWT. */
	@Transactional(readOnly = true)
	public List<String> getAccessRoleKeysByAccessRoleCollectionKey(String accessRoleCollectionKey) {
		Helper.requireNotNull(accessRoleCollectionKey, "accessRoleCollectionKey");
		return doGetAccessRoleKeysByAccessRoleCollectionKey(accessRoleCollectionKey);
	}

	// Kein UPDATE: Ein Eintrag besteht nur aus Collection und Recht. Ändern heißt entfernen und neu aufnehmen.

	/**
	 * DELETE: Nimmt ein Recht aus einer Collection, gelöscht wird genau dieser eine Eintrag.
	 *
	 * @throws IllegalArgumentException wenn die {@code id} fehlt
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteAccessRoleCollectionRole(Long id) {
		Helper.requireNotNull(id, "id");
		AccessRoleCollectionRole existingAccessRoleCollectionRole = doGetAccessRoleCollectionRole(id);
		accessRoleCollectionRoleRepository.delete(existingAccessRoleCollectionRole);
	}

	private AccessRoleCollectionRole doGetAccessRoleCollectionRole(Long id) {
		Optional<AccessRoleCollectionRole> foundAccessRoleCollectionRole = accessRoleCollectionRoleRepository
				.findById(id);
		if (foundAccessRoleCollectionRole.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen Eintrag mit der id " + id + ".");
		}
		return foundAccessRoleCollectionRole.get();
	}

	private AccessRoleCollectionRole doCreateAccessRoleCollectionRole(String accessRoleCollectionKey,
			String accessRoleKey) {
		AccessRoleCollectionRole newAccessRoleCollectionRole = new AccessRoleCollectionRole(accessRoleCollectionKey,
				accessRoleKey);
		return accessRoleCollectionRoleRepository.save(newAccessRoleCollectionRole);
	}

	private boolean doExistsAccessRoleCollectionRole(String accessRoleCollectionKey, String accessRoleKey) {
		return accessRoleCollectionRoleRepository.existsByAccessRoleCollectionKeyAndAccessRoleKey(
				accessRoleCollectionKey, accessRoleKey);
	}

	private List<String> doGetAccessRoleKeysByAccessRoleCollectionKey(String accessRoleCollectionKey) {
		List<AccessRoleCollectionRole> foundAccessRoleCollectionRole = accessRoleCollectionRoleRepository
				.findByAccessRoleCollectionKey(accessRoleCollectionKey);
		List<String> accessRoleKeys = new ArrayList<>();
		for (AccessRoleCollectionRole accessRoleCollectionRole : foundAccessRoleCollectionRole) {
			String accessRoleKey = accessRoleCollectionRole.getAccessRoleKey();
			accessRoleKeys.add(accessRoleKey);
		}
		return accessRoleKeys;
	}
}
