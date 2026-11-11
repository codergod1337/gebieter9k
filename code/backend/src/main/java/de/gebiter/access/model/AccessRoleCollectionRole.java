package de.gebiter.access.model;

import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Welche {@link AccessRole} zu welcher {@link AccessRoleCollection} gehört: Ein Eintrag ist ein
 * Recht in einer Collection, verknüpft über die Keys. Je Collection ist jedes Recht höchstens
 * einmal enthalten. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/AccessRoleCollectionRole.md}.
 */
@Entity
@Table(name = "access_role_collection_role", uniqueConstraints = @UniqueConstraint(
		name = "uq_access_role_collection_role", columnNames = { "access_role_collection_key", "access_role_key" }))
public class AccessRoleCollectionRole {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Key der Position (AccessRoleCollection), die das Recht verleiht. */
	@Column(nullable = false, updatable = false, length = 100)
	private String accessRoleCollectionKey;

	/** Key des Rechts (AccessRole), das die Position verleiht. */
	@Column(nullable = false, updatable = false, length = 100)
	private String accessRoleKey;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected AccessRoleCollectionRole() {
	}

	public AccessRoleCollectionRole(String accessRoleCollectionKey, String accessRoleKey) {
		this.accessRoleCollectionKey = Helper.requireValidKey(accessRoleCollectionKey);
		this.accessRoleKey = Helper.requireValidKey(accessRoleKey);
	}

	public Long getId() {
		return id;
	}

	public String getAccessRoleCollectionKey() {
		return accessRoleCollectionKey;
	}

	public String getAccessRoleKey() {
		return accessRoleKey;
	}
}
