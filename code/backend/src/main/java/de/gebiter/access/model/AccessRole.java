package de.gebiter.access.model;

import java.util.Map;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Ein einzelnes Recht, identifiziert über seinen eindeutigen {@code key} (keine id). Gebündelt
 * werden Rechte in einer {@link AccessRoleCollection}, und genau eine Collection wird einem User
 * zugewiesen. Einzeln zugewiesen wird ein Recht über {@link AccessRoleUsersAssignment}.
 * <p>
 * Das Admin-Recht legt der Start-Runner in {@code Gebiter9kApplication} an, falls es fehlt. Sein
 * Key steht in {@code application.yaml} unter {@code gebiter.accessrole.*}, nie als Konstante.
 * <p>
 * Doku: {@code docu/entities/AccessRole.md}.
 */
@Entity
@Table(name = "access_role")
public class AccessRole {

	/** Fester technischer Schlüssel des Rechts. Spaltenname mit Präfix, weil {@code key} in SQL ein Schlüsselwort ist. */
	@Id
	@Column(name = "access_role_key", nullable = false, updatable = false, length = 100)
	private String key;

	/**
	 * Mehrsprachiger Anzeigename als JSON mit dem Sprachkürzel als Schlüssel, z. B.
	 * {@code {"de": "Admin"}}. Vorerst gibt es nur {@code de}, die Pflichtsprache steht in
	 * {@code gebiter.language.default-code}.
	 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/**
	 * Platz in der Anzeige, von oben nach unten ab 1. Neue kommen ans Ende, verschoben wird per Drag and Drop
	 * ({@code PUT …/listing-position}). Der Standard 0 gilt nur für Zeilen von vor dieser Spalte.
	 */
	@Column(nullable = false)
	@ColumnDefault("0")
	private int listingPosition;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected AccessRole() {
	}

	public AccessRole(String key, Map<String, String> displayName, int listingPosition) {
		this.key = Helper.requireValidKey(key);
		this.displayName = displayName;
		this.listingPosition = listingPosition;
	}

	public String getKey() {
		return key;
	}

	public Map<String, String> getDisplayName() {
		return displayName;
	}

	public void setDisplayName(Map<String, String> displayName) {
		this.displayName = displayName;
	}

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}
}
