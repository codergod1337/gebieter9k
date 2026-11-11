package de.gebiter.achievement.dto;

import java.time.Instant;

/**
 * Ein erreichtes Achievement eines Users zusammengefasst, für die Box im Profil.
 *
 * @param achievementKey welches
 * @param achievedCount wie oft abgeschlossen (bei einmaligen 1)
 * @param firstAchievedAt der erste Abschluss
 * @param lastAchievedAt der letzte Abschluss
 */
public record UsersAchievementSummary(String achievementKey, Long achievedCount, Instant firstAchievedAt,
		Instant lastAchievedAt) {
}
