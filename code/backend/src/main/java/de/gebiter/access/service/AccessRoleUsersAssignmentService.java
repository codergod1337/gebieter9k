package de.gebiter.access.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.access.model.AccessRoleUsersAssignment;
import de.gebiter.access.repository.AccessRoleUsersAssignmentRepository;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link AccessRoleUsersAssignment}. Er nutzt nur sein eigenes
 * {@link AccessRoleUsersAssignmentRepository}. Ob es den User und das Recht gibt, prüft er über den
 * {@link UsersService} und den {@link AccessRoleService}.
 * <p>
 * Zuweisen und Entziehen darf nur der Admin. Lesen darf jeder, denn ein User muss die Rechte anderer
 * User kennen, z. B. für Freigaben.
 * <p>
 * RECHTE: Der Pfad ({@code SecurityConfig}) lässt Lesen über {@code /api/…} (AR USER oder ADMIN) und Schreiben fremder
 * Einträge nur über {@code /api/admin/…} (AR ADMIN) zu. Dazu prüfen die {@code @PreAuthorize} an den Methoden selbst
 * ({@code @EnableMethodSecurity} ist seit 2026-11-09 aktiv).
 */
@Service
public class AccessRoleUsersAssignmentService {

	private final AccessRoleUsersAssignmentRepository accessRoleUsersAssignmentRepository;

	private final UsersService usersService;

	private final AccessRoleService accessRoleService;

	public AccessRoleUsersAssignmentService(AccessRoleUsersAssignmentRepository accessRoleUsersAssignmentRepository,
			UsersService usersService, AccessRoleService accessRoleService) {
		this.accessRoleUsersAssignmentRepository = accessRoleUsersAssignmentRepository;
		this.usersService = usersService;
		this.accessRoleService = accessRoleService;
	}

