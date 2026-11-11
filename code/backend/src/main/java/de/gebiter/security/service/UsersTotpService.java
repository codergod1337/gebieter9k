package de.gebiter.security.service;

import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.security.dto.UsersTotpCodeCheck;
import de.gebiter.security.dto.UsersTotpCodeRedemption;
import de.gebiter.security.dto.UsersTotpSetup;
import de.gebiter.security.dto.UsersTotpStatus;
import de.gebiter.security.model.UsersTotp;
import de.gebiter.security.model.UsersTotpState;
import de.gebiter.security.repository.UsersTotpRepository;
import de.gebiter.users.model.Users;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link UsersTotp}: die Authenticator-App eines Users. Er nutzt nur sein eigenes
 * {@link UsersTotpRepository}; rechnen und verschlüsseln lässt er den {@link TotpService}, den Namen im QR-Code liefert
 * der {@link UsersService}.
 * <p>
 * Seit 2026-11-08 ist die App Pflicht (Vorgabe des Nutzers): Der Login verlangt ihren Code, und wer noch keine hat,
 * richtet sie bei der Anmeldung ein. Drei Wege hierher, je mit eigenen Methoden, alle über dieselben {@code do…}-Kerne:
 * <ul>
 * <li>Profil (User aus dem Token, Methoden mit {@code Own}): einrichten, testen, abschalten mit Code oder Schlüssel.</li>
 * <li>Login (User aus dem geprüften Anmeldeschein des {@link UsersLogin2faService}, ohne Sitzung): einrichten und den
 * Code einlösen.</li>
 * <li>Admin: Stand ansehen und die App eines Users entfernen.</li>
 * </ul>
 */
@Service
public class UsersTotpService {

	private static final Logger LOGGER = LoggerFactory.getLogger(UsersTotpService.class);

	private final UsersTotpRepository usersTotpRepository;

	private final TotpService totpService;

	private final UsersService usersService;

	private final CurrentUsersProvider currentUsersProvider;

	/** So viele falsche Codes am Stück beim Login, dann die Sperre ({@code gebiter.totp.max-failed-codes-in-a-row}). */
	private final int maxFailedCodesInARow;

	/** So lange nimmt der Login danach keinen Code an ({@code gebiter.totp.lock-duration}). */
	private final Duration lockDuration;

	public UsersTotpService(UsersTotpRepository usersTotpRepository, TotpService totpService, UsersService usersService,
			CurrentUsersProvider currentUsersProvider,
			@Value("${gebiter.totp.max-failed-codes-in-a-row}") int maxFailedCodesInARow,
			@Value("${gebiter.totp.lock-duration}") Duration lockDuration) {
		this.usersTotpRepository = usersTotpRepository;
		this.totpService = totpService;
		this.usersService = usersService;
		this.currentUsersProvider = currentUsersProvider;
		this.maxFailedCodesInARow = maxFailedCodesInARow;
		this.lockDuration = lockDuration;
	}

