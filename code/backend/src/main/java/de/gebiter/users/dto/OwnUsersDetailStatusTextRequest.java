package de.gebiter.users.dto;

/** Den eigenen Status-Text im Profilkopf setzen. Leer oder {@code null} entfernt ihn. */
public record OwnUsersDetailStatusTextRequest(String statusText) {
}
