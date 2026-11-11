package de.gebiter.security.service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.dto.CreatedUsersRefreshToken;
import de.gebiter.security.model.UsersRefreshToken;
import de.gebiter.security.repository.UsersRefreshTokenRepository;
import de.gebiter.util.Helper;

/**
 * Service der Klasse {@link UsersRefreshToken}: die Ketten der Sitzungen, wie in der Vorlage. Er nutzt nur sein eigenes
 * {@link UsersRefreshTokenRepository}. Aufgerufen wird er nur vom {@link SessionService}.
 * <p>
 * Ein User hat höchstens {@code gebiter.login.max-sessions} Sitzungen gleichzeitig, jede auf einem eigenen Platz. Jede
 * Erneuerung tauscht den Token und beginnt die Laufzeit von vorn. Taucht ein verbrauchter Token wieder auf, hat ihn
 * jemand kopiert: Dann werden alle Sitzungen des Users beendet.
 * <p>
 * JEDER FEHLSCHLAG BEKOMMT DIESELBE MELDUNG: unbekannt, abgelaufen und verbraucht sind von außen nicht zu unterscheiden.
 */
@Service
public class UsersRefreshTokenService {

	private static final Logger LOGGER = LoggerFactory.getLogger(UsersRefreshTokenService.class);

	private final UsersRefreshTokenRepository usersRefreshTokenRepository;

	/** Wie lange ein Glied gilt, {@code gebiter.refresh-token.validity}. */
	private final Duration refreshTokenValidity;

	/** Wie viele Sitzungen ein User gleichzeitig haben darf, {@code gebiter.login.max-sessions}. */
	private final int maxSessions;

	/** Byte Zufall je Token, {@code gebiter.login.token-bytes}. */
	private final int tokenBytes;

	public UsersRefreshTokenService(UsersRefreshTokenRepository usersRefreshTokenRepository,
			@Value("${gebiter.refresh-token.validity}") Duration refreshTokenValidity,
			@Value("${gebiter.login.max-sessions}") int maxSessions,
			@Value("${gebiter.login.token-bytes}") int tokenBytes) {
		if (maxSessions < 1) {
			throw new IllegalStateException("gebiter.login.max-sessions muss mindestens 1 sein.");
		}
		this.usersRefreshTokenRepository = usersRefreshTokenRepository;
		this.refreshTokenValidity = refreshTokenValidity;
		this.maxSessions = maxSessions;
		this.tokenBytes = tokenBytes;
	}

	/**
	 * CREATE: Eine neue Sitzung beim Login, als neue Kette auf einem Platz. Der Platz ist der erste freie; sind alle
	 * belegt, der, dessen Sitzung am längsten nicht erneuert wurde. Dessen Kette wird gelöscht: Das alte Gerät verliert
	 * seine Sitzung. Räumt nebenbei die abgelaufenen Glieder des Users weg.
	 *
	 * @return der Token im Klartext für das Cookie und der Platz
	 */
	@Transactional
	public CreatedUsersRefreshToken createUsersRefreshToken(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Instant now = Instant.now();
		usersRefreshTokenRepository.deleteExpiredByUsersGuid(usersGuid, now);
		List<UsersRefreshToken> livingUsersRefreshTokens = usersRefreshTokenRepository
				.findByUsersGuidAndUsedAtIsNullAndExpiresAtAfter(usersGuid, now);
		int sessionNumber = chooseSessionNumber(livingUsersRefreshTokens);
		for (UsersRefreshToken livingUsersRefreshToken : livingUsersRefreshTokens) {
			boolean sameSessionNumber = livingUsersRefreshToken.getSessionNumber() == sessionNumber;
			if (sameSessionNumber) {
				UUID replacedChainGuid = livingUsersRefreshToken.getChainGuid();
				usersRefreshTokenRepository.deleteByChainGuid(replacedChainGuid);
				LOGGER.info("Sitzung {} von User {} ersetzt: alle Plätze belegt, diese am längsten nicht erneuert.",
						sessionNumber, usersGuid);
			}
		}
		UUID chainGuid = UUID.randomUUID();
		String refreshToken = doCreateUsersRefreshToken(usersGuid, chainGuid, sessionNumber, now, 0, now);
		return new CreatedUsersRefreshToken(refreshToken, sessionNumber);
	}

