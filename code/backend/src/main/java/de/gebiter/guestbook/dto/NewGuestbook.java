package de.gebiter.guestbook.dto;

import java.util.Map;
import java.util.UUID;

/** Einen Eintrag schreiben: in wessen Gästebuch und was. Der Autor kommt aus dem Token. */
public record NewGuestbook(UUID profileUsersGuid, Map<String, String> entryText) {
}
