package de.gebiter.users.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.model.UsersFriendRequest;
import de.gebiter.users.repository.UsersFriendRequestRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link UsersFriendRequest}, der Freundschaftsanträge. Er nutzt nur sein eigenes
 * {@link UsersFriendRequestRepository}; ob es den Empfänger gibt, fragt er den {@link UsersService}, die Freundschaft
 * selbst schreibt der {@link UsersFriendshipService}. Jeder stellt und beantwortet nur eigene Anträge, die GUID kommt
 * aus dem Token.
 */
@Service
public class UsersFriendRequestService {

	private final UsersFriendRequestRepository usersFriendRequestRepository;

	private final UsersService usersService;

	private final UsersFriendshipService usersFriendshipService;

	private final CurrentUsersProvider currentUsersProvider;

	public UsersFriendRequestService(UsersFriendRequestRepository usersFriendRequestRepository,
			UsersService usersService, UsersFriendshipService usersFriendshipService,
			CurrentUsersProvider currentUsersProvider) {
		this.usersFriendRequestRepository = usersFriendRequestRepository;
		this.usersService = usersService;
		this.usersFriendshipService = usersFriendshipService;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE: Der angemeldete User stellt einen Antrag an {@code acceptorUsersGuid}.
	 *
	 * @throws IllegalArgumentException wenn die GUID fehlt, es den User nicht gibt oder er sich selbst fragt
	 * @throws DuplicateKeyException wenn die beiden schon befreundet sind oder schon ein offener Antrag zwischen ihnen
	 *         steht, in welcher Richtung auch immer
	 */
	@Transactional
	public UsersFriendRequest createOwnUsersFriendRequest(UUID acceptorUsersGuid) {
		usersService.checkUsersExists(acceptorUsersGuid, "acceptorUsersGuid");
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		boolean requestToSelf = acceptorUsersGuid.equals(currentUsersGuid);
		if (requestToSelf) {
			throw new IllegalArgumentException("Mit dir selbst kannst du nicht befreundet sein.");
		}
		boolean alreadyFriends = usersFriendshipService.existsUsersFriendship(currentUsersGuid, acceptorUsersGuid);
		if (alreadyFriends) {
			throw new DuplicateKeyException("Ihr seid schon befreundet.");
		}
		boolean ownRequestOpen = usersFriendRequestRepository
				.existsByRequesterUsersGuidAndAcceptorUsersGuidAndAcceptedIsNull(currentUsersGuid, acceptorUsersGuid);
		if (ownRequestOpen) {
			throw new DuplicateKeyException("Dein Antrag an diesen User ist noch offen.");
		}
		boolean reverseRequestOpen = usersFriendRequestRepository
				.existsByRequesterUsersGuidAndAcceptorUsersGuidAndAcceptedIsNull(acceptorUsersGuid, currentUsersGuid);
		if (reverseRequestOpen) {
			throw new DuplicateKeyException("Dieser User hat dir schon einen Antrag gestellt, nimm ihn an.");
		}
		Instant now = Instant.now();
		UsersFriendRequest newUsersFriendRequest = new UsersFriendRequest(currentUsersGuid, acceptorUsersGuid, now);
		return usersFriendRequestRepository.save(newUsersFriendRequest);
	}

	/** READ: Die offenen Anträge des angemeldeten Users: erst die an ihn, dann die von ihm, jeweils die neuesten zuerst. */
	@Transactional(readOnly = true)
	public List<UsersFriendRequest> getOwnOpenUsersFriendRequest() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		List<UsersFriendRequest> incomingUsersFriendRequests = usersFriendRequestRepository
				.findByAcceptorUsersGuidAndAcceptedIsNullOrderByRequestedAtDesc(currentUsersGuid);
		List<UsersFriendRequest> outgoingUsersFriendRequests = usersFriendRequestRepository
				.findByRequesterUsersGuidAndAcceptedIsNullOrderByRequestedAtDesc(currentUsersGuid);
		List<UsersFriendRequest> openUsersFriendRequests = new ArrayList<>(incomingUsersFriendRequests);
		openUsersFriendRequests.addAll(outgoingUsersFriendRequests);
		return openUsersFriendRequests;
	}

	/**
	 * UPDATE: Der Empfänger beantwortet einen Antrag mit ja oder nein. Bei ja werden die beiden Freunde, in beiden
	 * Freundeslisten.
	 *
	 * @throws IllegalArgumentException wenn die id fehlt oder der Antrag schon beantwortet ist
	 * @throws EntityNotFoundException wenn es den Antrag nicht gibt oder er nicht an den angemeldeten User ging
	 */
	@Transactional
	public UsersFriendRequest answerOwnUsersFriendRequest(Long id, boolean accepted) {
		Helper.requireNotNull(id, "id");
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Optional<UsersFriendRequest> foundUsersFriendRequest = usersFriendRequestRepository.findById(id);
		if (foundUsersFriendRequest.isEmpty()) {
			throw createUsersFriendRequestNotFoundException();
		}
		UsersFriendRequest existingUsersFriendRequest = foundUsersFriendRequest.get();
		UUID acceptorUsersGuid = existingUsersFriendRequest.getAcceptorUsersGuid();
		boolean addressedToCurrentUsers = acceptorUsersGuid.equals(currentUsersGuid);
		if (!addressedToCurrentUsers) {
			// Wie „gibt es nicht“: Fremde Anträge verrät der Endpunkt nicht
			throw createUsersFriendRequestNotFoundException();
		}
		boolean alreadyAnswered = existingUsersFriendRequest.getAccepted() != null;
		if (alreadyAnswered) {
			throw new IllegalArgumentException("Der Antrag ist schon beantwortet.");
		}
		existingUsersFriendRequest.setAccepted(accepted);
		UsersFriendRequest savedUsersFriendRequest = usersFriendRequestRepository.save(existingUsersFriendRequest);
		if (accepted) {
			UUID requesterUsersGuid = existingUsersFriendRequest.getRequesterUsersGuid();
			usersFriendshipService.createUsersFriendship(requesterUsersGuid, acceptorUsersGuid);
		}
		return savedUsersFriendRequest;
	}

	private EntityNotFoundException createUsersFriendRequestNotFoundException() {
		return new EntityNotFoundException("Den Antrag gibt es nicht.");
	}
}
