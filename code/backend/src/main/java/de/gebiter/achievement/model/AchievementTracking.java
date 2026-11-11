package de.gebiter.achievement.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Eine Zeile im universellen Protokoll für Achievements (Nutzer 2026-11-09): was ein User getan hat, mit dem
 * Kontrollcounter danach. Jede neue Zeile ist der einzige Anlass, Achievements zu prüfen; geprüft wird der Sprung von
 * {@code runningValue - amount} auf {@code runningValue}, ein Zählen über das Protokoll gibt es nie. Zeilen werden nie
 * geändert.
 * <p>
 * Doku: {@code docu/entities/AchievementTracking.md}.
 */
@Entity
@Table(name = "achievement_tracking", indexes = @Index(name = "achievement_tracking_users_tracking_key_occurred_at",
		columnList = "users_guid, tracking_key, occurred_at"))
public class AchievementTracking {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Wessen Zähler. */
	@Column(name = "users_guid", nullable = false, updatable = false)
	private UUID usersGuid;

	/** Was gezählt wird. */
	@Enumerated(EnumType.STRING)
	@Column(name = "tracking_key", nullable = false, updatable = false, length = 50)
	private AchievementTrackingKey trackingKey;

	/** Was dieses Ereignis dazugibt, z. B. 902 Sekunden Online-Zeit; 0 beim Beginn einer neuen Serie. */
	@Column(nullable = false, updatable = false)
	private long amount;

	/** Der Kontrollcounter nach diesem Ereignis, z. B. Sekunden am Stück; daran misst sich jede Schwelle. */
	@Column(nullable = false, updatable = false)
	private long runningValue;

	/** Wann, immer von der Uhr des Servers. */
	@Column(name = "occurred_at", nullable = false, updatable = false)
	private Instant occurredAt;

	/** Nur für JPA. */
	protected AchievementTracking() {
	}

	public AchievementTracking(UUID usersGuid, AchievementTrackingKey trackingKey, long amount, long runningValue,
			Instant occurredAt) {
		this.usersGuid = usersGuid;
		this.trackingKey = trackingKey;
		this.amount = amount;
		this.runningValue = runningValue;
		this.occurredAt = occurredAt;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public AchievementTrackingKey getTrackingKey() {
		return trackingKey;
	}

	public long getAmount() {
		return amount;
	}

	public long getRunningValue() {
		return runningValue;
	}

	public Instant getOccurredAt() {
		return occurredAt;
	}
}
