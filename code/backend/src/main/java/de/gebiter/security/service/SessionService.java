package de.gebiter.security.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.access.service.AccessRoleCollectionRoleService;
import de.gebiter.access.service.AccessRoleUsersAssignmentService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.security.JwtConfig;
import de.gebiter.security.dto.CreatedSession;
import de.gebiter.security.dto.CreatedUsersRefreshToken;
import de.gebiter.security.dto.SessionInfo;
import de.gebiter.security.dto.UsersOnlineCheckInEvent;
import de.gebiter.security.dto.UsersSessionEndedEvent;
import de.gebiter.security.model.UsersRefreshToken;
import de.gebiter.users.model.Users;
import de.gebiter.users.service.UsersFriendshipService;
import de.gebiter.users.service.UsersService;

/**
 * Abholen der Sitzung nach der 2FA, Erneuern, Abmelden, eigene Sitzung und das Ausstellen der JWTs. Die einzige Stelle,
 * die JWTs ausstellt. E-Mail und Passwort prüft vorher der {@link UsersLogin2faService} (Schritt 1 des Logins).
 * <p>
 * Eine Sitzung besteht aus zwei Cookies: dem kurzen JWT ({@code gebiter.jwt.validity}) für jede Anfrage und dem
 * Refresh-Token ({@code gebiter.refresh-token.validity}, {@link UsersRefreshTokenService}), mit dem sich das Frontend vor
 * Ablauf ein neues JWT holt. So bleibt man angemeldet, auch nach einem Neustart des Browsers oder des Backends.
 * <p>
 * Inhalt eines JWT:
 * <ul>
 * <li>{@code sub}: die GUID des Users</li>
 * <li>Rollen-Claim ({@code gebiter.jwt.roles-claim}): die Keys seiner wirksamen AccessRoles, wie in
 * der Vorlage: die einzeln zugewiesenen ({@code AccessRoleUsersAssignment}) plus die Rechte seiner
 * Collection ({@code AccessRoleCollectionRole}), jedes nur einmal. Beim Login frisch gelesen, neue
 * Rechte stehen ab der nächsten Erneuerung im Token.</li>
 * <li>Collection-Claim ({@code gebiter.jwt.access-role-collection-claim}): der Key seiner
 * AccessRoleCollection, nur wenn er eine hat</li>
 * <li>Sitzungs-Claim ({@code gebiter.jwt.session-number-claim}): der Platz der Sitzung, für die Anzeige im Menü</li>
 * <li>{@code iat} und {@code exp}: Ausstellungs- und Ablaufzeit</li>
 * </ul>
 * JEDER FEHLSCHLAG BEIM ABHOLEN BEKOMMT DIESELBE MELDUNG: Unbekannter Schein, abgelaufene Anmeldung und
 * gelöschter User sind von außen nicht zu unterscheiden.
 */
@Service
public class SessionService {

	private final UsersService usersService;

	private final UsersLogin2faService usersLogin2faService;

	private final AccessRoleUsersAssignmentService accessRoleUsersAssignmentService;

	private final AccessRoleCollectionRoleService accessRoleCollectionRoleService;

	private final UsersRefreshTokenService usersRefreshTokenService;

	private final CurrentUsersProvider currentUsersProvider;

	private final JwtEncoder jwtEncoder;

	private final JwtConfig jwtConfig;

	private final UsersFriendshipService usersFriendshipService;

	private final ApplicationEventPublisher applicationEventPublisher;

	public SessionService(UsersService usersService, UsersLogin2faService usersLogin2faService,
			AccessRoleUsersAssignmentService accessRoleUsersAssignmentService,
			AccessRoleCollectionRoleService accessRoleCollectionRoleService,
			UsersRefreshTokenService usersRefreshTokenService, CurrentUsersProvider currentUsersProvider,
			JwtEncoder jwtEncoder, JwtConfig jwtConfig, UsersFriendshipService usersFriendshipService,
			ApplicationEventPublisher applicationEventPublisher) {
		this.usersService = usersService;
		this.usersLogin2faService = usersLogin2faService;
		this.accessRoleUsersAssignmentService = accessRoleUsersAssignmentService;
		this.accessRoleCollectionRoleService = accessRoleCollectionRoleService;
		this.usersRefreshTokenService = usersRefreshTokenService;
		this.currentUsersProvider = currentUsersProvider;
		this.jwtEncoder = jwtEncoder;
		this.jwtConfig = jwtConfig;
		this.usersFriendshipService = usersFriendshipService;
		this.applicationEventPublisher = applicationEventPublisher;
	}

