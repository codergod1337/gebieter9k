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
 * Ein Glied der Kette einer Sitzung: der Teil, der eine Anmeldung über das kurze JWT hinaus trägt und sich widerrufen
 * lässt. Der Token selbst ist ein Zufallswert im HttpOnly-Cookie, hier steht nur sein SHA-256.
 * <p>
 * Jede Erneuerung verbraucht das Glied ({@code usedAt}) und legt ein neues in derselben Kette an. Verbrauchte Glieder
 * bleiben bis zu ihrem Ablauf stehen: Taucht ein verbrauchter Token wieder auf, hat ihn jemand kopiert, und alle
 * Sitzungen des Users werden beendet.
 * <p>
 * Doku: {@code docu/entities/UsersRefreshToken.md}.
 */
@Entity
@Table(name = "users_refresh_token")
public class UsersRefreshToken {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** SHA-256 des Tokens als Hex-Text. */
	@Column(nullable = false, unique = true, updatable = false, length = 64)
	private String tokenHash;

	/** GUID des Users, dem die Sitzung gehört. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** Die Kette: alle Glieder einer Sitzung, vom Login bis zur letzten Erneuerung. */
	@Column(nullable = false, updatable = false)
	private UUID chainGuid;

	/** Der Platz der Sitzung, 1 bis {@code gebiter.login.max-sessions}. */
	@Column(nullable = false, updatable = false)
	private int sessionNumber;

	/** Wann die Sitzung mit dem Login begann, in jedem Glied der Kette gleich. */
	@Column(nullable = false, updatable = false)
	private Instant sessionStartedAt;

	/** Wie oft die Sitzung bis zu diesem Glied erneuert wurde, 0 beim Login. */
	@Column(nullable = false, updatable = false)
	private int refreshCount;

	/** Wann dieses Glied ausgestellt wurde, beim Login oder bei einer Verlängerung. */
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	/** Bis wann dieses Glied gilt; danach braucht der User einen neuen Login. */
	@Column(nullable = false, updatable = false)
	private Instant expiresAt;

	/** Wann das Glied gegen ein neues getauscht wurde, {@code null}: noch nicht. */
	private Instant usedAt;

	/** Für JPA. */
	protected UsersRefreshToken() {
	}

	public UsersRefreshToken(String tokenHash, UUID usersGuid, UUID chainGuid, int sessionNumber,
			Instant sessionStartedAt, int refreshCount, Instant createdAt, Instant expiresAt) {
		this.tokenHash = tokenHash;
		this.usersGuid = usersGuid;
		this.chainGuid = chainGuid;
		this.sessionNumber = sessionNumber;
		this.sessionStartedAt = sessionStartedAt;
		this.refreshCount = refreshCount;
		this.createdAt = createdAt;
		this.expiresAt = expiresAt;
	}

	public Long getId() {
		return id;
	}

	public String getTokenHash() {
		return tokenHash;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public UUID getChainGuid() {
		return chainGuid;
	}

	public int getSessionNumber() {
		return sessionNumber;
	}

	public Instant getSessionStartedAt() {
		return sessionStartedAt;
	}

	public int getRefreshCount() {
		return refreshCount;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getUsedAt() {
		return usedAt;
	}
}
