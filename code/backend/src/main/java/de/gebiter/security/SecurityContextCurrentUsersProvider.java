package de.gebiter.security;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import de.gebiter.users.service.UsersFriendshipService;

/**
 * Die einzige Stelle im Projekt, die den SecurityContext von Spring direkt anfasst. Aufbau wie im
 * Vorlageprojekt.
 * <p>
 * ALLES KOMMT AUS DEM TOKEN DER LAUFENDEN ANFRAGE, ohne Datenbankzugriff. Signatur und Ablauf hat
 * die Filterkette schon geprüft, bevor hier etwas ausgelesen wird.
 * <p>
 * WERFEN STATT LEER ZURÜCKGEBEN: Fragt jemand ohne angemeldeten User nach dessen GUID, ist das ein
 * Fehler im Aufbau und kein leerer Sonderfall.
 */
@Component
public class SecurityContextCurrentUsersProvider implements CurrentUsersProvider {

	private final JwtConfig jwtConfig;

	/**
	 * Erst beim Aufruf geholt: Der {@link UsersFriendshipService} braucht selbst diesen Provider, ein direkter Verweis
	 * wäre ein Zirkel beim Start.
	 */
	private final ObjectProvider<UsersFriendshipService> usersFriendshipServiceProvider;

	public SecurityContextCurrentUsersProvider(JwtConfig jwtConfig,
			ObjectProvider<UsersFriendshipService> usersFriendshipServiceProvider) {
		this.jwtConfig = jwtConfig;
		this.usersFriendshipServiceProvider = usersFriendshipServiceProvider;
	}

	@Override
	public boolean isAuthenticated() {
		Jwt currentJwt = getCurrentJwtOrNull();
		return currentJwt != null;
	}

	@Override
	public UUID currentUsersGuid() {
		Jwt currentJwt = requireCurrentJwt();
		String subject = currentJwt.getSubject();
		if (subject == null || subject.isBlank()) {
			throw new IllegalStateException("Das Token hat kein sub.");
		}
		try {
			return UUID.fromString(subject);
		} catch (IllegalArgumentException exception) {
			throw new IllegalStateException("Das sub im Token ist keine gültige UUID.", exception);
		}
	}

	/** Leere Liste, wenn der Claim fehlt: Ein User ohne Rechte ist ein gewöhnlicher Fall. */
	@Override
	public List<String> currentUsersAccessRoleKeys() {
		Jwt currentJwt = requireCurrentJwt();
		String rolesClaimName = jwtConfig.rolesClaimName();
		List<String> accessRoleKeys = currentJwt.getClaimAsStringList(rolesClaimName);
		if (accessRoleKeys == null) {
			return List.of();
		}
		return List.copyOf(accessRoleKeys);
	}

	/** Aus dem Hauptspeicher des {@link UsersFriendshipService}, ohne Datenbankzugriff. */
	@Override
	public List<UUID> currentUsersFriendUsersGuids() {
		UUID currentUsersGuid = currentUsersGuid();
		UsersFriendshipService usersFriendshipService = usersFriendshipServiceProvider.getObject();
		return usersFriendshipService.getFriendUsersGuidsFromMemory(currentUsersGuid);
	}

	@Override
	public boolean currentUsersHasAccessRole(String accessRoleKey) {
		List<String> currentUsersAccessRoleKeys = currentUsersAccessRoleKeys();
		return currentUsersAccessRoleKeys.contains(accessRoleKey);
	}

	@Override
	public Optional<String> currentUsersAccessRoleCollectionKey() {
		Jwt currentJwt = requireCurrentJwt();
		String accessRoleCollectionClaimName = jwtConfig.accessRoleCollectionClaimName();
		String accessRoleCollectionKey = currentJwt.getClaimAsString(accessRoleCollectionClaimName);
		return Optional.ofNullable(accessRoleCollectionKey);
	}

	@Override
	public Instant currentUsersTokenExpiresAt() {
		Jwt currentJwt = requireCurrentJwt();
		Instant expiresAt = currentJwt.getExpiresAt();
		if (expiresAt == null) {
			throw new IllegalStateException("Das Token hat kein exp.");
		}
		return expiresAt;
	}

	@Override
	public int currentUsersSessionNumber() {
		Jwt currentJwt = requireCurrentJwt();
		String sessionNumberClaimName = jwtConfig.sessionNumberClaimName();
		Object sessionNumberClaim = currentJwt.getClaim(sessionNumberClaimName);
		if (sessionNumberClaim instanceof Number sessionNumber) {
			return sessionNumber.intValue();
		}
		throw new IllegalStateException("Das Token hat keinen Sitzungs-Claim " + sessionNumberClaimName + ".");
	}

	/**
	 * Baut ein Token nur im Speicher (nie signiert, nie verschickt) mit GUID und Rechten und setzt es für die Dauer von
	 * {@code action} als Anmeldung, mit den Rechten als Authorities {@code ROLE_…} wie aus einem echten Token.
	 */
	@Override
	public void runAsUsers(UUID usersGuid, List<String> accessRoleKeys, Runnable action) {
		Instant issuedAt = Instant.now();
		Duration jwtValidity = jwtConfig.jwtValidity();
		Instant expiresAt = issuedAt.plus(jwtValidity);
		String rolesClaimName = jwtConfig.rolesClaimName();
		String subject = usersGuid.toString();
		// Der Wert des Tokens ist egal: Es wird nie geprüft oder verschickt, nur im SecurityContext gelesen
		Jwt internalJwt = Jwt.withTokenValue("internal").header("alg", "none").subject(subject)
				.claim(rolesClaimName, accessRoleKeys).issuedAt(issuedAt).expiresAt(expiresAt).build();
		List<GrantedAuthority> authorities = new ArrayList<>();
		for (String accessRoleKey : accessRoleKeys) {
			// Fest "ROLE_" wie in der SecurityConfig: hasRole('X') sucht in Spring fest nach "ROLE_X"
			SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + accessRoleKey);
			authorities.add(authority);
		}
		JwtAuthenticationToken internalAuthentication = new JwtAuthenticationToken(internalJwt, authorities);
		SecurityContext internalSecurityContext = SecurityContextHolder.createEmptyContext();
		internalSecurityContext.setAuthentication(internalAuthentication);
		SecurityContextHolder.setContext(internalSecurityContext);
		try {
			action.run();
		} finally {
			SecurityContextHolder.clearContext();
		}
	}

	/** Das Token der laufenden Anfrage, oder {@code null}, wenn niemand angemeldet ist. */
	private Jwt getCurrentJwtOrNull() {
		SecurityContext securityContext = SecurityContextHolder.getContext();
		Authentication authentication = securityContext.getAuthentication();
		if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
			return jwtAuthentication.getToken();
		}
		return null;
	}

	private Jwt requireCurrentJwt() {
		Jwt currentJwt = getCurrentJwtOrNull();
		if (currentJwt == null) {
			throw new IllegalStateException("Kein angemeldeter User: Hier darf nichts nach der Identität fragen.");
		}
		return currentJwt;
	}
}
