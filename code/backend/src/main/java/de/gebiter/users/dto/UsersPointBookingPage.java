package de.gebiter.users.dto;

import java.util.List;

import de.gebiter.users.model.UsersPointBooking;

/**
 * Eine Seite des eigenen Kontoauszugs: der aktuelle Stand und die Buchungen, die neuesten zuerst.
 *
 * @param pointBalance der Kontostand ({@code Users.points})
 * @param bookings die Buchungen dieser Seite
 * @param totalCount alle Buchungen des Kontos
 * @param page die Seite, ab 0
 * @param pageSize Buchungen je Seite ({@code gebiter.users-point-booking.page-size})
 */
public record UsersPointBookingPage(long pointBalance, List<UsersPointBooking> bookings, long totalCount, int page,
		int pageSize) {
}