	/**
	 * CREATE: Schritt 3 des Logins, einmalig: Anmeldeschein plus Code aus der Authenticator-App (beim Einrichten der
	 * erste) ergeben JWT und Refresh-Token samt Sitzung, auf einem eigenen Platz. Ohne gültigen Code gibt es keine
	 * Sitzung (2FA ist Pflicht).
	 * <p>
	 * {@code noRollbackFor}: Ein falscher Code zählt beim {@link UsersLogin2faService} als Fehlversuch, auch wenn hier
	 * danach die Absage kommt.
	 *
	 * @throws BadCredentialsException wenn Schein oder Code nicht passen oder der User inzwischen gelöscht wurde
	 */
	@Transactional(noRollbackFor = BadCredentialsException.class)
	public CreatedSession createSession(String loginToken, String code) {
		UUID usersGuid = usersLogin2faService.deleteUsersLogin2fa(loginToken, code);
		boolean usersDeleted = usersService.isUsersDeleted(usersGuid);
		if (usersDeleted) {
			throw new BadCredentialsException("Die Anmeldung ist abgelaufen oder unbekannt. Bitte neu anmelden.");
		}
		Users existingUsers = usersService.getUsers(usersGuid);
		CreatedUsersRefreshToken createdUsersRefreshToken = usersRefreshTokenService.createUsersRefreshToken(usersGuid);
		String refreshToken = createdUsersRefreshToken.refreshToken();
		int sessionNumber = createdUsersRefreshToken.sessionNumber();
		CreatedSession createdSession = doCreateSession(existingUsers, refreshToken, sessionNumber);
		doPublishOnlineCheckIn(usersGuid, sessionNumber, true);
		return createdSession;
	}

	/**
	 * CREATE: Erneuert die Sitzung mit dem Refresh-Token aus dem Cookie: neues JWT mit frisch gelesenen Rechten und ein
	 * neuer Refresh-Token, derselbe Platz. Geht auch, wenn das JWT schon abgelaufen ist oder das Backend neu gestartet
	 * wurde.
	 * <p>
	 * {@code noRollbackFor}: Scheitert das Erneuern, bleiben die Löschungen des {@link UsersRefreshTokenService} bestehen.
	 *
	 * @throws BadCredentialsException wenn der Token fehlt, unbekannt, abgelaufen oder verbraucht ist oder der User
	 *         inzwischen gelöscht wurde
	 */
	@Transactional(noRollbackFor = BadCredentialsException.class)
	public CreatedSession refreshSession(String refreshToken) {
		UsersRefreshToken consumedUsersRefreshToken = usersRefreshTokenService.consumeUsersRefreshToken(refreshToken);
		UUID usersGuid = consumedUsersRefreshToken.getUsersGuid();
		boolean usersDeleted = usersService.isUsersDeleted(usersGuid);
		if (usersDeleted) {
			throw new BadCredentialsException("Die Sitzung ist abgelaufen oder unbekannt. Bitte neu anmelden.");
		}
		Users existingUsers = usersService.getUsers(usersGuid);
		String successorRefreshToken = usersRefreshTokenService.createSuccessorUsersRefreshToken(consumedUsersRefreshToken);
		int sessionNumber = consumedUsersRefreshToken.getSessionNumber();
		CreatedSession createdSession = doCreateSession(existingUsers, successorRefreshToken, sessionNumber);
		doPublishOnlineCheckIn(usersGuid, sessionNumber, false);
		return createdSession;
	}

