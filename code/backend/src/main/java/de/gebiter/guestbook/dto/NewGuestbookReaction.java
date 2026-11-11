package de.gebiter.guestbook.dto;

/**
 * Einen Smiley vergeben: an einen Eintrag ({@code guestbookCommentId} leer) oder an einen seiner Kommentare, dazu das
 * Emoji. Wer reagiert, kommt aus dem Token.
 */
public record NewGuestbookReaction(Long guestbookId, Long guestbookCommentId, String reactionEmoji) {
}
