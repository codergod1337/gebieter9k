package de.gebiter.users.model;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;

import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Das Passwort eines Users – nur setzbar und prüfbar, nie lesbar.
 * <p>
 * Ablauf: Das Frontend hasht das Passwort mit SHA-256 und schickt den Hex-Wert. So kennt das
 * Backend nie das eigentliche Passwort. Gespeichert wird davon nur ein BCrypt-Hash.
 * <p>
 * Der Hash verlässt diese Klasse nie: kein Getter, kein Setter, kein {@code toString()}. Es gibt
 * nur {@link #changePassword} (Setzen, auch für den Admin-Reset) und {@link #matchesPassword}
 * (Vergleich). Ein Auslesen oder Exportieren des Passworts gibt es nirgends und wird nicht gebaut.
 * <p>
 * 1:1 zu {@link Users}: {@code usersGuid} ist der Primärschlüssel und enthält die GUID des
 * zugehörigen Users. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/UsersCredential.md}.
 */
@Entity
@Table(name = "users_credential")
public class UsersCredential {

	/** GUID des Users, zugleich Primärschlüssel (1:1 zu Users). */
	@Id
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** BCrypt-Hash (immer 60 Zeichen) des SHA-256-Hex-Werts. {@code null}, solange kein Passwort gesetzt ist. */
	@Column(length = 60)
	private String passwordHash;

	/** Nur für JPA. */
	protected UsersCredential() {
	}

	public UsersCredential(UUID usersGuid) {
		this.usersGuid = usersGuid;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	/**
	 * Setzt das Passwort neu – beim ersten Setzen und beim Reset durch einen Admin.
	 *
	 * @param sha256HexPassword das Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text
	 * @throws IllegalArgumentException wenn kein SHA-256-Hex-Wert übergeben wird
	 */
	public void changePassword(String sha256HexPassword, PasswordEncoder passwordEncoder) {
		String lowerCaseSha256HexPassword = Helper.requireSha256Hex(sha256HexPassword);
		passwordHash = passwordEncoder.encode(lowerCaseSha256HexPassword);
	}

	/**
	 * Stimmt der übergebene Wert mit dem gespeicherten Passwort überein? Ohne gesetztes Passwort
	 * und bei einem Wert, der kein SHA-256-Hex-Wert ist, immer {@code false}.
	 *
	 * @param sha256HexPassword das Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text
	 */
	public boolean matchesPassword(String sha256HexPassword, PasswordEncoder passwordEncoder) {
		if (passwordHash == null) {
			return false;
		}
		if (!Helper.isSha256Hex(sha256HexPassword)) {
			return false;
		}
		String lowerCaseSha256HexPassword = Helper.requireSha256Hex(sha256HexPassword);
		return passwordEncoder.matches(lowerCaseSha256HexPassword, passwordHash);
	}
}
