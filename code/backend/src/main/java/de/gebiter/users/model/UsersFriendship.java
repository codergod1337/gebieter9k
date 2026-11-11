package de.gebiter.users.model;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Ein Eintrag in der Freundesliste eines Users: {@code usersGuid} hat {@code friendUsersGuid} als Freund. Freundschaft
 * ist beidseitig (Vorgabe des Nutzers 2026-11-09): Jede Freundschaft steht zweimal da, einmal je Richtung. Das ist
 * doppelt, aber jeder User bekommt seine ganze Liste mit einer Abfrage nach seiner GUID. Kündigen löscht beide Zeilen.
 * Je User und Freund nur einmal. Wer die Liste sehen darf, steht in {@link Users#getFriendListVisibility()}. Lose
 * gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/UsersFriendship.md}.
 */
@Entity
@Table(name = "users_friendship", uniqueConstraints = @UniqueConstraint(
		name = "uq_users_friendship_users_friend", columnNames = { "users_guid", "friend_users_guid" }))
public class UsersFriendship {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** GUID des Users, dem die Liste gehört. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** GUID des Freundes. */
	@Column(nullable = false, updatable = false)
	private UUID friendUsersGuid;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected UsersFriendship() {
	}

	public UsersFriendship(UUID usersGuid, UUID friendUsersGuid) {
		this.usersGuid = usersGuid;
		this.friendUsersGuid = friendUsersGuid;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public UUID getFriendUsersGuid() {
		return friendUsersGuid;
	}
}
