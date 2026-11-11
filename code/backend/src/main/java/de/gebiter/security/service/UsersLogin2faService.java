package de.gebiter.security.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.dto.CreatedUsersLogin2fa;
import de.gebiter.security.dto.UsersTotpCodeRedemption;
import de.gebiter.security.dto.UsersTotpSetup;
import de.gebiter.security.model.UsersLogin2fa;
import de.gebiter.security.model.UsersLogin2faSecondFactor;
import de.gebiter.security.repository.UsersLogin2faRepository;
import de.gebiter.users.model.Users;
import de.gebiter.users.service.UsersCredentialService;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;

/**
 * Service der Klasse {@link UsersLogin2fa}: der Login mit Pflicht-2FA (Vorgabe des Nutzers 2026-11-08). Er nutzt nur
 * sein eigenes {@link UsersLogin2faRepository}; User und Passwort prüft er über den {@link UsersService} und den
 * {@link UsersCredentialService}, die Authenticator-App über den {@link UsersTotpService}.
 * <ol>
 * <li>Passwort: E-Mail und Passwort stimmen → Wartezeile mit Anmeldeschein. Die Antwort sagt, was als Zweites kommt: der
 * Code ({@code TOTP_CODE}) oder, ohne App, erst ihr Einrichten ({@code TOTP_SETUP}). So richtet auch der erste Admin
 * seine App bei der ersten Anmeldung ein; eine Ausnahme gibt es nicht.</li>
 * <li>Nur beim Einrichten: Mit dem Schein kommen QR-Code und Schlüssel.</li>
 * <li>Einlösen ({@link SessionService}): Schein plus Code. Bei aktiver App prüft der Code, beim Einrichten bestätigt er
 * sie. Danach ist die Zeile weg, eine Sitzung gibt es also nur einmal. Nach {@code gebiter.login.max-failed-codes}
 * falschen Codes ist sie ebenfalls weg: von vorn mit dem Passwort. Über alle Anmeldungen hinweg sperrt der
 * {@link UsersTotpService} den Code nach {@code gebiter.totp.max-failed-codes-in-a-row} falschen am Stück.</li>
 * </ol>
 * Fehlschläge bei Passwort und Schein bekommen dieselbe Absage: Von außen ist nicht zu unterscheiden, woran es lag.
 */
@Service
public class UsersLogin2faService {

	private final UsersLogin2faRepository usersLogin2faRepository;

	private final UsersService usersService;

	private final UsersCredentialService usersCredentialService;

	private final UsersTotpService usersTotpService;

	/** Wie lange eine Wartezeile gilt ({@code gebiter.login.two-factor-validity}). */
	private final Duration twoFactorValidity;

	/** Byte Zufall je Anmeldeschein ({@code gebiter.login.token-bytes}). */
	private final int loginTokenBytes;

	/** So viele falsche Codes je Anmeldung ({@code gebiter.login.max-failed-codes}). */
	private final int maxFailedCodes;

	public UsersLogin2faService(UsersLogin2faRepository usersLogin2faRepository, UsersService usersService,
			UsersCredentialService usersCredentialService, UsersTotpService usersTotpService,
			@Value("${gebiter.login.two-factor-validity}") Duration twoFactorValidity,
			@Value("${gebiter.login.token-bytes}") int loginTokenBytes,
			@Value("${gebiter.login.max-failed-codes}") int maxFailedCodes) {
		this.usersLogin2faRepository = usersLogin2faRepository;
		this.usersService = usersService;
		this.usersCredentialService = usersCredentialService;
		this.usersTotpService = usersTotpService;
		this.twoFactorValidity = twoFactorValidity;
		this.loginTokenBytes = loginTokenBytes;
		this.maxFailedCodes = maxFailedCodes;
	}

	/**
	 * CREATE: Schritt 1 des Logins. Prüft E-Mail-Adresse und Passwort und legt eine Wartezeile an, räumt Abgelaufenes
	 * nebenbei weg. Zurück kommt der Anmeldeschein und was als Zweites kommt.
	 *
	 * @param sha256HexPassword das Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text
	 * @throws BadCredentialsException bei jedem Fehlschlag, immer mit derselben Meldung
	 */
	@Transactional
	public CreatedUsersLogin2fa createUsersLogin2fa(String email, String sha256HexPassword) {
		Optional<Users> foundUsers = usersService.findUsersByEmail(email);
		if (foundUsers.isEmpty()) {
			throw createWrongCredentialsException();
		}
		Users existingUsers = foundUsers.get();
		UUID usersGuid = existingUsers.getGuid();
		boolean passwordMatches = usersCredentialService.checkUsersCredential(usersGuid, sha256HexPassword);
		if (!passwordMatches) {
			throw createWrongCredentialsException();
		}

		Instant now = Instant.now();
		usersLogin2faRepository.deleteByExpiresAtBefore(now);
		String loginToken = Helper.createRandomLoginToken(loginTokenBytes);
		String loginTokenHash = Helper.createSha256Hex(loginToken);
		Instant expiresAt = now.plus(twoFactorValidity);
		UsersLogin2fa newUsersLogin2fa = new UsersLogin2fa(loginTokenHash, usersGuid, expiresAt);
		usersLogin2faRepository.save(newUsersLogin2fa);

		UsersLogin2faSecondFactor secondFactor = UsersLogin2faSecondFactor.TOTP_SETUP;
		boolean totpActive = usersTotpService.isUsersTotpActive(usersGuid);
		if (totpActive) {
			secondFactor = UsersLogin2faSecondFactor.TOTP_CODE;
		}
		return new CreatedUsersLogin2fa(loginToken, secondFactor);
	}

