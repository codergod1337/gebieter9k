package de.gebiter.guestbook.dto;

import java.util.Map;

/** Einen Kommentar schreiben: unter welchen Eintrag und was. Der Autor kommt aus dem Token. */
public record NewGuestbookComment(Long guestbookId, Map<String, String> commentText) {
}