	/**
	 * CREATE: Weist dem User mit {@code usersGuid} ein Recht zu. Der Key wird nach der Key-Regel
	 * umgewandelt, z. B. aus {@code " admin "} wird {@code ADMIN}.
	 *
	 * @throws IllegalArgumentException wenn ein Wert fehlt, der Key ungültig ist, es den User nicht
	 *         gibt (auch wenn er gelöscht ist) oder es das Recht nicht gibt
	 * @throws DuplicateKeyException wenn der User das Recht schon hat
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public AccessRoleUsersAssignment createAccessRoleUsersAssignment(UUID usersGuid, String rawAccessRoleKey) {
		String accessRoleKey = Helper.parseKey(rawAccessRoleKey);
		usersService.checkUsersExists(usersGuid, "usersGuid");

		boolean accessRoleExists = accessRoleService.existsAccessRole(accessRoleKey);
		if (!accessRoleExists) {
			throw new IllegalArgumentException("Das Recht " + accessRoleKey + " gibt es nicht.");
		}
		boolean accessRoleAlreadyAssigned = doExistsAccessRoleUsersAssignment(usersGuid, accessRoleKey);
		if (accessRoleAlreadyAssigned) {
			throw new DuplicateKeyException("Der User " + usersGuid + " hat das Recht " + accessRoleKey + " schon.");
		}
		return doCreateAccessRoleUsersAssignment(usersGuid, accessRoleKey);
	}

	/** READ: Hat der User mit {@code usersGuid} das Recht {@code accessRoleKey}? */
	@Transactional(readOnly = true)
	public boolean existsAccessRoleUsersAssignment(UUID usersGuid, String accessRoleKey) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Helper.requireNotNull(accessRoleKey, "accessRoleKey");
		return doExistsAccessRoleUsersAssignment(usersGuid, accessRoleKey);
	}

	/**
	 * READ: Eine Zuweisung über ihre {@code id}.
	 *
	 * @throws EntityNotFoundException wenn es die Zuweisung nicht gibt
	 */
	@Transactional(readOnly = true)
	public AccessRoleUsersAssignment getAccessRoleUsersAssignment(Long id) {
		return doGetAccessRoleUsersAssignment(id);
	}

	/** READ: Alle Rechte, die dem User mit {@code usersGuid} zugewiesen sind. */
	@Transactional(readOnly = true)
	public List<AccessRoleUsersAssignment> getAccessRoleUsersAssignmentByUsersGuid(UUID usersGuid) {
		return doGetAccessRoleUsersAssignmentByUsersGuid(usersGuid);
	}

	/** READ: Nur die Keys der Rechte, die dem User mit {@code usersGuid} zugewiesen sind, z. B. für das JWT. */
	@Transactional(readOnly = true)
	public List<String> getAccessRoleKeysByUsersGuid(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		return doGetAccessRoleKeysByUsersGuid(usersGuid);
	}

	/** READ: Alle Zuweisungen aller User. */
	@Transactional(readOnly = true)
	public List<AccessRoleUsersAssignment> getAllAccessRoleUsersAssignment() {
		return doGetAllAccessRoleUsersAssignment();
	}

	// Kein UPDATE: Eine Zuweisung besteht nur aus User und Recht. Ändern heißt entziehen und neu zuweisen.

	/**
	 * DELETE: Entzieht ein Recht, indem genau diese eine Zuweisung gelöscht wird. Sonst wird nichts
	 * gelöscht oder geändert.
	 *
	 * @throws IllegalArgumentException wenn die {@code id} fehlt
	 * @throws EntityNotFoundException wenn es die Zuweisung nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteAccessRoleUsersAssignment(Long id) {
		Helper.requireNotNull(id, "id");
		AccessRoleUsersAssignment existingAccessRoleUsersAssignment = doGetAccessRoleUsersAssignment(id);
		doDeleteAccessRoleUsersAssignment(existingAccessRoleUsersAssignment);
	}

	private AccessRoleUsersAssignment doCreateAccessRoleUsersAssignment(UUID usersGuid, String accessRoleKey) {
		AccessRoleUsersAssignment newAccessRoleUsersAssignment = new AccessRoleUsersAssignment(usersGuid,
				accessRoleKey);
		return accessRoleUsersAssignmentRepository.save(newAccessRoleUsersAssignment);
	}

	private boolean doExistsAccessRoleUsersAssignment(UUID usersGuid, String accessRoleKey) {
		return accessRoleUsersAssignmentRepository.existsByUsersGuidAndAccessRoleKey(usersGuid, accessRoleKey);
	}

	private AccessRoleUsersAssignment doGetAccessRoleUsersAssignment(Long id) {
		Optional<AccessRoleUsersAssignment> foundAccessRoleUsersAssignment = accessRoleUsersAssignmentRepository
				.findById(id);
		if (foundAccessRoleUsersAssignment.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keine Zuweisung mit der id " + id + ".");
		}
		return foundAccessRoleUsersAssignment.get();
	}

	private List<AccessRoleUsersAssignment> doGetAccessRoleUsersAssignmentByUsersGuid(UUID usersGuid) {
		return accessRoleUsersAssignmentRepository.findByUsersGuid(usersGuid);
	}

	private List<String> doGetAccessRoleKeysByUsersGuid(UUID usersGuid) {
		List<AccessRoleUsersAssignment> foundAccessRoleUsersAssignment = doGetAccessRoleUsersAssignmentByUsersGuid(
				usersGuid);
		List<String> accessRoleKeys = new ArrayList<>();
		for (AccessRoleUsersAssignment accessRoleUsersAssignment : foundAccessRoleUsersAssignment) {
			String accessRoleKey = accessRoleUsersAssignment.getAccessRoleKey();
			accessRoleKeys.add(accessRoleKey);
		}
		return accessRoleKeys;
	}

	private List<AccessRoleUsersAssignment> doGetAllAccessRoleUsersAssignment() {
		return accessRoleUsersAssignmentRepository.findAll();
	}

	private void doDeleteAccessRoleUsersAssignment(AccessRoleUsersAssignment existingAccessRoleUsersAssignment) {
		accessRoleUsersAssignmentRepository.delete(existingAccessRoleUsersAssignment);
	}
}
