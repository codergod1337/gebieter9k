package de.gebiter.file.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Die Stimme eines Users zu einer Datei: begeistert (cheerUp) oder angewidert (cheerDown). Je User und Datei gibt es
 * höchstens eine Zeile, das sichert die Datenbank selbst; so kann niemand zweimal abstimmen. Wechselt der User die
 * Richtung, wird seine Zeile umgestellt, nimmt er die Stimme zurück, wird sie gelöscht. Die Stimmen sind nicht anonym:
 * Jeder, der die Datei lesen darf, sieht, wer wie gestimmt hat.
 * <p>
 * Im Solr-Dokument der Datei stehen nur die beiden Zähler {@code cheerUpCount} und {@code cheerDownCount} (zum
 * Sortieren); der {@link de.gebiter.file.service.FileCheerService} zählt sie nach jeder Stimme aus dieser Tabelle neu.
 * Lose gekoppelt, ohne JPA-Beziehung: Die Datei ist ein Solr-Dokument, der User nur seine GUID.
 * <p>
 * Doku: {@code docu/entities/FileCheer.md}.
 */
@Entity
@Table(name = "file_cheer", uniqueConstraints = @UniqueConstraint(
		name = "uq_file_cheer", columnNames = { "file_document_id", "users_guid" }))
public class FileCheer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** id der Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. */
	@Column(nullable = false, updatable = false, length = 64)
	private String fileDocumentId;

	/** GUID des Users, der gestimmt hat. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** Begeistert oder angewidert. */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private FileCheerDirection direction;

	/** Wann der User gestimmt hat; wechselt er die Richtung, der Zeitpunkt des Wechsels. */
	@Column(nullable = false)
	private OffsetDateTime cheeredAt;

	/** Nur für JPA. */
	protected FileCheer() {
	}

	public FileCheer(String fileDocumentId, UUID usersGuid, FileCheerDirection direction, OffsetDateTime cheeredAt) {
		this.fileDocumentId = fileDocumentId;
		this.usersGuid = usersGuid;
		this.direction = direction;
		this.cheeredAt = cheeredAt;
	}

	public Long getId() {
		return id;
	}

	public String getFileDocumentId() {
		return fileDocumentId;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public FileCheerDirection getDirection() {
		return direction;
	}

	public void setDirection(FileCheerDirection direction) {
		this.direction = direction;
	}

	public OffsetDateTime getCheeredAt() {
		return cheeredAt;
	}

	public void setCheeredAt(OffsetDateTime cheeredAt) {
		this.cheeredAt = cheeredAt;
	}
}
