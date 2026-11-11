package de.gebiter.users.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.users.model.UsersPointBooking;
import de.gebiter.users.model.UsersPointBookingReason;

/** Das Kontobuch der Punkte; nur der {@link de.gebiter.users.service.UsersPointBookingService} nutzt es. */
public interface UsersPointBookingRepository extends JpaRepository<UsersPointBooking, Long> {

	boolean existsByBookingReasonAndReferenceKeyAndReferenceId(UsersPointBookingReason bookingReason,
			String referenceKey, String referenceId);

	/** Eine Seite der Buchungen eines Users, die neuesten zuerst (über den Index users_guid, booked_at). */
	Page<UsersPointBooking> findByUsersGuidOrderByBookedAtDescIdDesc(UUID usersGuid, Pageable pageable);
}