	/**
	 * UPDATE: Verbraucht einen Token beim Erneuern und liefert das verbrauchte Glied (User, Kette, Platz). Danach legt
	 * der Aufrufer mit {@link #createSuccessorUsersRefreshToken(UsersRefreshToken)} den Nachfolger an.
	 * <ul>
	 * <li>unbekannt: 401</li>
	 * <li>abgelaufen: die Kette löschen, 401. Kein Diebstahl, der User war nur lange nicht da.</li>
	 * <li>schon verbraucht, oder ein anderer Request war im selben Moment schneller: Diebstahl. Alle Sitzungen des
	 * Users löschen, 401.</li>
	 * </ul>
	 * {@code noRollbackFor}: Die 401 ist eine RuntimeException und rollte sonst genau das Löschen zurück. Der Aufrufer
	 * braucht dieselbe Regel.
	 *
	 * @throws BadCredentialsException in jedem der Fälle oben
	 */
	@Transactional(noRollbackFor = BadCredentialsException.class)
	public UsersRefreshToken consumeUsersRefreshToken(String refreshToken) {
		boolean refreshTokenMissing = refreshToken == null || refreshToken.isBlank();
		if (refreshTokenMissing) {
			throw createRefreshFailedException();
		}
		String tokenHash = Helper.createSha256Hex(refreshToken);
		Optional<UsersRefreshToken> foundUsersRefreshToken = usersRefreshTokenRepository.findByTokenHash(tokenHash);
		if (foundUsersRefreshToken.isEmpty()) {
			throw createRefreshFailedException();
		}
		UsersRefreshToken usersRefreshToken = foundUsersRefreshToken.get();
		UUID usersGuid = usersRefreshToken.getUsersGuid();
		Instant now = Instant.now();

		// Abgelaufen ist normal (zwei Wochen nicht da), kein Diebstahl. Deshalb steht diese Prüfung zuerst.
		Instant expiresAt = usersRefreshToken.getExpiresAt();
		boolean expired = !expiresAt.isAfter(now);
		if (expired) {
			UUID expiredChainGuid = usersRefreshToken.getChainGuid();
			usersRefreshTokenRepository.deleteByChainGuid(expiredChainGuid);
			throw createRefreshFailedException();
		}
		Instant usedAt = usersRefreshToken.getUsedAt();
		if (usedAt != null) {
			doDeleteAllUsersRefreshTokenAfterTheft(usersGuid, "ein schon verbrauchter Token tauchte wieder auf");
			throw createRefreshFailedException();
		}
		Long id = usersRefreshToken.getId();
		int markedUsersRefreshTokenCount = usersRefreshTokenRepository.markUsedIfUnused(id, now);
		if (markedUsersRefreshTokenCount == 0) {
			doDeleteAllUsersRefreshTokenAfterTheft(usersGuid, "derselbe Token wurde gleichzeitig zweimal benutzt");
			throw createRefreshFailedException();
		}
		return usersRefreshToken;
	}

	/**
	 * CREATE: Der Nachfolger eines verbrauchten Glieds in derselben Kette: gleicher User, gleicher Platz, gleicher
	 * Beginn der Sitzung, eine Erneuerung mehr, wieder volle Laufzeit.
	 *
	 * @return der Token im Klartext für das Cookie
	 */
	@Transactional
	public String createSuccessorUsersRefreshToken(UsersRefreshToken consumedUsersRefreshToken) {
		Helper.requireNotNull(consumedUsersRefreshToken, "consumedUsersRefreshToken");
		UUID usersGuid = consumedUsersRefreshToken.getUsersGuid();
		UUID chainGuid = consumedUsersRefreshToken.getChainGuid();
		int sessionNumber = consumedUsersRefreshToken.getSessionNumber();
		Instant sessionStartedAt = consumedUsersRefreshToken.getSessionStartedAt();
		int consumedRefreshCount = consumedUsersRefreshToken.getRefreshCount();
		int refreshCount = consumedRefreshCount + 1;
		Instant now = Instant.now();
		return doCreateUsersRefreshToken(usersGuid, chainGuid, sessionNumber, sessionStartedAt, refreshCount, now);
	}

