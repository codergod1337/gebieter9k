package de.gebiter.users.dto;

import de.gebiter.users.model.UsersContactType;

/** Eine eigene Kontaktangabe löschen. */
public record OwnUsersContactDeleteRequest(UsersContactType contactType) {
}