	/**
	 * READ: Die eigene Sitzung: der frische {@code Users}-Eintrag plus Rechte und Ablaufzeit aus dem
	 * Token der laufenden Anfrage.
	 *
	 * @throws AuthenticationCredentialsNotFoundException wenn niemand angemeldet ist oder der User
	 *         inzwischen gelöscht wurde
	 */
	@Transactional(readOnly = true)
	public SessionInfo getSession() {
		boolean authenticated = currentUsersProvider.isAuthenticated();
		if (!authenticated) {
			throw new AuthenticationCredentialsNotFoundException("Nicht angemeldet.");
		}
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		boolean currentUsersDeleted = usersService.isUsersDeleted(currentUsersGuid);
		if (currentUsersDeleted) {
			throw new AuthenticationCredentialsNotFoundException("Nicht angemeldet.");
		}
		return doGetSession(currentUsersGuid);
	}

	/**
	 * DELETE: Logout, beendet die Sitzung dieses Geräts (die Kette seines Refresh-Tokens). Ohne oder mit unbekanntem
	 * Token passiert nichts: Ein Logout darf nie scheitern. Ein schon ausgestelltes JWT bleibt bis zu seinem Ablauf
	 * gültig, das Cookie löscht der Controller. Nach dem Commit erfährt die Anwesenheit davon: Läuft keine andere Sitzung
	 * mehr, ist der User sofort offline.
	 */
	@Transactional
	public void deleteSession(String refreshToken) {
		UsersRefreshToken deletedUsersRefreshToken = usersRefreshTokenService.deleteUsersRefreshTokenChain(refreshToken);
		if (deletedUsersRefreshToken == null) {
			return;
		}
		UUID usersGuid = deletedUsersRefreshToken.getUsersGuid();
		int sessionNumber = deletedUsersRefreshToken.getSessionNumber();
		UsersSessionEndedEvent usersSessionEndedEvent = new UsersSessionEndedEvent(usersGuid, sessionNumber);
		applicationEventPublisher.publishEvent(usersSessionEndedEvent);
	}

	private CreatedSession doCreateSession(Users existingUsers, String refreshToken, int sessionNumber) {
		UUID usersGuid = existingUsers.getGuid();
		// Bei jedem Login und Refresh die Freundesliste frisch in den Hauptspeicher (CurrentUsersProvider)
		usersFriendshipService.loadFriendUsersGuidsIntoMemory(usersGuid);
		String accessRoleCollectionKey = existingUsers.getAccessRoleCollectionKey();
		List<String> accessRoleKeys = doGetEffectiveAccessRoleKeys(usersGuid, accessRoleCollectionKey);
		Instant issuedAt = Instant.now();
		Duration jwtValidity = jwtConfig.jwtValidity();
		Instant expiresAt = issuedAt.plus(jwtValidity);

		Duration jwtRenewalInterval = jwtConfig.jwtRenewalInterval();
		Instant renewalDueAt = issuedAt.plus(jwtRenewalInterval);

		String jwt = doEncodeJwt(usersGuid, accessRoleKeys, accessRoleCollectionKey, sessionNumber, issuedAt,
				expiresAt);
		SessionInfo sessionInfo = new SessionInfo(existingUsers, accessRoleKeys, expiresAt, renewalDueAt, sessionNumber);
		return new CreatedSession(jwt, refreshToken, sessionInfo);
	}

	/**
	 * Die wirksamen Rechte eines Users: zuerst die einzeln zugewiesenen, dann die seiner Collection, jedes
	 * nur einmal.
	 */
	private List<String> doGetEffectiveAccessRoleKeys(UUID usersGuid, String accessRoleCollectionKey) {
		List<String> assignedAccessRoleKeys = accessRoleUsersAssignmentService.getAccessRoleKeysByUsersGuid(usersGuid);
		// LinkedHashSet: behält die Reihenfolge und nimmt jeden Key nur einmal auf.
		Set<String> effectiveAccessRoleKeys = new LinkedHashSet<>(assignedAccessRoleKeys);
		boolean usersHasAccessRoleCollection = hasAccessRoleCollection(accessRoleCollectionKey);
		if (usersHasAccessRoleCollection) {
			List<String> accessRoleCollectionAccessRoleKeys = accessRoleCollectionRoleService
					.getAccessRoleKeysByAccessRoleCollectionKey(accessRoleCollectionKey);
			effectiveAccessRoleKeys.addAll(accessRoleCollectionAccessRoleKeys);
		}
		return new ArrayList<>(effectiveAccessRoleKeys);
	}

