package de.gebiter.users.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Ein Freundschaftsantrag, die ganze Anfrage in einer Tabelle (Vorgabe des Nutzers 2026-11-09): wer fragt
 * ({@code requesterUsersGuid}), wer annimmt oder ablehnt ({@code acceptorUsersGuid}), wann gefragt wurde und die Antwort.
 * {@code accepted} ist {@code null}, solange der Antrag offen ist, danach ja oder nein. Nimmt der Empfänger an, entsteht
 * die Freundschaft in beiden Freundeslisten ({@link UsersFriendship}). Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/UsersFriendRequest.md}.
 */
@Entity
@Table(name = "users_friend_request")
public class UsersFriendRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** GUID des Users, der fragt. */
	@Column(nullable = false, updatable = false)
	private UUID requesterUsersGuid;

	/** GUID des Users, der annimmt oder ablehnt. */
	@Column(nullable = false, updatable = false)
	private UUID acceptorUsersGuid;

	/** Wann gefragt wurde. */
	@Column(nullable = false, updatable = false)
	private Instant requestedAt;

	/** Die Antwort: {@code null} offen, {@code true} angenommen, {@code false} abgelehnt. */
	private Boolean accepted;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected UsersFriendRequest() {
	}

	public UsersFriendRequest(UUID requesterUsersGuid, UUID acceptorUsersGuid, Instant requestedAt) {
		this.requesterUsersGuid = requesterUsersGuid;
		this.acceptorUsersGuid = acceptorUsersGuid;
		this.requestedAt = requestedAt;
	}

	public Long getId() {
		return id;
	}

	public UUID getRequesterUsersGuid() {
		return requesterUsersGuid;
	}

	public UUID getAcceptorUsersGuid() {
		return acceptorUsersGuid;
	}

	public Instant getRequestedAt() {
		return requestedAt;
	}

	public Boolean getAccepted() {
		return accepted;
	}

	public void setAccepted(Boolean accepted) {
		this.accepted = accepted;
	}
}
