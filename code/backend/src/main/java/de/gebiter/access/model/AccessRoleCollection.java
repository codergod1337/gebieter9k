package de.gebiter.access.model;

import java.util.Map;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import de.gebiter.badge.model.BadgeLook;
import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Eine Position: eine Bündelung von {@link AccessRole}s, identifiziert über ihren eindeutigen {@code key} (keine id).
 * Ein User hat höchstens eine Position ({@code Users.accessRoleCollectionKey}), dazu direkt zugewiesene Rechte. Welche
 * Rechte eine Position verleiht, steht in {@link AccessRoleCollectionRole}. Der Rang ist etwas anderes (nur Anzeige).
 * Das Badge ist eine Pille, ihr Aussehen steht im {@link BadgeLook}.
 * <p>
 * Die Start-Collection neuer User steht in {@code application.yaml} unter
 * {@code gebiter.accessrolecollection.default-key}, nie als Konstante.
 * <p>
 * Doku: {@code docu/entities/AccessRoleCollection.md}.
 */
@Entity
@Table(name = "access_role_collection")
public class AccessRoleCollection {

	/** Fester technischer Schlüssel der Collection. Spaltenname mit Präfix, weil {@code key} in SQL ein Schlüsselwort ist. */
	@Id
	@Column(name = "access_role_collection_key", nullable = false, updatable = false, length = 100)
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

	/** Das Aussehen der Pille, {@code null}: Standard aus {@code base.css}. */
	@Embedded
	private BadgeLook badgeLook;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected AccessRoleCollection() {
	}

	public AccessRoleCollection(String key, Map<String, String> displayName, int listingPosition) {
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

	public BadgeLook getBadgeLook() {
		return badgeLook;
	}

	public void setBadgeLook(BadgeLook badgeLook) {
		this.badgeLook = badgeLook;
	}
}
