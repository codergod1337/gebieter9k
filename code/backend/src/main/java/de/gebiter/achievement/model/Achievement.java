package de.gebiter.achievement.model;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import de.gebiter.badge.model.BadgeLook;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Ein Achievement, ähnlich wie bei Steam: ein Abzeichen, das man sich freischaltet, z. B. „Knipsgott“ für 1000
 * hochgeladene Bilder, und das man später im Profilbanner zeigt. Unabhängig von Rang und Position. Das Badge ist ein
 * Medaillon, sein Aussehen steht im {@link BadgeLook}: Gewöhnliche sehen schlicht aus, seltene richtig nach Bling-Bling.
 * <p>
 * Wie man es freischaltet (Shop, Tätigkeiten) und wer welches hat, kommt später. Bis dahin steht die Bedingung als Text
 * in der Beschreibung.
 * <p>
 * Doku: {@code docu/entities/Achievement.md}.
 */
@Entity
@Table(name = "achievement")
public class Achievement {

	/** Fester technischer Schlüssel, Key-Regel, z. B. {@code KNIPSGOTT}. */
	@Id
	@Column(name = "achievement_key", nullable = false, updatable = false, length = 100)
	private String key;

	/** Mehrsprachiger Anzeigename als JSON, z. B. {@code {"de": "Knipsgott"}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/** Mehrsprachig wie der Name: wofür es das Achievement gibt, z. B. {@code {"de": "1000 Bilder hochgeladen."}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, String> description;

	/** Platz in der Anzeige, von oben nach unten ab 1. Neue kommen ans Ende, verschoben wird per Drag and Drop. */
	@Column(nullable = false)
	private int listingPosition;

	/** Das Aussehen des Medaillons, {@code null}: Standard aus {@code base.css}. */
	@Embedded
	private BadgeLook badgeLook;

	/**
	 * Woran es hängt (Nutzer 2026-11-09): die Art im Protokoll {@code achievement_tracking}, deren Kontrollcounter bei
	 * jeder neuen Zeile gegen {@link #thresholdValue} geprüft wird. {@code null}: wird nur von Hand vergeben.
	 */
	@Enumerated(EnumType.STRING)
	@Column(length = 50)
	private AchievementTrackingKey trackingKey;

	/** Ab diesem Stand des Kontrollcounters ist es erreicht, z. B. 3600 (Sekunden) für eine Stunde online. */
	private Long thresholdValue;

	/** Wiederholbar: jedes weitere Vielfache der Schwelle ist ein weiterer Abschluss; sonst genau einmal. */
	@Column(nullable = false, columnDefinition = "boolean default false")
	private boolean repeatable;

	/** So viele Punkte kommen je Abschluss aufs Punktekonto ({@code Users.points}), ab 0. */
	@Column(nullable = false, columnDefinition = "bigint default 0")
	private long rewardPoints;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected Achievement() {
	}

	public Achievement(String key, Map<String, String> displayName, Map<String, String> description,
			int listingPosition, BadgeLook badgeLook, AchievementTrackingKey trackingKey, Long thresholdValue,
			boolean repeatable, long rewardPoints) {
		this.key = key;
		this.displayName = displayName;
		this.description = description;
		this.listingPosition = listingPosition;
		this.badgeLook = badgeLook;
		this.trackingKey = trackingKey;
		this.thresholdValue = thresholdValue;
		this.repeatable = repeatable;
		this.rewardPoints = rewardPoints;
	}

	public String getKey() {
		return key;
	}

	public Map<String, String> getDisplayName() {
		return displayName;
	}

	public void setDisplayName(Map<String, String> displayName) {
		this.displayName = displayName;
	}

	public Map<String, String> getDescription() {
		return description;
	}

	public void setDescription(Map<String, String> description) {
		this.description = description;
	}

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}

	public BadgeLook getBadgeLook() {
		return badgeLook;
	}

	public void setBadgeLook(BadgeLook badgeLook) {
		this.badgeLook = badgeLook;
	}

	public AchievementTrackingKey getTrackingKey() {
		return trackingKey;
	}

	public void setTrackingKey(AchievementTrackingKey trackingKey) {
		this.trackingKey = trackingKey;
	}

	public Long getThresholdValue() {
		return thresholdValue;
	}

	public void setThresholdValue(Long thresholdValue) {
		this.thresholdValue = thresholdValue;
	}

	public boolean isRepeatable() {
		return repeatable;
	}

	public void setRepeatable(boolean repeatable) {
		this.repeatable = repeatable;
	}

	public long getRewardPoints() {
		return rewardPoints;
	}

	public void setRewardPoints(long rewardPoints) {
		this.rewardPoints = rewardPoints;
	}
}
