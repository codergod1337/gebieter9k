package de.gebiter.users.dto;

/** Einen Freundschaftsantrag beantworten: welcher Antrag und ja oder nein. */
public record UsersFriendRequestAnswer(Long id, boolean accepted) {
}
