package de.gebiter.guestbook.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Ein Smiley auf einen Gästebucheintrag oder einen seiner Kommentare (Vorgabe des Nutzers 2026-11-09): nur in eine
 * Richtung, nicht zurücknehmbar. Ein User darf mehrere verschiedene Emojis an dasselbe Ziel hängen, dasselbe Emoji je
 * Ziel nur einmal (prüft der Service). Gelöscht wird ein Smiley nur mit seinem Eintrag bzw. Kommentar. Lose gekoppelt,
 * ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/GuestbookReaction.md}.
 */
@Entity
@Table(name = "guestbook_reaction")
public class GuestbookReaction {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** id des Eintrags; auch bei einem Smiley auf einen Kommentar, damit eine Seite alle Smileys auf einmal lädt. */
	@Column(nullable = false, updatable = false)
	private Long guestbookId;

	/** id des Kommentars, {@code null} bei einem Smiley auf den Eintrag selbst. */
	@Column(updatable = false)
	private Long guestbookCommentId;

	/** GUID des Users, der reagiert hat. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** Das Emoji selbst, ein Standard-Emoji (geprüft über {@code Helper.requireSingleEmoji}). */
	@Column(nullable = false, updatable = false, length = 32)
	private String reactionEmoji;

	/** Wann der Smiley vergeben wurde. */
	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private OffsetDateTime reactedAt;

	/** Nur für JPA. */
	protected GuestbookReaction() {
	}

	public GuestbookReaction(Long guestbookId, Long guestbookCommentId, UUID usersGuid, String reactionEmoji) {
		this.guestbookId = guestbookId;
		this.guestbookCommentId = guestbookCommentId;
		this.usersGuid = usersGuid;
		this.reactionEmoji = reactionEmoji;
	}

	public Long getId() {
		return id;
	}

	public Long getGuestbookId() {
		return guestbookId;
	}

	public Long getGuestbookCommentId() {
		return guestbookCommentId;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public String getReactionEmoji() {
		return reactionEmoji;
	}

	public OffsetDateTime getReactedAt() {
		return reactedAt;
	}
}