	/**
	 * CREATE (Profil): Neues Geheimnis für die eigene App, wartet auf den ersten Code. Liefert die Adresse für den QR-Code
	 * und den Text zum Abtippen, nur dieses eine Mal. Ein noch nicht bestätigtes Einrichten wird ersetzt.
	 *
	 * @throws DuplicateKeyException (409) wenn die App schon aktiv ist: erst abschalten
	 */
	@Transactional
	public UsersTotpSetup createOwnUsersTotpSetup() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		return doCreateUsersTotpSetup(currentUsersGuid);
	}

	/**
	 * CREATE (Login): Wie {@link #createOwnUsersTotpSetup()}, für den User eines geprüften Anmeldescheins, noch ohne
	 * Sitzung. Nur der {@link UsersLogin2faService} ruft das, nachdem Passwort und Schein gestimmt haben.
	 *
	 * @throws DuplicateKeyException (409) wenn die App schon aktiv ist: dann den Code eingeben
	 */
	@Transactional
	public UsersTotpSetup createUsersTotpSetup(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		return doCreateUsersTotpSetup(usersGuid);
	}

	/** READ (Profil): Der Stand der eigenen App. */
	@Transactional(readOnly = true)
	public UsersTotpStatus getOwnUsersTotpStatus() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		return doGetUsersTotpStatus(currentUsersGuid);
	}

	/** READ (ADMIN): Der Stand der App eines Users, z. B. für „User bearbeiten“. */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional(readOnly = true)
	public UsersTotpStatus getUsersTotpStatus(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		return doGetUsersTotpStatus(usersGuid);
	}

	/** READ (Login): Ist die App dieses Users aktiv? Dann fragt der Login nach dem Code, sonst richtet er sie ein. */
	@Transactional(readOnly = true)
	public boolean isUsersTotpActive(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		UsersTotpStatus usersTotpStatus = doGetUsersTotpStatus(usersGuid);
		return usersTotpStatus.state() == UsersTotpState.ACTIVE;
	}

	/**
	 * READ (Profil): Testet einen Code gegen die aktive App, so wie es der Login tut. Ein angenommener Code gilt danach
	 * nicht noch einmal.
	 *
	 * @throws EntityNotFoundException wenn keine App aktiv ist
	 */
	@Transactional
	public UsersTotpCodeCheck checkOwnUsersTotpCode(String code) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		UsersTotp activeUsersTotp = doGetUsersTotp(currentUsersGuid, UsersTotpState.ACTIVE);
		boolean codeAccepted = doAcceptCode(activeUsersTotp, code);
		if (!codeAccepted) {
			return new UsersTotpCodeCheck(false, "Passt nicht. Aktuellen Code nehmen; gilt er schon einmal, den nächsten "
					+ "abwarten. Stimmt die Uhr am Handy?");
		}
		return new UsersTotpCodeCheck(true, "Passt. So prüft auch der Login.");
	}

	/**
	 * UPDATE (Profil): Bestätigt das Einrichten mit dem ersten Code aus der App, danach ist sie aktiv.
	 *
	 * @throws IllegalArgumentException (400) wenn der Code nicht passt
	 * @throws EntityNotFoundException wenn kein Einrichten offen ist
	 */
	@Transactional
	public UsersTotpStatus confirmOwnUsersTotp(String code) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		UsersTotp pendingUsersTotp = doGetUsersTotp(currentUsersGuid, UsersTotpState.PENDING);
		boolean codeAccepted = doAcceptCode(pendingUsersTotp, code);
		if (!codeAccepted) {
			throw new IllegalArgumentException("Der Code passt nicht. Den aktuellen Code aus der App eingeben; stimmt die "
					+ "Uhr am Handy?");
		}
		Instant confirmedAt = pendingUsersTotp.getConfirmedAt();
		return new UsersTotpStatus(UsersTotpState.ACTIVE, confirmedAt);
	}

	/**
	 * UPDATE (Login): Löst einen Code für die Anmeldung ein. Ist die App aktiv, wird er geprüft; ist das Einrichten offen,
	 * bestätigt er es, danach ist sie aktiv. Ein angenommener Code gilt nicht noch einmal. Nur der
	 * {@link UsersLogin2faService} ruft das, nachdem der Anmeldeschein gestimmt hat.
	 * <p>
	 * Sperre (Vorgabe des Nutzers 2026-11-08): Jeder falsche Code zählt, über alle Anmeldungen hinweg. Nach
	 * {@code gebiter.totp.max-failed-codes-in-a-row} am Stück nimmt der Login {@code gebiter.totp.lock-duration} lang
	 * keinen Code an, auch keinen richtigen; geprüft wird dann gar nicht erst. Bewusst ohne Ausnahme: Der Aufrufer
	 * zählt den Fehlversuch in derselben Transaktion, eine Ausnahme hier würde sie zurückrollen.
	 *
	 * @return angenommen oder nicht, und bis wann gesperrt ist (sonst {@code null})
	 */
	@Transactional
	public UsersTotpCodeRedemption redeemUsersTotpCode(UUID usersGuid, String code) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Optional<UsersTotp> foundUsersTotp = usersTotpRepository.findByUsersGuid(usersGuid);
		if (foundUsersTotp.isEmpty()) {
			return new UsersTotpCodeRedemption(false, null);
		}
		UsersTotp usersTotp = foundUsersTotp.get();
		Instant now = Instant.now();
		boolean codeLocked = usersTotp.isCodeLocked(now);
		if (codeLocked) {
			Instant codeLockedUntil = usersTotp.getCodeLockedUntil();
			return new UsersTotpCodeRedemption(false, codeLockedUntil);
		}
		boolean codeAccepted = doAcceptCode(usersTotp, code);
		if (codeAccepted) {
			return new UsersTotpCodeRedemption(true, null);
		}
		boolean lockStarted = usersTotp.recordFailedCode(now, maxFailedCodesInARow, lockDuration);
		usersTotpRepository.save(usersTotp);
		if (lockStarted) {
			Instant codeLockedUntil = usersTotp.getCodeLockedUntil();
			LOGGER.warn("Authenticator-App von {}: {} falsche Codes am Stück, Login gesperrt bis {}", usersGuid,
					maxFailedCodesInARow, codeLockedUntil);
			return new UsersTotpCodeRedemption(false, codeLockedUntil);
		}
		return new UsersTotpCodeRedemption(false, null);
	}

	/**
	 * DELETE (Profil): Schaltet die eigene App ab. Ist sie aktiv, nur mit einem gültigen Code ODER dem Schlüssel von der
	 * Einrichtung (wer eins davon hat, hat die App in der Hand); ein offenes Einrichten geht ohne. Der Schlüssel gewinnt,
	 * wenn beides kommt. Weil die App Pflicht ist, richtet der User sie bei der nächsten Anmeldung neu ein.
	 *
	 * @param code der aktuelle Code aus der App, leer wenn der Schlüssel gilt
	 * @param secretBase32 der Schlüssel (Base32, Leerzeichen erlaubt), leer wenn der Code gilt
	 * @throws IllegalArgumentException (400) wenn Code oder Schlüssel fehlen oder nicht passen
	 * @throws EntityNotFoundException wenn es keine App gibt
	 */
	@Transactional
	public void deleteOwnUsersTotp(String code, String secretBase32) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Optional<UsersTotp> foundUsersTotp = usersTotpRepository.findByUsersGuid(currentUsersGuid);
		if (foundUsersTotp.isEmpty()) {
			throw new EntityNotFoundException("Es ist keine Authenticator-App eingerichtet.");
		}
		UsersTotp usersTotp = foundUsersTotp.get();
		boolean active = usersTotp.getState() == UsersTotpState.ACTIVE;
		if (active) {
			boolean secretGiven = secretBase32 != null && !secretBase32.isBlank();
			boolean codeGiven = code != null && !code.isBlank();
			if (secretGiven) {
				boolean secretMatches = doMatchesSecret(usersTotp, secretBase32);
				if (!secretMatches) {
					throw new IllegalArgumentException("Der Schlüssel passt nicht, die App bleibt eingeschaltet.");
				}
			} else if (codeGiven) {
				Long matchingTimeStep = doFindMatchingTimeStep(usersTotp, code);
				if (matchingTimeStep == null) {
					throw new IllegalArgumentException("Der Code passt nicht, die App bleibt eingeschaltet.");
				}
			} else {
				throw new IllegalArgumentException(
						"Zum Abschalten einen Code aus der App oder den Schlüssel von der Einrichtung eingeben.");
			}
		}
		usersTotpRepository.delete(usersTotp);
	}

	/**
	 * DELETE (ADMIN): Entfernt die App eines Users ohne Code, z. B. wenn er Handy und Schlüssel verloren hat. Bei der
	 * nächsten Anmeldung richtet er sie neu ein. Steht im Log, wer es war.
	 *
	 * @throws EntityNotFoundException wenn der User keine App hat
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteUsersTotp(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Optional<UsersTotp> foundUsersTotp = usersTotpRepository.findByUsersGuid(usersGuid);
		if (foundUsersTotp.isEmpty()) {
			throw new EntityNotFoundException("Dieser User hat keine Authenticator-App.");
		}
		UsersTotp usersTotp = foundUsersTotp.get();
		usersTotpRepository.delete(usersTotp);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		LOGGER.info("Authenticator-App von {} entfernt durch Admin {}", usersGuid, currentUsersGuid);
	}

	/**
	 * DELETE (ADMIN): Entfernt die App eines Users, wenn er eine hat, auch eine noch nicht bestätigte. Für den
	 * Start-Runner, der das erzwungene Admin-Konto zurücksetzt ({@code gebiter.admin-users.force}): Danach meldet es sich
	 * nur mit dem Passwort an und richtet die App bei der ersten Anmeldung neu ein.
	 *
	 * @return {@code true}, wenn es eine App gab
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public boolean deleteUsersTotpIfExists(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Optional<UsersTotp> foundUsersTotp = usersTotpRepository.findByUsersGuid(usersGuid);
		if (foundUsersTotp.isEmpty()) {
			return false;
		}
		UsersTotp usersTotp = foundUsersTotp.get();
		usersTotpRepository.delete(usersTotp);
		return true;
	}

	/** Der Kern des Einrichtens: neues Geheimnis, verschlüsselt gespeichert, die Daten für QR-Code und Abtippen zurück. */
	private UsersTotpSetup doCreateUsersTotpSetup(UUID usersGuid) {
		Optional<UsersTotp> foundUsersTotp = usersTotpRepository.findByUsersGuid(usersGuid);
		boolean alreadyActive = foundUsersTotp.isPresent() && foundUsersTotp.get().getState() == UsersTotpState.ACTIVE;
		if (alreadyActive) {
			throw new DuplicateKeyException("Die Authenticator-App ist schon eingerichtet. Erst abschalten, dann neu einrichten.");
		}
		byte[] secret = totpService.createSecret();
		String secretEncrypted = totpService.encryptSecret(secret);
		Instant now = Instant.now();
		UsersTotp usersTotp;
		if (foundUsersTotp.isPresent()) {
			usersTotp = foundUsersTotp.get();
			usersTotp.replacePendingSecret(secretEncrypted, now);
		} else {
			usersTotp = new UsersTotp(usersGuid, secretEncrypted, now);
		}
		usersTotpRepository.save(usersTotp);

		Users users = usersService.getUsers(usersGuid);
		String accountName = users.getUsername();
		String otpauthUri = totpService.createOtpauthUri(secret, accountName);
		String secretBase32 = Helper.encodeBase32(secret);
		String issuer = totpService.getIssuer();
		return new UsersTotpSetup(otpauthUri, secretBase32, issuer, accountName);
	}

	private UsersTotpStatus doGetUsersTotpStatus(UUID usersGuid) {
		Optional<UsersTotp> foundUsersTotp = usersTotpRepository.findByUsersGuid(usersGuid);
		if (foundUsersTotp.isEmpty()) {
			return new UsersTotpStatus(UsersTotpState.NONE, null);
		}
		UsersTotp usersTotp = foundUsersTotp.get();
		UsersTotpState state = usersTotp.getState();
		Instant confirmedAt = usersTotp.getConfirmedAt();
		return new UsersTotpStatus(state, confirmedAt);
	}

	/**
	 * Der Kern jedes Codes: passt er, gilt sein Zeitabschnitt als benutzt (kein zweites Mal), und ein offenes Einrichten
	 * ist damit bestätigt.
	 *
	 * @return {@code false}, wenn er nicht passt
	 */
	private boolean doAcceptCode(UsersTotp usersTotp, String code) {
		Long matchingTimeStep = doFindMatchingTimeStep(usersTotp, code);
		if (matchingTimeStep == null) {
			return false;
		}
		boolean pending = usersTotp.getState() == UsersTotpState.PENDING;
		if (pending) {
			Instant now = Instant.now();
			usersTotp.confirm(now, matchingTimeStep);
		} else {
			usersTotp.markTimeStepUsed(matchingTimeStep);
		}
		usersTotpRepository.save(usersTotp);
		return true;
	}

	/** Der Eintrag des Users im verlangten Stand, sonst 404 mit passender Meldung. */
	private UsersTotp doGetUsersTotp(UUID usersGuid, UsersTotpState requiredState) {
		Optional<UsersTotp> foundUsersTotp = usersTotpRepository.findByUsersGuid(usersGuid);
		boolean inRequiredState = foundUsersTotp.isPresent() && foundUsersTotp.get().getState() == requiredState;
		if (!inRequiredState) {
			String missingText = "Es ist keine Authenticator-App aktiv.";
			if (requiredState == UsersTotpState.PENDING) {
				missingText = "Es ist kein Einrichten offen. Bitte neu einrichten.";
			}
			throw new EntityNotFoundException(missingText);
		}
		return foundUsersTotp.get();
	}

	/** Passt der eingegebene Schlüssel zum gespeicherten? Vergleich in gleich langer Zeit, egal wo er abweicht. */
	private boolean doMatchesSecret(UsersTotp usersTotp, String secretBase32) {
		byte[] enteredSecret = Helper.decodeBase32(secretBase32);
		String secretEncrypted = usersTotp.getSecretEncrypted();
		byte[] storedSecret = totpService.decryptSecret(secretEncrypted);
		return MessageDigest.isEqual(enteredSecret, storedSecret);
	}

	private Long doFindMatchingTimeStep(UsersTotp usersTotp, String code) {
		String secretEncrypted = usersTotp.getSecretEncrypted();
		byte[] secret = totpService.decryptSecret(secretEncrypted);
		Long lastUsedTimeStep = usersTotp.getLastUsedTimeStep();
		return totpService.findMatchingTimeStep(secret, code, lastUsedTimeStep);
	}
}
