package de.gebiter.guestbook.model;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Ein Eintrag im Gästebuch eines Users: wer ihn wo geschrieben hat und was. Einträge werden nie geändert, nur gelöscht
 * (Vorgabe des Nutzers 2026-11-09); mit ihnen gehen ihre Kommentare und Smileys.
 * <p>
 * Lose gekoppelt, ohne JPA-Beziehung: {@code profileUsersGuid} ist der User, in dessen Gästebuch
 * der Eintrag steht, {@code authorUsersGuid} der User, der ihn geschrieben hat.
 * <p>
 * Doku: {@code docu/entities/Guestbook.md}.
 */
@Entity
@Table(name = "guestbook")
public class Guestbook {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** GUID des Users, in dessen Gästebuch der Eintrag steht. */
	@Column(nullable = false, updatable = false)
	private UUID profileUsersGuid;

	/** GUID des Users, der den Eintrag geschrieben hat. */
	@Column(nullable = false, updatable = false)
	private UUID authorUsersGuid;

	/**
	 * Der Eintrag als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML aus dem Rich-Text-Editor, z. B.
	 * {@code {"de": "<p>Hallo!</p>"}} (Nutzer 2026-11-09; vorerst nur Deutsch).
	 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> entryText;

	/** Wann der Eintrag geschrieben wurde. */
	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private OffsetDateTime writtenAt;

	/** Nur für JPA. */
	protected Guestbook() {
	}

	public Guestbook(UUID profileUsersGuid, UUID authorUsersGuid, Map<String, String> entryText) {
		this.profileUsersGuid = profileUsersGuid;
		this.authorUsersGuid = authorUsersGuid;
		this.entryText = entryText;
	}

	public Long getId() {
		return id;
	}

	public UUID getProfileUsersGuid() {
		return profileUsersGuid;
	}

	public UUID getAuthorUsersGuid() {
		return authorUsersGuid;
	}

	public Map<String, String> getEntryText() {
		return entryText;
	}

	public OffsetDateTime getWrittenAt() {
		return writtenAt;
	}
}