	private SessionInfo doGetSession(UUID currentUsersGuid) {
		Users currentUsers = usersService.getUsers(currentUsersGuid);
		List<String> accessRoleKeys = currentUsersProvider.currentUsersAccessRoleKeys();
		Instant tokenExpiresAt = currentUsersProvider.currentUsersTokenExpiresAt();
		int sessionNumber = currentUsersProvider.currentUsersSessionNumber();
		// Derselbe Termin wie bei der Ausstellung: Ausstellung = Ablauf minus Gültigkeit. So ändert F5 ihn nicht.
		Duration jwtValidity = jwtConfig.jwtValidity();
		Duration jwtRenewalInterval = jwtConfig.jwtRenewalInterval();
		Instant tokenIssuedAt = tokenExpiresAt.minus(jwtValidity);
		Instant tokenRenewalDueAt = tokenIssuedAt.plus(jwtRenewalInterval);
		return new SessionInfo(currentUsers, accessRoleKeys, tokenExpiresAt, tokenRenewalDueAt, sessionNumber);
	}

	private String doEncodeJwt(UUID usersGuid, List<String> accessRoleKeys, String accessRoleCollectionKey,
			int sessionNumber, Instant issuedAt, Instant expiresAt) {
		String usersGuidText = usersGuid.toString();
		String rolesClaimName = jwtConfig.rolesClaimName();
		String sessionNumberClaimName = jwtConfig.sessionNumberClaimName();

		JwtClaimsSet.Builder jwtClaimsBuilder = JwtClaimsSet.builder();
		jwtClaimsBuilder.subject(usersGuidText);
		jwtClaimsBuilder.issuedAt(issuedAt);
		jwtClaimsBuilder.expiresAt(expiresAt);
		jwtClaimsBuilder.claim(rolesClaimName, accessRoleKeys);
		jwtClaimsBuilder.claim(sessionNumberClaimName, sessionNumber);

		boolean usersHasAccessRoleCollection = hasAccessRoleCollection(accessRoleCollectionKey);
		if (usersHasAccessRoleCollection) {
			String accessRoleCollectionClaimName = jwtConfig.accessRoleCollectionClaimName();
			jwtClaimsBuilder.claim(accessRoleCollectionClaimName, accessRoleCollectionKey);
		}
		JwtClaimsSet jwtClaims = jwtClaimsBuilder.build();

		JwtEncoderParameters jwtEncoderParameters = JwtEncoderParameters.from(jwtClaims);
		Jwt encodedJwt = jwtEncoder.encode(jwtEncoderParameters);
		return encodedJwt.getTokenValue();
	}

	/**
	 * Login und Verlängerung sind ein Beweis, dass der User da ist: als Online-Zeit gebucht nach dem Commit
	 * ({@code AchievementTrackingService}), lose gekoppelt über ein Ereignis. Zeit von der Uhr des Servers.
	 */
	private void doPublishOnlineCheckIn(UUID usersGuid, int sessionNumber, boolean login) {
		Instant checkedInAt = Instant.now();
		UsersOnlineCheckInEvent usersOnlineCheckInEvent = new UsersOnlineCheckInEvent(usersGuid, sessionNumber,
				checkedInAt, login);
		applicationEventPublisher.publishEvent(usersOnlineCheckInEvent);
	}

	private boolean hasAccessRoleCollection(String accessRoleCollectionKey) {
		return accessRoleCollectionKey != null && !accessRoleCollectionKey.isBlank();
	}

}
