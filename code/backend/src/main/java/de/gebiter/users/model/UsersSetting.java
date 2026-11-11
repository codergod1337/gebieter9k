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
 * Eine Einstellung eines Users als Schlüssel-Wert-Paar: seine Preferences, z. B. das Theme oder
 * Einstellungen je Tabelle. Je User gibt es jeden Schlüssel höchstens einmal.
 * <p>
 * n:1 zu {@link Users} über {@code usersGuid}. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/UsersSetting.md}.
 */
@Entity
@Table(name = "users_setting", uniqueConstraints = @UniqueConstraint(
		name = "uq_users_setting_users_key", columnNames = { "users_guid", "setting_key" }))
public class UsersSetting {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** GUID des Users, dem die Einstellung gehört. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** Spaltenname mit Präfix, weil {@code key} in SQL ein Schlüsselwort ist. */
	@Column(name = "setting_key", nullable = false, updatable = false, length = 100)
	private String settingKey;

	/** Der Wert der Einstellung als Text, z. B. die Spaltenbreiten einer Tabelle. */
	@Column(name = "setting_value", columnDefinition = "text")
	private String settingValue;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected UsersSetting() {
	}

	public UsersSetting(UUID usersGuid, String settingKey, String settingValue) {
		this.usersGuid = usersGuid;
		this.settingKey = Helper.requireValidKey(settingKey);
		this.settingValue = settingValue;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public String getSettingKey() {
		return settingKey;
	}

	public String getSettingValue() {
		return settingValue;
	}

	public void setSettingValue(String settingValue) {
		this.settingValue = settingValue;
	}
}
