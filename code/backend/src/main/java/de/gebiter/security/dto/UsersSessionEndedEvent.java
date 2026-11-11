package de.gebiter.security.dto;

import java.util.UUID;

/**
 * Ein User hat sich abgemeldet: Die Sitzung ist beendet. Läuft keine andere Sitzung mehr, ist er sofort offline
 * (Nutzer 2026-11-09). Veröffentlicht vom {@code SessionService}, verarbeitet vom {@code AchievementTrackingService}.
 *
 * @param usersGuid wer
 * @param sessionNumber welche Sitzung
 */
public record UsersSessionEndedEvent(UUID usersGuid, int sessionNumber) {
}
