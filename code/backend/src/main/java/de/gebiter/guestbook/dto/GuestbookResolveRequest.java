package de.gebiter.guestbook.dto;

import java.util.UUID;

/** Eine Seite des Gästebuchs eines Users, ab 0. */
public record GuestbookResolveRequest(UUID profileUsersGuid, int page) {
}
