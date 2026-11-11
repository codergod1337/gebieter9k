package de.gebiter.users.dto;

import de.gebiter.status.model.Visibility;
import de.gebiter.users.model.UsersContactType;

/** Eine eigene Kontaktangabe setzen: welche Art, der Wert und wer sie sehen darf. */
public record OwnUsersContactSaveRequest(UsersContactType contactType, String contactValue, Visibility visibility) {
}
