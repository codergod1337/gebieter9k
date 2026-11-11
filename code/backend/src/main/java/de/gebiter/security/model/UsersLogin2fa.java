package de.gebiter.security.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Die Wartezeile der 2FA zwischen „Passwort stimmt“ und „angemeldet“. Der Anmeldeschein ({@code loginToken}) bleibt im
 * Fenster mit dem Passwort; mit ihm holt es beim Einrichten QR-Code und Schlüssel und löst am Ende mit dem Code aus der
 * Authenticator-App die Sitzung ein. Ohne gültigen Code gibt es keine Sitzung (seit 2026-11-08 Pflicht, der simulierte
 * Bestätigungslink ist weg).
 * <p>
 * Gespeichert wird nur der SHA-256 des Scheins, ein Auszug der Datenbank enthält nichts Benutzbares. Lebenslauf:
 * anlegen beim Passwort, {@code failedCodeCount} bei jedem falschen Code, löschen beim Einlösen oder nach zu vielen
 * falschen Codes.
 * <p>
 * Doku: {@code docu/entities/UsersLogin2fa.md}.
 */
@Entity
@Table(name = "users_login_2fa")
public class UsersLogin2fa {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** SHA-256 des Anmeldescheins als Hex-Text. */
	@Column(nullable = false, unique = true, updatable = false, length = 64)
	private String loginTokenHash;

	/** Wem die Sitzung gehören wird. Lose gekoppelt an {@code Users.guid}. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** Ab hier gilt die Zeile nicht mehr ({@code gebiter.login.two-factor-validity} nach dem Anlegen). */
	@Column(nullable = false, updatable = false)
	private Instant expiresAt;

	/** So viele falsche Codes kamen schon; ab {@code gebiter.login.max-failed-codes} ist die Zeile weg. Setzt das Repository. */
	@Column(nullable = false)
	private int failedCodeCount;

	/** Nur für JPA. */
	protected UsersLogin2fa() {
	}

	public UsersLogin2fa(String loginTokenHash, UUID usersGuid, Instant expiresAt) {
		this.loginTokenHash = loginTokenHash;
		this.usersGuid = usersGuid;
		this.expiresAt = expiresAt;
	}

	public Long getId() {
		return id;
	}

	public String getLoginTokenHash() {
		return loginTokenHash;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public int getFailedCodeCount() {
		return failedCodeCount;
	}
}
