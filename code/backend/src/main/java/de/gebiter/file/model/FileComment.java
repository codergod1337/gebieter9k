package de.gebiter.file.model;

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
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Ein Kommentar eines Users zu einer Datei, z. B. zu einem Bild einer Galerie (Nutzer 2026-11-20, Konzept
 * {@code docu/konzept-galerie-freigabe.md}, Abschnitt 7). Die Kommentare einer Datei bilden einen Verlauf in der
 * Reihenfolge {@code writtenAt}, die ältesten zuerst. Nie geändert, nur gelöscht. Kommentieren darf, wer die Datei lesen
 * darf; lesen auch ein Besucher über den Link einer Galerie-Freigabe.
 * <p>
 * Lose gekoppelt, ohne JPA-Beziehung: Die Datei ist ein Solr-Dokument, der Autor nur seine GUID. Wird die Datei
 * endgültig gelöscht, gehen ihre Kommentare mit ({@link de.gebiter.file.service.FileCommentService}).
 * <p>
 * Doku: {@code docu/entities/FileComment.md}.
 */
@Entity
@Table(name = "file_comment", indexes = @Index(name = "ix_file_comment_file_document_id", columnList = "file_document_id"))
public class FileComment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** id der Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. */
	@Column(nullable = false, updatable = false, length = 64)
	private String fileDocumentId;

	/** GUID des Users, der den Kommentar geschrieben hat. */
	@Column(nullable = false, updatable = false)
	private UUID authorUsersGuid;

	/**
	 * Der Kommentar als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML aus dem Rich-Text-Editor (wie im
	 * Gästebuch; vorerst nur Deutsch), höchstens {@code gebiter.file.comment-text-max-length} Zeichen sichtbarer Text.
	 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, updatable = false, columnDefinition = "jsonb")
	private Map<String, String> commentText;

	/** Wann der Kommentar geschrieben wurde. */
	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private OffsetDateTime writtenAt;

	/** Nur für JPA. */
	protected FileComment() {
	}

	public FileComment(String fileDocumentId, UUID authorUsersGuid, Map<String, String> commentText) {
		this.fileDocumentId = fileDocumentId;
		this.authorUsersGuid = authorUsersGuid;
		this.commentText = commentText;
	}

	public Long getId() {
		return id;
	}

	public String getFileDocumentId() {
		return fileDocumentId;
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
