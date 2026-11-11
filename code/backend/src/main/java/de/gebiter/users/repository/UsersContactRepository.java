package de.gebiter.users.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.users.model.UsersContact;
import de.gebiter.users.model.UsersContactType;

/** Repository der Klasse {@link UsersContact}. Nur der {@code UsersContactService} nutzt es. */
public interface UsersContactRepository extends JpaRepository<UsersContact, Long> {

	List<UsersContact> findByUsersGuid(UUID usersGuid);

	Optional<UsersContact> findByUsersGuidAndContactType(UUID usersGuid, UsersContactType contactType);
}