	/**
	 * DELETE: Logout, die Kette dieses Geräts löschen. Fehlt der Token oder ist er unbekannt, passiert nichts.
	 *
	 * @return das Glied, über das die Kette gefunden wurde (wer, welche Sitzung), {@code null} wenn nichts gelöscht wurde
	 */
	@Transactional
	public UsersRefreshToken deleteUsersRefreshTokenChain(String refreshToken) {
		boolean refreshTokenMissing = refreshToken == null || refreshToken.isBlank();
		if (refreshTokenMissing) {
			return null;
		}
		String tokenHash = Helper.createSha256Hex(refreshToken);
		Optional<UsersRefreshToken> foundUsersRefreshToken = usersRefreshTokenRepository.findByTokenHash(tokenHash);
		if (foundUsersRefreshToken.isEmpty()) {
			return null;
		}
		UsersRefreshToken usersRefreshToken = foundUsersRefreshToken.get();
		UUID chainGuid = usersRefreshToken.getChainGuid();
		usersRefreshTokenRepository.deleteByChainGuid(chainGuid);
		return usersRefreshToken;
	}

	/**
	 * Der Platz für eine neue Sitzung: der erste freie von 1 bis {@code maxSessions}. Sind alle belegt, der Platz,
	 * dessen aktuelles Glied am ältesten ist, also der am längsten nicht erneuert wurde.
	 */
	private int chooseSessionNumber(List<UsersRefreshToken> livingUsersRefreshTokens) {
		Set<Integer> takenSessionNumbers = new HashSet<>();
		for (UsersRefreshToken livingUsersRefreshToken : livingUsersRefreshTokens) {
			int takenSessionNumber = livingUsersRefreshToken.getSessionNumber();
			takenSessionNumbers.add(takenSessionNumber);
		}
		for (int sessionNumber = 1; sessionNumber <= maxSessions; sessionNumber++) {
			boolean sessionNumberTaken = takenSessionNumbers.contains(sessionNumber);
			if (!sessionNumberTaken) {
				return sessionNumber;
			}
		}
		// Alle Plätze belegt, die Liste ist also nicht leer (maxSessions ist mindestens 1).
		UsersRefreshToken longestUnrefreshedUsersRefreshToken = livingUsersRefreshTokens.get(0);
		for (UsersRefreshToken livingUsersRefreshToken : livingUsersRefreshTokens) {
			Instant livingCreatedAt = livingUsersRefreshToken.getCreatedAt();
			Instant longestUnrefreshedCreatedAt = longestUnrefreshedUsersRefreshToken.getCreatedAt();
			boolean older = livingCreatedAt.isBefore(longestUnrefreshedCreatedAt);
			if (older) {
				longestUnrefreshedUsersRefreshToken = livingUsersRefreshToken;
			}
		}
		return longestUnrefreshedUsersRefreshToken.getSessionNumber();
	}

	/** Legt ein Glied an und liefert den Token im Klartext; gespeichert wird nur sein SHA-256. */
	private String doCreateUsersRefreshToken(UUID usersGuid, UUID chainGuid, int sessionNumber, Instant sessionStartedAt,
			int refreshCount, Instant now) {
		String refreshToken = Helper.createRandomLoginToken(tokenBytes);
		String tokenHash = Helper.createSha256Hex(refreshToken);
		Instant expiresAt = now.plus(refreshTokenValidity);
		UsersRefreshToken newUsersRefreshToken = new UsersRefreshToken(tokenHash, usersGuid, chainGuid, sessionNumber,
				sessionStartedAt, refreshCount, now, expiresAt);
		usersRefreshTokenRepository.save(newUsersRefreshToken);
		return refreshToken;
	}

	/** Diebstahl: alle Sitzungen des Users löschen und ins Log schreiben. Die 401 wirft der Aufrufer. */
	private void doDeleteAllUsersRefreshTokenAfterTheft(UUID usersGuid, String reason) {
		int deletedUsersRefreshTokenCount = usersRefreshTokenRepository.deleteByUsersGuid(usersGuid);
		LOGGER.warn("Refresh-Token von User {} wiederverwendet ({}): alle Sitzungen beendet, {} Glieder gelöscht.",
				usersGuid, reason, deletedUsersRefreshTokenCount);
	}

	private BadCredentialsException createRefreshFailedException() {
		return new BadCredentialsException("Die Sitzung ist abgelaufen oder unbekannt. Bitte neu anmelden.");
	}
}
