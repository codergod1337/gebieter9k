package de.gebiter.users.model;

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
 * Freigeschaltete Profil-Features eines Users: Ein Eintrag ist ein Feature, das er sich z. B.
 * durch ein Achievement verdient hat. Je User ist jedes Feature höchstens einmal freigeschaltet.
 * <p>
 * n:1 zu {@link Users} über {@code usersGuid}. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/UsersProfileFeature.md}.
 */
@Entity
@Table(name = "users_profile_feature", uniqueConstraints = @UniqueConstraint(
		name = "uq_users_profile_feature_users_feature", columnNames = { "users_guid", "feature_key" }))
public class UsersProfileFeature {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** GUID des Users, dem das Feature freigeschaltet ist. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** Schlüssel des freigeschalteten Features. */
	@Column(nullable = false, updatable = false, length = 100)
	private String featureKey;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected UsersProfileFeature() {
	}

	public UsersProfileFeature(UUID usersGuid, String featureKey) {
		this.usersGuid = usersGuid;
		this.featureKey = Helper.requireValidKey(featureKey);
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public String getFeatureKey() {
		return featureKey;
	}
}
