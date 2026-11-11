package de.gebiter.security.service;

import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import de.gebiter.exception.MissingConfigurationException;
import de.gebiter.util.Helper;

/**
 * Die Rechnung der Authenticator-App (TOTP nach RFC 6238), ohne Datenbank und ohne Bibliothek, nur mit dem JDK:
 * Geheimnis würfeln, {@code otpauth://}-Adresse für den QR-Code bauen, Codes prüfen, Geheimnisse ver- und entschlüsseln.
 * Erklärt in {@code docu/konzept-2fa-totp.md}.
 * <p>
 * Ein Code: Zeitschritt = Sekunden seit 1970 / Periode; HMAC-SHA1(Geheimnis, Zeitschritt als 8 Bytes); aus dem Ergebnis
 * vier Bytes ab der Stelle, die das letzte halbe Byte nennt, oberstes Bit weg; davon die letzten Stellen. Geprüft werden
 * der aktuelle Schritt und die Nachbarn ({@code gebiter.totp.allowed-time-step-drift}), damit eine leicht falsch gehende
 * Uhr nicht stört. Ein schon benutzter Schritt gilt nie wieder.
 */
@Service
public class TotpService {

	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	/** Wer im QR-Code steht, in der App über dem Code, z. B. {@code gebiter9k}. */
	private final String issuer;

	/** Länge eines neuen Geheimnisses in Bytes (RFC 4226 empfiehlt 20 = 160 Bit). */
	private final int secretBytes;

	/** Stellen eines Codes, meist 6. */
	private final int codeDigits;

	/** Wie lange ein Code gilt, meist 30 s. */
	private final Duration period;

	/** So viele Schritte vor und nach dem aktuellen gelten auch noch. */
	private final int allowedTimeStepDrift;

	/** AES-256-Schlüssel für die Geheimnisse in der Datenbank, Base64 aus der .env; leer heißt: nicht eingerichtet. */
	private final String encryptionKeyBase64;

	/** Bytes des Startwerts (IV) je Verschlüsselung, für AES-GCM fest 12. */
	private final int encryptionIvBytes;

	/** Länge der Prüfsumme von AES-GCM in Bit, fest 128. */
	private final int encryptionTagBits;

	public TotpService(@Value("${gebiter.totp.issuer}") String issuer,
			@Value("${gebiter.totp.secret-bytes}") int secretBytes, @Value("${gebiter.totp.code-digits}") int codeDigits,
			@Value("${gebiter.totp.period}") Duration period,
			@Value("${gebiter.totp.allowed-time-step-drift}") int allowedTimeStepDrift,
			@Value("${gebiter.totp.encryption-key}") String encryptionKeyBase64,
			@Value("${gebiter.totp.encryption-iv-bytes}") int encryptionIvBytes,
			@Value("${gebiter.totp.encryption-tag-bits}") int encryptionTagBits) {
		this.issuer = issuer;
		this.secretBytes = secretBytes;
		this.codeDigits = codeDigits;
		this.period = period;
		this.allowedTimeStepDrift = allowedTimeStepDrift;
		this.encryptionKeyBase64 = encryptionKeyBase64;
		this.encryptionIvBytes = encryptionIvBytes;
		this.encryptionTagBits = encryptionTagBits;
	}

	/** Wer im QR-Code steht, z. B. {@code gebiter9k}. */
	public String getIssuer() {
		return issuer;
	}

	/** CREATE: Ein neues Geheimnis aus dem sicheren Zufall. */
	public byte[] createSecret() {
		byte[] secret = new byte[secretBytes];
		SECURE_RANDOM.nextBytes(secret);
		return secret;
	}

	/**
	 * READ: Die Adresse für den QR-Code, die jede TOTP-App versteht (Google, Microsoft, Aegis …), z. B.
	 * {@code otpauth://totp/gebiter9k:alice?secret=…&issuer=gebiter9k&algorithm=SHA1&digits=6&period=30}.
	 */
	public String createOtpauthUri(byte[] secret, String accountName) {
		String secretBase32 = Helper.encodeBase32(secret);
		String encodedIssuer = encodeUriComponent(issuer);
		String encodedAccountName = encodeUriComponent(accountName);
		// Doppelpunkt zwischen Aussteller und Konto im Klartext: Das verstehen alle Apps sicher
		String encodedLabel = encodedIssuer + ":" + encodedAccountName;
		long periodSeconds = period.toSeconds();
		// fest nach dem Key-URI-Format der Authenticator-Apps: Schema, Typ und Namen der Parameter
		return "otpauth://totp/" + encodedLabel + "?secret=" + secretBase32 + "&issuer=" + encodedIssuer
				+ "&algorithm=SHA1&digits=" + codeDigits + "&period=" + periodSeconds;
	}

