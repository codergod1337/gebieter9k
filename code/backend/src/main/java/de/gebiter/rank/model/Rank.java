package de.gebiter.rank.model;

import java.util.Map;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import de.gebiter.badge.model.BadgeLook;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Ein Rang der Rangleiter, von Stufe 1 (Leibeigener) bis Stufe 50 (General des Schreckens). Ein Rang ist kein Recht und
 * keine Position: Die AccessRoleCollections bilden die Zugänge ab, ein Rang ist nur Anzeige. Man erarbeitet ihn sich mit
 * Punkten: Ein User hat den höchsten Rang, dessen {@link #minimumPoints} er erreicht. Das Badge hat sein Aussehen im
 * {@link BadgeLook}: unten schlicht, oben immer edler.
 * <p>
 * Doku: {@code docu/entities/Rank.md}.
 */
@Entity
@Table(name = "rank")
public class Rank {

	/** Fester technischer Schlüssel, Key-Regel, z. B. {@code RAUBRITTER}. Spaltenname mit Präfix wie bei den Rechten. */
	@Id
	@Column(name = "rank_key", nullable = false, updatable = false, length = 100)
	private String key;

	/** Mehrsprachiger Anzeigename als JSON, z. B. {@code {"de": "Raubritter"}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/**
	 * Die Stufe in der Leiter, ab 1, jede nur einmal vergeben. Je höher, desto weiter oben. Neue kommen oben drauf,
	 * verschoben wird per Drag and Drop ({@code PUT /api/admin/rank/level}).
	 */
	@Column(nullable = false, unique = true)
	private int level;

	/** So viele Punkte ({@code Users.points}) braucht man mindestens für diesen Rang, ab 0. */
	@Column(nullable = false)
	@ColumnDefault("0")
	private long minimumPoints;

	/** Das Aussehen des Rang-Badges, {@code null}: Standard aus {@code base.css}. */
	@Embedded
	private BadgeLook badgeLook;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected Rank() {
	}

	public Rank(String key, Map<String, String> displayName, int level, long minimumPoints, BadgeLook badgeLook) {
		this.key = key;
		this.displayName = displayName;
		this.level = level;
		this.minimumPoints = minimumPoints;
		this.badgeLook = badgeLook;
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

	public int getLevel() {
		return level;
	}

	public void setLevel(int level) {
		this.level = level;
	}

	public long getMinimumPoints() {
		return minimumPoints;
	}

	public void setMinimumPoints(long minimumPoints) {
		this.minimumPoints = minimumPoints;
	}

	public BadgeLook getBadgeLook() {
		return badgeLook;
	}

	public void setBadgeLook(BadgeLook badgeLook) {
		this.badgeLook = badgeLook;
	}
}
