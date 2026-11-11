package de.gebiter.point.model;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Eine Tätigkeit, für die es Punkte gibt (Nutzer 2026-11-09), z. B. einen Gästebucheintrag schreiben. Der Admin pflegt,
 * wie viele Punkte sie bringt; das gilt nie rückwirkend, denn jede Buchung schreibt den Betrag beim Buchen fest. Welche
 * Tätigkeiten der Code auslöst, steht in {@code gebiter.point-activity.*}; der Start-Runner legt sie an, wenn sie fehlen.
 * <p>
 * Doku: {@code docu/entities/PointActivity.md}.
 */
@Entity
@Table(name = "point_activity")
public class PointActivity {

	/** Fester technischer Schlüssel, Key-Regel, z. B. {@code GUESTBOOK_ENTRY_WRITTEN}. */
	@Id
	@Column(name = "point_activity_key", nullable = false, updatable = false, length = 100)
	private String key;

	/** Mehrsprachiger Anzeigename, z. B. {@code {"de": "Gästebucheintrag geschrieben"}}; so steht es im Kontoauszug. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/** Mehrsprachige Beschreibung: wann es die Punkte gibt; darf fehlen. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, String> description;

	/** So viele Punkte bringt die Tätigkeit ab jetzt, ab 0 (0: keine). */
	@Column(nullable = false)
	private long rewardPoints;

	/** Platz in der Anzeige, ab 1, per Drag and Drop. */
	@Column(nullable = false)
	private int listingPosition;

	/** Nur für JPA. */
	protected PointActivity() {
	}

	public PointActivity(String key, Map<String, String> displayName, Map<String, String> description,
			long rewardPoints, int listingPosition) {
		this.key = key;
		this.displayName = displayName;
		this.description = description;
		this.rewardPoints = rewardPoints;
		this.listingPosition = listingPosition;
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

	public long getRewardPoints() {
		return rewardPoints;
	}

	public void setRewardPoints(long rewardPoints) {
		this.rewardPoints = rewardPoints;
	}

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}
}
