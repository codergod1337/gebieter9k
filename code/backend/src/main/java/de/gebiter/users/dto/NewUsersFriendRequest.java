package de.gebiter.users.dto;

import java.util.UUID;

/** Einen Freundschaftsantrag stellen: an wen. Wer fragt, kommt aus dem Token. */
public record NewUsersFriendRequest(UUID acceptorUsersGuid) {
}
