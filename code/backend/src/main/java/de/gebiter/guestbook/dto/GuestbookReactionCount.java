package de.gebiter.guestbook.dto;

/** Ein Emoji an einem Eintrag oder Kommentar: wie oft, und ob der angemeldete User es selbst vergeben hat. */
public record GuestbookReactionCount(String reactionEmoji, long reactionCount, boolean reactedByCurrentUsers) {
}