	/**
	 * CREATE: Schritt 2 beim Einrichten. Mit gültigem Anmeldeschein ein neues Geheimnis für die App dieses Users: Adresse
	 * für den QR-Code und Text zum Abtippen. Ein noch nicht bestätigtes Einrichten wird ersetzt.
	 *
	 * @throws BadCredentialsException wenn der Schein unbekannt oder abgelaufen ist
	 * @throws DuplicateKeyException (409) wenn die App schon aktiv ist: dann den Code eingeben
	 */
	@Transactional
	public UsersTotpSetup createUsersLogin2faTotpSetup(String loginToken) {
		UsersLogin2fa activeUsersLogin2fa = doGetActiveUsersLogin2fa(loginToken);
		UUID usersGuid = activeUsersLogin2fa.getUsersGuid();
		return usersTotpService.createUsersTotpSetup(usersGuid);
	}

	/**
	 * DELETE: Schritt 3, die Anmeldung mit dem Code einlösen. Passt er, ist die Zeile weg und die GUID des Users kommt
	 * zurück, dem die Sitzung gehört. Passt er nicht, zählt ein Fehlversuch; beim letzten erlaubten ist die Zeile weg.
	 * <p>
	 * {@code noRollbackFor}: Ein falscher Code wirft nach dem Zählen; der Fehlversuch muss trotzdem bestehen bleiben.
	 *
	 * @throws BadCredentialsException wenn Schein oder Code nicht passen oder eine andere Anfrage schneller war
	 */
	@Transactional(noRollbackFor = BadCredentialsException.class)
	public UUID deleteUsersLogin2fa(String loginToken, String code) {
		UsersLogin2fa activeUsersLogin2fa = doGetActiveUsersLogin2fa(loginToken);
		UUID usersGuid = activeUsersLogin2fa.getUsersGuid();
		String loginTokenHash = activeUsersLogin2fa.getLoginTokenHash();
		UsersTotpCodeRedemption codeRedemption = usersTotpService.redeemUsersTotpCode(usersGuid, code);
		Instant codeLockedUntil = codeRedemption.codeLockedUntil();
		if (codeLockedUntil != null) {
			// Zu viele falsche Codes am Stück: Diese Anmeldung ist vorbei, die nächste erst nach der Sperre
			usersLogin2faRepository.deleteByLoginTokenHash(loginTokenHash);
			Instant lockCheckTime = Instant.now();
			Duration remainingLock = Duration.between(lockCheckTime, codeLockedUntil);
			long remainingLockSeconds = Math.max(0, remainingLock.toSeconds());
			long remainingLockMinutes = (remainingLockSeconds + 59) / 60;
			throw new BadCredentialsException("Zu viele falsche Codes am Stück. Die Anmeldung ist noch "
					+ remainingLockMinutes + " Minuten gesperrt.");
		}
		boolean codeAccepted = codeRedemption.accepted();
		if (!codeAccepted) {
			usersLogin2faRepository.increaseFailedCodeCount(loginTokenHash);
			int failedCodeCount = activeUsersLogin2fa.getFailedCodeCount() + 1;
			if (failedCodeCount >= maxFailedCodes) {
				usersLogin2faRepository.deleteByLoginTokenHash(loginTokenHash);
				throw new BadCredentialsException("Zu viele falsche Codes. Bitte neu anmelden.");
			}
			int remainingCodeCount = maxFailedCodes - failedCodeCount;
			throw new BadCredentialsException("Der Code passt nicht (noch " + remainingCodeCount + " Versuche). Den "
					+ "aktuellen Code aus der App nehmen; stimmt die Uhr am Handy?");
		}
		// Einmalig: Nur wer die Zeile löscht, bekommt die Sitzung
		Instant now = Instant.now();
		int deletedRowCount = usersLogin2faRepository.deleteIfActive(loginTokenHash, now);
		if (deletedRowCount == 0) {
			throw createLoginFailedException();
		}
		return usersGuid;
	}

	/** Die noch gültige Zeile zum Anmeldeschein, sonst die allgemeine Absage. */
	private UsersLogin2fa doGetActiveUsersLogin2fa(String loginToken) {
		if (loginToken == null || loginToken.isBlank()) {
			throw createLoginFailedException();
		}
		String loginTokenHash = Helper.createSha256Hex(loginToken);
		Optional<UsersLogin2fa> foundUsersLogin2fa = usersLogin2faRepository.findByLoginTokenHash(loginTokenHash);
		if (foundUsersLogin2fa.isEmpty()) {
			throw createLoginFailedException();
		}
		UsersLogin2fa existingUsersLogin2fa = foundUsersLogin2fa.get();
		Instant expiresAt = existingUsersLogin2fa.getExpiresAt();
		Instant now = Instant.now();
		if (!expiresAt.isAfter(now)) {
			throw createLoginFailedException();
		}
		return existingUsersLogin2fa;
	}

	private BadCredentialsException createWrongCredentialsException() {
		return new BadCredentialsException("E-Mail-Adresse oder Passwort ist falsch.");
	}

	private BadCredentialsException createLoginFailedException() {
		return new BadCredentialsException("Die Anmeldung ist abgelaufen oder unbekannt. Bitte neu anmelden.");
	}
}
