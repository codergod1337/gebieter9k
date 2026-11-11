package de.gebiter.security;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.Cookie;

/**
 * Die Filterkette: wer darf welchen Pfad, und woher kommt das Token. Aufbau wie im Vorlageprojekt.
 * <p>
 * ZUSTANDSLOS: Es gibt keine Server-Sitzung. Jede Anfrage bringt ihr Token selbst mit, im Cookie
 * oder im Header, und wird allein daraus beurteilt. Eine Rechteprüfung kostet deshalb keinen
 * Datenbankzugriff.
 * <p>
 * DREI PFADBEREICHE, je Klasse ein Controller pro Bereich (z. B. {@code AccessRoleController},
 * {@code AccessRoleAdminController}):
 * <ul>
 * <li>{@code /api/share/**} ({@code XShareController}): ohne Token, z. B. Login, 2FA, Registrierung.</li>
 * <li>{@code /api/admin/**} ({@code XAdminController}): nur mit der AR ADMIN
 * ({@code gebiter.accessrole.admin-key}). Sämtliche Admin-Endpunkte liegen hier und nur hier.</li>
 * <li>{@code /api/**} ({@code XController}): jeder angemeldete User mit der AR USER
 * ({@code gebiter.accessrole.user-key}) oder ADMIN. Einzelne Pfade lassen sich später gezielt auf weitere Rollen
 * beschränken, pauschal gibt es keinen Pfad je Rolle.</li>
 * <li>{@code /api/file-manager/**}: die AR FILE_MANAGER ({@code gebiter.accessrole.file-manager-key}) oder ADMIN. Die
 * Stufe zwischen User und Admin (Wunsch des Nutzers 2026-11-08): Der File-Manager verwaltet jede Datei, ist aber kein
 * Admin.</li>
 * </ul>
 * Alles andere ist verboten: Ein Endpunkt, der versehentlich woanders entsteht, ist nicht erreichbar.
 * <p>
 * Springs eingebautes CSRF bleibt aus, es braucht eine Server-Sitzung. Der eigene Schutz über Cookie
 * und Header kommt mit dem Login.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	private final JwtConfig jwtConfig;

	/** Woher das Frontend im Browser kommen darf. */
	private final List<String> corsOrigins;

	/** Die AR, die {@code /api/admin/**} verlangt. */
	private final String adminAccessRoleKey;

	/** Die AR jedes normalen Users, verlangt (oder ADMIN) für {@code /api/**}. */
	private final String userAccessRoleKey;

	/** Die AR des File-Managers, verlangt (oder ADMIN) für {@code /api/file-manager/**}. */
	private final String fileManagerAccessRoleKey;

	public SecurityConfig(JwtConfig jwtConfig, @Value("${gebiter.cors.origins}") List<String> corsOrigins,
			@Value("${gebiter.accessrole.admin-key}") String adminAccessRoleKey,
			@Value("${gebiter.accessrole.user-key}") String userAccessRoleKey,
			@Value("${gebiter.accessrole.file-manager-key}") String fileManagerAccessRoleKey) {
		this.jwtConfig = jwtConfig;
		this.corsOrigins = corsOrigins;
		this.adminAccessRoleKey = adminAccessRoleKey;
		this.userAccessRoleKey = userAccessRoleKey;
		this.fileManagerAccessRoleKey = fileManagerAccessRoleKey;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
		CorsConfigurationSource corsConfigurationSource = createCorsConfigurationSource();
		BearerTokenResolver tokenFromHeaderOrCookie = createTokenFromHeaderOrCookieResolver(jwtDecoder);
		JwtAuthenticationConverter rolesFromClaim = createRolesFromClaimConverter();

		http.cors(cors -> cors.configurationSource(corsConfigurationSource));
		http.csrf(csrf -> csrf.disable());
		http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
		http.authorizeHttpRequests(auth -> {
			// Die Fehlerseite muss erreichbar bleiben, sonst wird aus jedem Fehler ein zweiter.
			auth.requestMatchers("/error").permitAll();
			// Die Reihenfolge zählt: der erste passende Eintrag gewinnt, deshalb /api/** zuletzt.
			auth.requestMatchers("/api/share/**").permitAll();
			auth.requestMatchers("/api/admin/**").hasRole(adminAccessRoleKey);
			auth.requestMatchers("/api/file-manager/**").hasAnyRole(fileManagerAccessRoleKey, adminAccessRoleKey);
			auth.requestMatchers("/api/**").hasAnyRole(userAccessRoleKey, adminAccessRoleKey);
			auth.anyRequest().denyAll();
		});
		http.oauth2ResourceServer(oauth2 -> {
			oauth2.bearerTokenResolver(tokenFromHeaderOrCookie);
			oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(rolesFromClaim));
		});
		return http.build();
	}

	/**
	 * Woher das Token kommt: erst der Header, dann das Cookie.
	 * <p>
	 * DER NORMALFALL IST DAS COOKIE, der Browser schickt es von sich aus mit. Der Header ist für
	 * Werkzeuge wie Bruno.
	 * <p>
	 * EIN UNGÜLTIGES COOKIE ERGIBT {@code null}, also „niemand angemeldet“, keinen Fehler. Nach
	 * einem Neustart sind alle alten Tokens ungültig, weil das Schlüsselpaar neu ist. Löste ein
	 * ungültiges Cookie einen Fehler aus, wäre jede Anfrage abgewiesen, auch die zum Anmelden.
	 * <p>
	 * Ein ausdrücklich gesetzter Header bleibt streng: Ein kaputtes Token dort ist ein echter Fehler.
	 */
	private BearerTokenResolver createTokenFromHeaderOrCookieResolver(JwtDecoder jwtDecoder) {
		DefaultBearerTokenResolver headerTokenResolver = new DefaultBearerTokenResolver();
		String jwtCookieName = jwtConfig.jwtCookieName();

		return request -> {
			String tokenFromHeader = headerTokenResolver.resolve(request);
			if (tokenFromHeader != null) {
				return tokenFromHeader;
			}
			Cookie[] requestCookies = request.getCookies();
			if (requestCookies == null) {
				return null;
			}
			for (Cookie requestCookie : requestCookies) {
				String requestCookieName = requestCookie.getName();
				if (!jwtCookieName.equals(requestCookieName)) {
					continue;
				}
				String tokenFromCookie = requestCookie.getValue();
				boolean tokenFromCookieValid = isTokenValid(jwtDecoder, tokenFromCookie);
				if (!tokenFromCookieValid) {
					return null;
				}
				return tokenFromCookie;
			}
			return null;
		};
	}

	/** Lässt sich das Token prüfen, und stimmen Signatur und Ablauf? */
	private boolean isTokenValid(JwtDecoder jwtDecoder, String token) {
		try {
			jwtDecoder.decode(token);
			return true;
		} catch (Exception exception) {
			return false;
		}
	}

	/**
	 * Macht aus jedem AccessRole-Key im Rollen-Claim ({@code gebiter.jwt.roles-claim}) eine Berechtigung
	 * MIT Präfix {@code ROLE_}, wie im Vorlageprojekt: Aus {@code ADMIN} wird {@code ROLE_ADMIN}.
	 * <p>
	 * Geprüft werden kann damit auf zwei Arten: {@code hasRole('ADMIN')} (Spring hängt {@code ROLE_}
	 * selbst an) oder {@code hasAuthority('ROLE_ADMIN')}. NICHT mehr: {@code hasAuthority('ADMIN')},
	 * das greift nie.
	 * <p>
	 * Das Präfix trennt die Rollen von Springs eigenen Einträgen in derselben Liste, z. B.
	 * {@code FACTOR_BEARER}. Ein Recht mit Key {@code FACTOR_OTT} wird so zu {@code ROLE_FACTOR_OTT}
	 * und kann nie für einen Anmeldefaktor gehalten werden.
	 * <p>
	 * Es gibt keine Abstufungen und keine Vererbung zwischen Rollen. Eine Prüfung fragt nur: Hat er
	 * diesen Key?
	 */
	private JwtAuthenticationConverter createRolesFromClaimConverter() {
		String rolesClaimName = jwtConfig.rolesClaimName();
		JwtAuthenticationConverter rolesFromClaimConverter = new JwtAuthenticationConverter();
		rolesFromClaimConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
			Set<GrantedAuthority> grantedAuthorities = new LinkedHashSet<>();
			List<String> accessRoleKeys = jwt.getClaimAsStringList(rolesClaimName);
			if (accessRoleKeys == null) {
				return List.of();
			}
			for (String accessRoleKey : accessRoleKeys) {
				// Fest "ROLE_" und deshalb keine Einstellung: hasRole('X') sucht in Spring fest nach "ROLE_X".
				String roleAuthority = "ROLE_" + accessRoleKey;
				SimpleGrantedAuthority grantedAuthority = new SimpleGrantedAuthority(roleAuthority);
				grantedAuthorities.add(grantedAuthority);
			}
			return List.copyOf(grantedAuthorities);
		});
		return rolesFromClaimConverter;
	}

	/**
	 * CORS für das Frontend. {@code allowCredentials} ist Pflicht, sonst schickt der Browser die
	 * Cookies über die Herkunftsgrenze nicht mit. Dafür müssen die erlaubten Herkünfte einzeln
	 * aufgezählt sein, ein Sternchen ist nicht zulässig.
	 */
	private CorsConfigurationSource createCorsConfigurationSource() {
		List<String> allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
		List<String> allowedHeaders = List.of("*");

		CorsConfiguration corsConfiguration = new CorsConfiguration();
		corsConfiguration.setAllowedOrigins(corsOrigins);
		corsConfiguration.setAllowedMethods(allowedMethods);
		corsConfiguration.setAllowedHeaders(allowedHeaders);
		corsConfiguration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource corsConfigurationSource = new UrlBasedCorsConfigurationSource();
		corsConfigurationSource.registerCorsConfiguration("/**", corsConfiguration);
		return corsConfigurationSource;
	}
}
