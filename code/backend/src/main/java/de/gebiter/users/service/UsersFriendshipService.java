package de.gebiter.users.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.model.UsersFriendship;
import de.gebiter.users.repository.UsersFriendshipRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link UsersFriendship}, der beidseitigen Freundeslisten. Er nutzt nur sein eigenes
 * {@link UsersFriendshipRepository}.
 * <p>
 * DIE FREUNDESLISTEN LIEGEN IM HAUPTSPEICHER (Vorgabe des Nutzers 2026-11-09): Bei jedem Login und jedem Token-Refresh
 * lädt der {@code SessionService} die Liste des Users neu, der {@link CurrentUsersProvider} liest sie von hier, ohne
 * Postgres. Annehmen und Kündigen ziehen die Listen beider User nach dem Commit sofort nach, damit eine gekündigte
 * Freundschaft nicht bis zum nächsten Refresh weiterwirkt. Nach einem Neustart des Backends ist der Speicher leer; das
 * schadet nicht, denn der Schlüssel der JWTs ist dann neu, jeder User refresht und lädt dabei seine Liste.
 */
@Service
public class UsersFriendshipService {

	private final UsersFriendshipRepository usersFriendshipRepository;

	private final CurrentUsersProvider currentUsersProvider;

	/** GUID eines Users → GUIDs seiner Freunde, geladen bei Login und Refresh. */
	private final Map<UUID, List<UUID>> friendUsersGuidsByUsersGuid = new ConcurrentHashMap<>();

	public UsersFriendshipService(UsersFriendshipRepository usersFriendshipRepository,
			CurrentUsersProvider currentUsersProvider) {
		this.usersFriendshipRepository = usersFriendshipRepository;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE: Macht zwei User zu Freunden, in beiden Freundeslisten. Ein Eintrag, den es schon gibt, bleibt. Nur der
	 * {@link UsersFriendRequestService} ruft das, nachdem der Empfänger einen Antrag angenommen hat.
	 *
	 * @throws IllegalArgumentException wenn eine GUID fehlt oder beide gleich sind
	 */
	@Transactional
	public void createUsersFriendship(UUID firstUsersGuid, UUID secondUsersGuid) {
		Helper.requireNotNull(firstUsersGuid, "firstUsersGuid");
		Helper.requireNotNull(secondUsersGuid, "secondUsersGuid");
		boolean sameUsers = firstUsersGuid.equals(secondUsersGuid);
		if (sameUsers) {
			throw new IllegalArgumentException("Mit sich selbst kann niemand befreundet sein.");
		}
		doCreateUsersFriendshipEntry(firstUsersGuid, secondUsersGuid);
		doCreateUsersFriendshipEntry(secondUsersGuid, firstUsersGuid);
		reloadFriendUsersGuidsAfterCommit(firstUsersGuid, secondUsersGuid);
	}

	/** READ: Sind die beiden befreundet? Aus Postgres, für die Prüfung eines neuen Antrags. */
	@Transactional(readOnly = true)
	public boolean existsUsersFriendship(UUID usersGuid, UUID friendUsersGuid) {
		return usersFriendshipRepository.existsByUsersGuidAndFriendUsersGuid(usersGuid, friendUsersGuid);
	}

	/**
	 * READ (Login, Refresh): Lädt die Freundesliste eines Users aus Postgres in den Hauptspeicher und ersetzt den alten
	 * Stand. Nur der {@code SessionService} ruft das, beim Ausstellen jedes Tokens.
	 */
	@Transactional(readOnly = true)
	public void loadFriendUsersGuidsIntoMemory(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		doLoadFriendUsersGuidsIntoMemory(usersGuid);
	}

	/**
	 * READ: Die Freundesliste eines Users aus dem Hauptspeicher, ohne Postgres. Leer, wenn er keine Freunde hat. Für den
	 * {@link CurrentUsersProvider} und damit für den Lesefilter jeder Suche.
	 */
	public List<UUID> getFriendUsersGuidsFromMemory(UUID usersGuid) {
		List<UUID> friendUsersGuids = friendUsersGuidsByUsersGuid.get(usersGuid);
		if (friendUsersGuids == null) {
			return List.of();
		}
		return friendUsersGuids;
	}

	/** READ: Die eigene Freundesliste, aus dem Hauptspeicher. */
	public List<UUID> getOwnFriendUsersGuids() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		return getFriendUsersGuidsFromMemory(currentUsersGuid);
	}

	/**
	 * DELETE: Kündigt die eigene Freundschaft mit {@code friendUsersGuid}, beidseitig: Beide verlieren den Eintrag, also
	 * zwei Schreibvorgänge. Danach stehen die Listen beider User sofort neu im Speicher.
	 *
	 * @throws IllegalArgumentException wenn die GUID fehlt
	 * @throws EntityNotFoundException wenn die beiden nicht befreundet sind
	 */
	@Transactional
	public void deleteOwnUsersFriendship(UUID friendUsersGuid) {
		Helper.requireNotNull(friendUsersGuid, "friendUsersGuid");
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		long deletedOwnEntryCount = usersFriendshipRepository.deleteByUsersGuidAndFriendUsersGuid(currentUsersGuid,
				friendUsersGuid);
		long deletedFriendEntryCount = usersFriendshipRepository.deleteByUsersGuidAndFriendUsersGuid(friendUsersGuid,
				currentUsersGuid);
		boolean nothingDeleted = deletedOwnEntryCount == 0 && deletedFriendEntryCount == 0;
		if (nothingDeleted) {
			throw new EntityNotFoundException("Ihr seid nicht befreundet.");
		}
		reloadFriendUsersGuidsAfterCommit(currentUsersGuid, friendUsersGuid);
	}

	private void doCreateUsersFriendshipEntry(UUID usersGuid, UUID friendUsersGuid) {
		boolean entryExists = usersFriendshipRepository.existsByUsersGuidAndFriendUsersGuid(usersGuid, friendUsersGuid);
		if (entryExists) {
			return;
		}
		UsersFriendship newUsersFriendship = new UsersFriendship(usersGuid, friendUsersGuid);
		usersFriendshipRepository.save(newUsersFriendship);
	}

	private void doLoadFriendUsersGuidsIntoMemory(UUID usersGuid) {
		List<UsersFriendship> usersFriendships = usersFriendshipRepository.findByUsersGuid(usersGuid);
		List<UUID> friendUsersGuids = new ArrayList<>();
		for (UsersFriendship usersFriendship : usersFriendships) {
			UUID friendUsersGuid = usersFriendship.getFriendUsersGuid();
			friendUsersGuids.add(friendUsersGuid);
		}
		List<UUID> unchangeableFriendUsersGuids = List.copyOf(friendUsersGuids);
		friendUsersGuidsByUsersGuid.put(usersGuid, unchangeableFriendUsersGuids);
	}

	/** Lädt die Listen beider User neu, sobald die Änderung in Postgres steht. */
	private void reloadFriendUsersGuidsAfterCommit(UUID firstUsersGuid, UUID secondUsersGuid) {
		boolean insideTransaction = TransactionSynchronizationManager.isSynchronizationActive();
		if (!insideTransaction) {
			doLoadFriendUsersGuidsIntoMemory(firstUsersGuid);
			doLoadFriendUsersGuidsIntoMemory(secondUsersGuid);
			return;
		}
		TransactionSynchronization reloadAfterCommit = new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				doLoadFriendUsersGuidsIntoMemory(firstUsersGuid);
				doLoadFriendUsersGuidsIntoMemory(secondUsersGuid);
			}
		};
		TransactionSynchronizationManager.registerSynchronization(reloadAfterCommit);
	}
}
