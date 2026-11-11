package de.gebiter.security;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

/**
 * Schlüssel, Claims und Cookie der JWTs. Aufbau wie im Vorlageprojekt. Alle Werte kommen aus
 * {@code application.yaml} ({@code gebiter.jwt.*}, {@code gebiter.cookie.*}). Wer sie braucht,
 * bekommt sie hier per Getter.
 * <p>
 * DAS SCHLÜSSELPAAR ENTSTEHT BEI JEDEM START NEU: RSA, nur im Speicher, nirgends in einer Datei,
 * Datenbank oder Konfiguration. Folge: Nach einem Neustart ist jedes vorher ausgestellte JWT
 * ungültig; das Frontend holt sich dann mit dem Refresh-Token ({@link RefreshTokenConfig}) ein neues.
 */
@Configuration
public class JwtConfig {

	private final String jwtCookieName;

	private final boolean cookieSecure;

	/** Name des Claims mit den AccessRole-Keys, aus {@code gebiter.jwt.roles-claim}. */
	private final String rolesClaimName;

	/** Name des Claims mit dem Key der AccessRoleCollection, aus {@code gebiter.jwt.access-role-collection-claim}. */
	private final String accessRoleCollectionClaimName;

	/** Name des Claims mit dem Platz der Sitzung, aus {@code gebiter.jwt.session-number-claim}. */
	private final String sessionNumberClaimName;

	/** Wie lange ein JWT und sein Cookie gelten, aus {@code gebiter.jwt.validity}. */
	private final Duration jwtValidity;

	/**
	 * Nach so langer Zeit ab Ausstellung erneuert das Frontend die Sitzung, aus {@code gebiter.jwt.renewal-interval}. Der
	 * Termin kommt vom Server, F5 ändert ihn nicht; zugleich der Takt der Online-Zeit für Achievements.
	 */
	private final Duration jwtRenewalInterval;

	private final RSAKey rsaKey;

	public JwtConfig(@Value("${gebiter.cookie.jwt-name}") String jwtCookieName,
			@Value("${gebiter.cookie.secure}") boolean cookieSecure,
			@Value("${gebiter.jwt.roles-claim}") String rolesClaimName,
			@Value("${gebiter.jwt.access-role-collection-claim}") String accessRoleCollectionClaimName,
			@Value("${gebiter.jwt.session-number-claim}") String sessionNumberClaimName,
			@Value("${gebiter.jwt.validity}") Duration jwtValidity,
			@Value("${gebiter.jwt.renewal-interval}") Duration jwtRenewalInterval,
			@Value("${gebiter.jwt.rsa-key-size}") int rsaKeySizeBits) {
		this.jwtCookieName = jwtCookieName;
		this.cookieSecure = cookieSecure;
		this.rolesClaimName = rolesClaimName;
		this.accessRoleCollectionClaimName = accessRoleCollectionClaimName;
		this.sessionNumberClaimName = sessionNumberClaimName;
		this.jwtValidity = jwtValidity;
		this.jwtRenewalInterval = jwtRenewalInterval;
		this.rsaKey = generateRsaKey(rsaKeySizeBits);
	}

	public String jwtCookieName() {
		return jwtCookieName;
	}

	public Duration jwtValidity() {
		return jwtValidity;
	}

	public Duration jwtRenewalInterval() {
		return jwtRenewalInterval;
	}

	public String rolesClaimName() {
		return rolesClaimName;
	}

	public String accessRoleCollectionClaimName() {
		return accessRoleCollectionClaimName;
	}

	public String sessionNumberClaimName() {
		return sessionNumberClaimName;
	}

	/**
	 * Das Cookie mit dem JWT: HttpOnly, damit JavaScript das Token nie sieht. {@code secure} kommt
	 * aus der Konfiguration, lokal ohne TLS muss es {@code false} sein.
	 */
	public ResponseCookie jwtCookie(String token, Duration validity) {
		ResponseCookie.ResponseCookieBuilder jwtCookieBuilder = ResponseCookie.from(jwtCookieName, token);
		jwtCookieBuilder.httpOnly(true);
		jwtCookieBuilder.secure(cookieSecure);
		jwtCookieBuilder.sameSite("Lax");
		jwtCookieBuilder.path("/");
		jwtCookieBuilder.maxAge(validity);
		return jwtCookieBuilder.build();
	}

	/** Dasselbe Cookie leer und sofort abgelaufen, zum Abmelden. */
	public ResponseCookie expiredJwtCookie() {
		return jwtCookie("", Duration.ZERO);
	}

	/** Signiert neue JWTs mit dem privaten Schlüssel dieses Starts. */
	@Bean
	public JwtEncoder jwtEncoder() {
		JWKSet jwkSet = new JWKSet(rsaKey);
		JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(jwkSet);
		return new NimbusJwtEncoder(jwkSource);
	}

	/** Prüft Signatur und Ablauf eines JWT mit dem öffentlichen Schlüssel dieses Starts. */
	@Bean
	public JwtDecoder jwtDecoder() {
		RSAPublicKey rsaPublicKey;
		try {
			rsaPublicKey = rsaKey.toRSAPublicKey();
		} catch (JOSEException exception) {
			throw new IllegalStateException("Öffentlicher Schlüssel nicht ableitbar.", exception);
		}
		NimbusJwtDecoder.PublicKeyJwtDecoderBuilder jwtDecoderBuilder = NimbusJwtDecoder.withPublicKey(rsaPublicKey);
		return jwtDecoderBuilder.build();
	}

	private static RSAKey generateRsaKey(int rsaKeySizeBits) {
		KeyPairGenerator keyPairGenerator;
		try {
			// Fest RSA und deshalb keine Einstellung: Alles hier baut auf RSA-Klassen (RSAKey, RSAPublicKey).
			keyPairGenerator = KeyPairGenerator.getInstance("RSA");
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("RSA nicht verfügbar.", exception);
		}
		keyPairGenerator.initialize(rsaKeySizeBits);
		KeyPair keyPair = keyPairGenerator.generateKeyPair();
		RSAPublicKey rsaPublicKey = (RSAPublicKey) keyPair.getPublic();
		RSAPrivateKey rsaPrivateKey = (RSAPrivateKey) keyPair.getPrivate();
		UUID keyId = UUID.randomUUID();
		String keyIdText = keyId.toString();

		RSAKey.Builder rsaKeyBuilder = new RSAKey.Builder(rsaPublicKey);
		rsaKeyBuilder.privateKey(rsaPrivateKey);
		rsaKeyBuilder.keyID(keyIdText);
		return rsaKeyBuilder.build();
	}
}
