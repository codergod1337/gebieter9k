package de.gebiter.users.dto;

import java.util.UUID;

/** Eine eigene Freundschaft kündigen: mit wem. Gelöscht wird in beiden Richtungen. */
public record UsersFriendshipDeleteRequest(UUID friendUsersGuid) {
}
