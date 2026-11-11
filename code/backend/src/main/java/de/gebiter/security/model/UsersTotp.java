package de.gebiter.security.model;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Die Authenticator-App (TOTP) eines Users: das gemeinsame Geheimnis, verschlüsselt, und ob es bestätigt ist. Höchstens
 * ein Eintrag je User. Das Geheimnis verlässt das Backend nur einmal, beim Einrichten (QR-Code); keine Methode liefert
 * es danach aus.
 * <p>
 * Dazu die Sperre beim Login (Vorgabe des Nutzers 2026-11-08): Falsche Codes am Stück zählen über alle Anmeldungen
 * hinweg; nach {@code gebiter.totp.max-failed-codes-in-a-row} ist der Code für {@code gebiter.totp.lock-duration}
 * gesperrt, auch ein richtiger. Ein angenommener Code setzt den Zähler zurück.
 * <p>
 * Doku: {@code docu/entities/UsersTotp.md}.
 */
@Entity
@Table(name = "users_totp")
public class UsersTotp {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** GUID des Users, dem das TOTP gehört; je User höchstens eins. */
	@Column(nullable = false, unique = true, updatable = false)
	private UUID usersGuid;

	/** Das Geheimnis, mit AES-GCM verschlüsselt (Schlüssel aus der .env), als Base64. */
	@Column(nullable = false, length = 200)
	private String secretEncrypted;

	/** Wann der erste Code bestätigt wurde; {@code null}: Einrichtung läuft noch. */
	private Instant confirmedAt;

	/** Der 30-Sekunden-Schritt des zuletzt angenommenen Codes: Derselbe Code gilt nie zweimal. */
	private Long lastUsedTimeStep;

	/** Wann das TOTP eingerichtet wurde. */
	@Column(nullable = false)
	private Instant createdAt;

	/** Falsche Codes am Stück beim Login. Standard 0, damit vorhandene Zeilen die neue Spalte bekommen. */
	@Column(nullable = false)
	@ColumnDefault("0")
	private int failedCodeCount;

	/** Bis wann der Login keinen Code annimmt; {@code null}: nicht gesperrt. */
	private Instant codeLockedUntil;

	/** Für JPA. */
	protected UsersTotp() {
	}

	public UsersTotp(UUID usersGuid, String secretEncrypted, Instant createdAt) {
		this.usersGuid = usersGuid;
		this.secretEncrypted = secretEncrypted;
		this.createdAt = createdAt;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public String getSecretEncrypted() {
		return secretEncrypted;
	}

	public Instant getConfirmedAt() {
		return confirmedAt;
	}

	public Long getLastUsedTimeStep() {
		return lastUsedTimeStep;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public int getFailedCodeCount() {
		return failedCodeCount;
	}

	public Instant getCodeLockedUntil() {
		return codeLockedUntil;
	}

	/** Nimmt der Login gerade keinen Code an? */
	public boolean isCodeLocked(Instant now) {
		return codeLockedUntil != null && codeLockedUntil.isAfter(now);
	}

	/**
	 * Ein falscher Code beim Login. Beim letzten erlaubten beginnt die Sperre, und der Zähler fängt danach wieder bei 0 an.
	 *
	 * @return {@code true}, wenn damit die Sperre beginnt
	 */
	public boolean recordFailedCode(Instant now, int maxFailedCodesInARow, Duration lockDuration) {
		this.failedCodeCount = this.failedCodeCount + 1;
		if (this.failedCodeCount < maxFailedCodesInARow) {
			return false;
		}
		this.codeLockedUntil = now.plus(lockDuration);
		this.failedCodeCount = 0;
		return true;
	}

	/** Wie weit die Einrichtung ist. */
	public UsersTotpState getState() {
		if (confirmedAt == null) {
			return UsersTotpState.PENDING;
		}
		return UsersTotpState.ACTIVE;
	}

	/** Neues Einrichten, solange noch nichts bestätigt ist: neues Geheimnis, der alte QR-Code gilt nicht mehr. */
	public void replacePendingSecret(String newSecretEncrypted, Instant newCreatedAt) {
		this.secretEncrypted = newSecretEncrypted;
		this.createdAt = newCreatedAt;
		this.lastUsedTimeStep = null;
	}

	/** Der erste Code hat gepasst: ab jetzt aktiv, Fehlversuche vergessen. */
	public void confirm(Instant newConfirmedAt, long usedTimeStep) {
		this.confirmedAt = newConfirmedAt;
		this.lastUsedTimeStep = usedTimeStep;
		resetFailedCodes();
	}

	/** Ein Code wurde angenommen: dieser Schritt und alle davor gelten nicht mehr, Fehlversuche vergessen. */
	public void markTimeStepUsed(long usedTimeStep) {
		this.lastUsedTimeStep = usedTimeStep;
		resetFailedCodes();
	}

	private void resetFailedCodes() {
		this.failedCodeCount = 0;
		this.codeLockedUntil = null;
	}
}