	/**
	 * READ: Passt der Code zum Geheimnis, jetzt oder einen erlaubten Schritt daneben? Liefert den Zeitschritt, zu dem er
	 * passt, sonst {@code null}. Schritte bis einschließlich {@code lastUsedTimeStep} zählen nicht (kein zweites Mal).
	 *
	 * @param code die Ziffern aus der App, Leerzeichen erlaubt
	 * @param lastUsedTimeStep der zuletzt angenommene Schritt, {@code null} wenn noch keiner
	 */
	public Long findMatchingTimeStep(byte[] secret, String code, Long lastUsedTimeStep) {
		if (code == null) {
			return null;
		}
		String codeWithoutSpaces = code.replace(" ", "");
		boolean wellFormed = codeWithoutSpaces.length() == codeDigits && codeWithoutSpaces.chars().allMatch(Character::isDigit);
		if (!wellFormed) {
			return null;
		}
		byte[] enteredCodeBytes = codeWithoutSpaces.getBytes(StandardCharsets.US_ASCII);
		long currentTimeStep = getCurrentTimeStep();
		for (long timeStep = currentTimeStep - allowedTimeStepDrift; timeStep <= currentTimeStep
				+ allowedTimeStepDrift; timeStep++) {
			boolean alreadyUsed = lastUsedTimeStep != null && timeStep <= lastUsedTimeStep;
			if (alreadyUsed) {
				continue;
			}
			String expectedCode = createCode(secret, timeStep, codeDigits);
			byte[] expectedCodeBytes = expectedCode.getBytes(StandardCharsets.US_ASCII);
			// in konstanter Zeit, damit die Antwortzeit nichts über richtige Ziffern verrät
			boolean matches = MessageDigest.isEqual(expectedCodeBytes, enteredCodeBytes);
			if (matches) {
				return timeStep;
			}
		}
		return null;
	}

	/** READ: Der aktuelle 30-Sekunden-Schritt (Sekunden seit 1970 / Periode). */
	public long getCurrentTimeStep() {
		long epochSeconds = Instant.now().getEpochSecond();
		long periodSeconds = period.toSeconds();
		return epochSeconds / periodSeconds;
	}

