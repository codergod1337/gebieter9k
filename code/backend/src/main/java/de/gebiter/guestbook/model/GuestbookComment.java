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
 * Ein Kommentar unter einem Gästebucheintrag. Die Kommentare eines Eintrags bilden einen Verlauf in der Reihenfolge
 * {@code writtenAt}, wie Rückfrage und Rückantwort beim To-do-Job: der Besitzer des Gästebuchs und andere User im
 * Wechsel. Nie geändert, nur gelöscht; mit ihm gehen seine Smileys. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/GuestbookComment.md}.
 */
@Entity
@Table(name = "guestbook_comment")
public class GuestbookComment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** id des Eintrags, unter dem der Kommentar steht. */
	@Column(nullable = false, updatable = false)
	private Long guestbookId;

	/** GUID des Users, der den Kommentar geschrieben hat. */
	@Column(nullable = false, updatable = false)
	private UUID authorUsersGuid;

	/**
	 * Der Kommentar als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML aus dem Rich-Text-Editor
	 * (Nutzer 2026-11-09; vorerst nur Deutsch).
	 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, updatable = false, columnDefinition = "jsonb")
	private Map<String, String> commentText;

	/** Wann der Kommentar geschrieben wurde. */
	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private OffsetDateTime writtenAt;

	/** Nur für JPA. */
	protected GuestbookComment() {
	}

	public GuestbookComment(Long guestbookId, UUID authorUsersGuid, Map<String, String> commentText) {
		this.guestbookId = guestbookId;
		this.authorUsersGuid = authorUsersGuid;
		this.commentText = commentText;
	}

	public Long getId() {
		return id;
	}

	public Long getGuestbookId() {
		return guestbookId;
	}

	public UUID getAuthorUsersGuid() {
		return authorUsersGuid;
	}

	public Map<String, String> getCommentText() {
		return commentText;
	}

	public OffsetDateTime getWrittenAt() {
		return writtenAt;
	}
}
