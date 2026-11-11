package de.gebiter.achievement.dto;

/**
 * Wie viele User gerade online sind, für den Header.
 *
 * @param onlineUsersCount User mit einem Check-in in den letzten {@code gebiter.achievement.online-presence.max-gap}
 */
public record OnlineUsersCount(long onlineUsersCount) {
}
