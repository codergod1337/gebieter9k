package de.gebiter.achievement.dto;

import java.time.Instant;

/**
 * Ob ein User gerade online ist, für sein Profil. Kein „zuletzt online“ (Nutzer 2026-11-09: kein Stasi-Tracking).
 *
 * @param online gerade da
 * @param onlineSince seit wann am Stück, {@code null} wenn offline
 */
public record UsersOnlineStatus(boolean online, Instant onlineSince) {
}
