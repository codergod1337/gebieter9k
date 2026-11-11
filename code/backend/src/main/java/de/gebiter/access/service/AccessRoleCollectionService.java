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

import de.gebiter.access.model.AccessRoleCollection;
import de.gebiter.access.repository.AccessRoleCollectionRepository;
import de.gebiter.badge.model.BadgeLook;
import de.gebiter.badge.service.BadgeLookService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link AccessRoleCollection} (Position). Er nutzt nur sein eigenes
 * {@link AccessRoleCollectionRepository}, das Aussehen prüft der {@link BadgeLookService}.
 * <p>
 * Anlegen, Ändern und Verschieben darf nur der Admin, lesen darf jeder (Stammdaten des Frontends). Welche Rechte zu
 * einer Position gehören, verwaltet der {@link AccessRoleCollectionRoleService}.
 */
@Service
public class AccessRoleCollectionService {

	private final AccessRoleCollectionRepository accessRoleCollectionRepository;

	private final BadgeLookService badgeLookService;

	/** In dieser Sprache muss jeder Anzeigename Text haben ({@code gebiter.language.default-code}). */
	private final String defaultLanguageCode;

	public AccessRoleCollectionService(AccessRoleCollectionRepository accessRoleCollectionRepository,
			BadgeLookService badgeLookService, @Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.accessRoleCollectionRepository = accessRoleCollectionRepository;
		this.badgeLookService = badgeLookService;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt eine neue Position an, noch ohne Rechte und ohne eigenes Aussehen, am Ende der Liste. Der Anzeigename
	 * ist mehrsprachig, z. B. {@code {"de": "Bürger"}}.
	 *
	 * @throws IllegalArgumentException wenn der Key der Key-Regel nicht entspricht oder der Name in der
	 *         Pflichtsprache fehlt
	 * @throws DuplicateKeyException wenn es den Key schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public AccessRoleCollection createAccessRoleCollection(String accessRoleCollectionKey,
			Map<String, String> displayName) {
		Helper.requireValidKey(accessRoleCollectionKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		// Ohne diese Prüfung würde save() eine bestehende Position still überschreiben.
		boolean accessRoleCollectionKeyTaken = doExistsAccessRoleCollection(accessRoleCollectionKey);
		if (accessRoleCollectionKeyTaken) {
			throw new DuplicateKeyException("Die Position " + accessRoleCollectionKey + " gibt es schon.");
		}
		return doCreateAccessRoleCollection(accessRoleCollectionKey, displayName);
	}

	/** READ: Gibt es die Position mit {@code accessRoleCollectionKey}? */
	@Transactional(readOnly = true)
	public boolean existsAccessRoleCollection(String accessRoleCollectionKey) {
		Helper.requireNotNull(accessRoleCollectionKey, "accessRoleCollectionKey");
		return doExistsAccessRoleCollection(accessRoleCollectionKey);
	}

	/**
	 * READ: Eine Position über ihren Key, z. B. für die Seite „Position bearbeiten“.
	 *
	 * @throws EntityNotFoundException wenn es die Position nicht gibt
	 */
	@Transactional(readOnly = true)
	public AccessRoleCollection getAccessRoleCollection(String accessRoleCollectionKey) {
		Helper.requireNotNull(accessRoleCollectionKey, "accessRoleCollectionKey");
		return doGetAccessRoleCollection(accessRoleCollectionKey);
	}

	/** READ: Alle Positionen in der Reihenfolge der Anzeige, z. B. für die Stammdaten des Frontends. */
	@Transactional(readOnly = true)
	public List<AccessRoleCollection> getAllAccessRoleCollection() {
		return doGetAllAccessRoleCollection();
	}

	/**
	 * UPDATE: Ändert eine Position. Der Key bestimmt nur, welche; übernommen werden Anzeigename und Aussehen. Platz und
	 * Rechte ändern eigene Vorgänge.
	 *
	 * @param changedAccessRoleCollection der Request Body, maßgeblich ist {@code key}
	 * @throws IllegalArgumentException wenn der Key oder der Name in der Pflichtsprache fehlt oder das Aussehen ungültig
	 *         ist
	 * @throws EntityNotFoundException wenn es die Position nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public AccessRoleCollection changeAccessRoleCollection(AccessRoleCollection changedAccessRoleCollection) {
		String accessRoleCollectionKey = changedAccessRoleCollection.getKey();
		Helper.requireNotNull(accessRoleCollectionKey, "key");
		Map<String, String> changedDisplayName = changedAccessRoleCollection.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);
		BadgeLook enteredBadgeLook = changedAccessRoleCollection.getBadgeLook();
		BadgeLook changedBadgeLook = badgeLookService.requireValidBadgeLook(enteredBadgeLook);

		AccessRoleCollection existingAccessRoleCollection = doGetAccessRoleCollection(accessRoleCollectionKey);
		existingAccessRoleCollection.setDisplayName(changedDisplayName);
		existingAccessRoleCollection.setBadgeLook(changedBadgeLook);
		return accessRoleCollectionRepository.save(existingAccessRoleCollection);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop in der Matrix „ARC-AR“. Der erste Key bekommt Platz 1, der nächste
	 * 2 usw.
	 *
	 * @param accessRoleCollectionKeysInOrder jeder Key genau einmal, von oben nach unten
	 * @return alle Positionen in der neuen Reihenfolge
	 * @throws IllegalArgumentException wenn ein Key fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<AccessRoleCollection> changeAccessRoleCollectionListingPositions(
			List<String> accessRoleCollectionKeysInOrder) {
		List<AccessRoleCollection> allAccessRoleCollections = doGetAllAccessRoleCollection();
		List<String> existingAccessRoleCollectionKeys = new ArrayList<>();
		for (AccessRoleCollection accessRoleCollection : allAccessRoleCollections) {
			String existingAccessRoleCollectionKey = accessRoleCollection.getKey();
			existingAccessRoleCollectionKeys.add(existingAccessRoleCollectionKey);
		}
		Helper.requireCompleteKeyOrder(accessRoleCollectionKeysInOrder, existingAccessRoleCollectionKeys,
				"keysInOrder");
		for (AccessRoleCollection accessRoleCollection : allAccessRoleCollections) {
			String accessRoleCollectionKey = accessRoleCollection.getKey();
			int newListingPosition = accessRoleCollectionKeysInOrder.indexOf(accessRoleCollectionKey) + 1;
			// verwaltet in dieser Transaktion: Hibernate schreibt die Änderung beim Commit (Dirty Checking)
			accessRoleCollection.setListingPosition(newListingPosition);
		}
		accessRoleCollectionRepository.saveAll(allAccessRoleCollections);
		return doGetAllAccessRoleCollection();
	}

	private AccessRoleCollection doCreateAccessRoleCollection(String accessRoleCollectionKey,
			Map<String, String> displayName) {
		// Eine neue Position kommt ans Ende der Liste.
		int newListingPosition = 1;
		Optional<AccessRoleCollection> lastAccessRoleCollection = accessRoleCollectionRepository
				.findTopByOrderByListingPositionDesc();
		if (lastAccessRoleCollection.isPresent()) {
			int lastListingPosition = lastAccessRoleCollection.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		AccessRoleCollection newAccessRoleCollection = new AccessRoleCollection(accessRoleCollectionKey, displayName,
				newListingPosition);
		return accessRoleCollectionRepository.save(newAccessRoleCollection);
	}

	private boolean doExistsAccessRoleCollection(String accessRoleCollectionKey) {
		return accessRoleCollectionRepository.existsById(accessRoleCollectionKey);
	}

	private AccessRoleCollection doGetAccessRoleCollection(String accessRoleCollectionKey) {
		Optional<AccessRoleCollection> foundAccessRoleCollection = accessRoleCollectionRepository
				.findById(accessRoleCollectionKey);
		if (foundAccessRoleCollection.isEmpty()) {
			throw new EntityNotFoundException("Die Position " + accessRoleCollectionKey + " gibt es nicht.");
		}
		return foundAccessRoleCollection.get();
	}

	private List<AccessRoleCollection> doGetAllAccessRoleCollection() {
		// Die Reihenfolge der Anzeige, bei gleichem Platz nach Key: So springen Listen im Frontend nie.
		return accessRoleCollectionRepository.findAllByOrderByListingPositionAscKeyAsc();
	}
}
