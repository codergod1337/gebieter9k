package de.gebiter.achievement.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Ein erreichtes Achievement eines Users (Nutzer 2026-11-09): wer, welches, wann. Ein wiederholbares Achievement steht
 * je Abschluss einmal da. Wird nur angelegt, nie geändert.
 * <p>
 * Doku: {@code docu/entities/UsersAchievement.md}.
 */
@Entity
@Table(name = "users_achievement", indexes = @Index(name = "users_achievement_users_guid", columnList = "users_guid"))
public class UsersAchievement {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Wessen Abschluss. */
	@Column(name = "users_guid", nullable = false, updatable = false)
	private UUID usersGuid;

	/** Welches Achievement, sein Key. */
	@Column(nullable = false, updatable = false, length = 100)
	private String achievementKey;

	/** Wann erreicht: der Zeitpunkt der Protokollzeile, die es ausgelöst hat. */
	@Column(nullable = false, updatable = false)
	private Instant achievedAt;

	/** Die Zeile in {@code achievement_tracking}, die es ausgelöst hat, zum Nachvollziehen. */
	@Column(updatable = false)
	private Long achievementTrackingId;

	/** Nur für JPA. */
	protected UsersAchievement() {
	}

	public UsersAchievement(UUID usersGuid, String achievementKey, Instant achievedAt, Long achievementTrackingId) {
		this.usersGuid = usersGuid;
		this.achievementKey = achievementKey;
		this.achievedAt = achievedAt;
		this.achievementTrackingId = achievementTrackingId;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public String getAchievementKey() {
		return achievementKey;
	}

	public Instant getAchievedAt() {
		return achievedAt;
	}

	public Long getAchievementTrackingId() {
		return achievementTrackingId;
	}
}
