package de.gebiter.users.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.users.model.UsersFriendRequest;

/**
 * Datenzugriff auf {@link UsersFriendRequest}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.users.service.UsersFriendRequestService}.
 */
public interface UsersFriendRequestRepository extends JpaRepository<UsersFriendRequest, Long> {

	/** Gibt es einen offenen Antrag von {@code requesterUsersGuid} an {@code acceptorUsersGuid}? */
	boolean existsByRequesterUsersGuidAndAcceptorUsersGuidAndAcceptedIsNull(UUID requesterUsersGuid,
			UUID acceptorUsersGuid);

	/** Die offenen Anträge, die ein User gestellt hat. */
	List<UsersFriendRequest> findByRequesterUsersGuidAndAcceptedIsNullOrderByRequestedAtDesc(UUID requesterUsersGuid);

	/** Die offenen Anträge an einen User. */
	List<UsersFriendRequest> findByAcceptorUsersGuidAndAcceptedIsNullOrderByRequestedAtDesc(UUID acceptorUsersGuid);
}
