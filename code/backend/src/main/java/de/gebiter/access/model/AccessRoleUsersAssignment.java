package de.gebiter.access.model;

import java.util.UUID;

import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Welche {@link AccessRole} welchem User zugewiesen ist: Ein Eintrag ist ein Recht an einem User. Ein
 * User kann beliebig viele Rechte haben, jedes höchstens einmal.
 * <p>
 * n:1 zu {@code Users} über {@code usersGuid} und n:1 zu {@link AccessRole} über
 * {@code accessRoleKey}. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/AccessRoleUsersAssignment.md}.
 */
@Entity
@Table(name = "access_role_users_assignment", uniqueConstraints = @UniqueConstraint(
		name = "uq_access_role_users_assignment", columnNames = { "users_guid", "access_role_key" }))
public class AccessRoleUsersAssignment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** GUID des Users, dem das Recht einzeln zugewiesen ist. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** Key des einzeln zugewiesenen Rechts (AccessRole). */
	@Column(nullable = false, updatable = false, length = 100)
	private String accessRoleKey;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected AccessRoleUsersAssignment() {
	}

	public AccessRoleUsersAssignment(UUID usersGuid, String accessRoleKey) {
		this.usersGuid = usersGuid;
		this.accessRoleKey = Helper.requireValidKey(accessRoleKey);
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public String getAccessRoleKey() {
		return accessRoleKey;
	}
}