	/** READ: Der Code für einen Zeitschritt, mit führenden Nullen (RFC 4226, „dynamic truncation“). */
	public String createCode(byte[] secret, long timeStep, int digitCount) {
		byte[] timeStepBytes = ByteBuffer.allocate(8).putLong(timeStep).array();
		byte[] hmac;
		try {
			// fest nach RFC 6238: HMAC-SHA1, das rechnen alle Authenticator-Apps mit algorithm=SHA1
			Mac hmacSha1 = Mac.getInstance("HmacSHA1");
			SecretKeySpec hmacKey = new SecretKeySpec(secret, "HmacSHA1");
			hmacSha1.init(hmacKey);
			hmac = hmacSha1.doFinal(timeStepBytes);
		} catch (GeneralSecurityException exception) {
			throw new IllegalStateException("HmacSHA1 fehlt im JDK.", exception);
		}
		int offset = hmac[hmac.length - 1] & 0x0f;
		int truncatedNumber = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16)
				| ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
		long modulus = (long) Math.pow(10, digitCount);
		long codeNumber = truncatedNumber % modulus;
		String codeText = Long.toString(codeNumber);
		int missingLeadingZeros = digitCount - codeText.length();
		String leadingZeros = "0".repeat(missingLeadingZeros);
		return leadingZeros + codeText;
	}

	/**
	 * CREATE: Verschlüsselt ein Geheimnis für die Datenbank (AES-GCM, neuer Startwert je Aufruf): Base64 aus Startwert und
	 * Geheimtext.
	 *
	 * @throws MissingConfigurationException wenn TOTP_ENCRYPTION_KEY in der .env fehlt
	 */
	public String encryptSecret(byte[] secret) {
		SecretKeySpec encryptionKey = getEncryptionKey();
		byte[] iv = new byte[encryptionIvBytes];
		SECURE_RANDOM.nextBytes(iv);
		try {
			Cipher aesGcm = Cipher.getInstance("AES/GCM/NoPadding");
			GCMParameterSpec gcmParameters = new GCMParameterSpec(encryptionTagBits, iv);
			aesGcm.init(Cipher.ENCRYPT_MODE, encryptionKey, gcmParameters);
			byte[] encryptedSecret = aesGcm.doFinal(secret);
			ByteBuffer ivAndEncryptedSecret = ByteBuffer.allocate(iv.length + encryptedSecret.length);
			ivAndEncryptedSecret.put(iv);
			ivAndEncryptedSecret.put(encryptedSecret);
			byte[] ivAndEncryptedSecretBytes = ivAndEncryptedSecret.array();
			return Base64.getEncoder().encodeToString(ivAndEncryptedSecretBytes);
		} catch (GeneralSecurityException exception) {
			throw new IllegalStateException("Das Geheimnis ließ sich nicht verschlüsseln.", exception);
		}
	}

	/**
	 * READ: Entschlüsselt ein Geheimnis aus der Datenbank.
	 *
	 * @throws MissingConfigurationException wenn TOTP_ENCRYPTION_KEY fehlt
	 * @throws IllegalStateException wenn es mit diesem Schlüssel nicht aufgeht (Schlüssel in der .env gewechselt)
	 */
	public byte[] decryptSecret(String secretEncrypted) {
		SecretKeySpec encryptionKey = getEncryptionKey();
		byte[] ivAndEncryptedSecret = Base64.getDecoder().decode(secretEncrypted);
		try {
			Cipher aesGcm = Cipher.getInstance("AES/GCM/NoPadding");
			GCMParameterSpec gcmParameters = new GCMParameterSpec(encryptionTagBits, ivAndEncryptedSecret, 0,
					encryptionIvBytes);
			aesGcm.init(Cipher.DECRYPT_MODE, encryptionKey, gcmParameters);
			int encryptedSecretLength = ivAndEncryptedSecret.length - encryptionIvBytes;
			return aesGcm.doFinal(ivAndEncryptedSecret, encryptionIvBytes, encryptedSecretLength);
		} catch (GeneralSecurityException exception) {
			throw new IllegalStateException("Das Geheimnis passt nicht zum Schlüssel in der .env (TOTP_ENCRYPTION_KEY "
					+ "gewechselt?). Authenticator abschalten und neu einrichten.", exception);
		}
	}

	/** Der AES-Schlüssel aus der .env: genau 32 Bytes als Base64 ({@code openssl rand -base64 32}). */
	private SecretKeySpec getEncryptionKey() {
		if (encryptionKeyBase64 == null || encryptionKeyBase64.isBlank()) {
			throw new MissingConfigurationException(
					"TOTP_ENCRYPTION_KEY fehlt in der .env (erzeugen: openssl rand -base64 32), dann Backend neu starten.");
		}
		String trimmedEncryptionKeyBase64 = encryptionKeyBase64.strip();
		byte[] encryptionKeyBytes;
		try {
			encryptionKeyBytes = Base64.getDecoder().decode(trimmedEncryptionKeyBase64);
		} catch (IllegalArgumentException exception) {
			throw new MissingConfigurationException("TOTP_ENCRYPTION_KEY in der .env ist kein Base64.");
		}
		if (encryptionKeyBytes.length != 32) {
			throw new MissingConfigurationException("TOTP_ENCRYPTION_KEY in der .env muss 32 Bytes haben "
					+ "(openssl rand -base64 32), hat " + encryptionKeyBytes.length + ".");
		}
		return new SecretKeySpec(encryptionKeyBytes, "AES");
	}

	/** Prozent-Kodierung für die Adresse; Leerzeichen als {@code %20}, wie die Apps es erwarten (nicht {@code +}). */
	private static String encodeUriComponent(String text) {
		String formEncodedText = URLEncoder.encode(text, StandardCharsets.UTF_8);
		return formEncodedText.replace("+", "%20");
	}
}
