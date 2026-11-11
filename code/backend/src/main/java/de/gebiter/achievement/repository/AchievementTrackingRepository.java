package de.gebiter.achievement.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.achievement.model.AchievementTracking;
import de.gebiter.achievement.model.AchievementTrackingKey;

/** Das Protokoll für Achievements; nur der {@link de.gebiter.achievement.service.AchievementTrackingService} nutzt es. */
public interface AchievementTrackingRepository extends JpaRepository<AchievementTracking, Long> {

	/** Die jüngste Zeile eines Users zu einer Art, über den Index (users_guid, tracking_key, occurred_at). */
	Optional<AchievementTracking> findFirstByUsersGuidAndTrackingKeyOrderByOccurredAtDescIdDesc(UUID usersGuid,
			AchievementTrackingKey trackingKey);

	/** Die jüngste Zeile eines Users zu einer Art mit dieser Menge, z. B. 0 = der Beginn der aktuellen Serie. */
	Optional<AchievementTracking> findFirstByUsersGuidAndTrackingKeyAndAmountOrderByOccurredAtDescIdDesc(UUID usersGuid,
			AchievementTrackingKey trackingKey, long amount);

	/** Alle Zeilen einer Art seit einem Zeitpunkt, z. B. wer in den letzten Minuten da war (nach einem Neustart). */
	List<AchievementTracking> findByTrackingKeyAndOccurredAtAfter(AchievementTrackingKey trackingKey, Instant occurredAfter);
}
