package de.gebiter.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Collection;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Globale Hilfsklasse für wiederkehrende Prüfungen und Umwandlungen. Weitere Hilfsmethoden
 * kommen hier dazu.
 */
public final class Helper {

	private static final Logger LOGGER = LoggerFactory.getLogger(Helper.class);

	/**
	 * KEY-REGEL für sämtliche Keys im Projekt: nur Großbuchstaben, Ziffern und Unterstriche;
	 * Anfang und Ende müssen ein Großbuchstabe sein (also weder Ziffer noch Unterstrich).
	 * Gültig z. B. {@code ADMIN}, {@code USER_CREATE}, {@code LEVEL_2_BADGE}.
	 */
	private static final Pattern KEY_PATTERN = Pattern.compile("[A-Z](?:[A-Z0-9_]*[A-Z])?");

	/** SHA-256 als Hex-Text: genau 64 Zeichen 0–9 und a–f (nach Umwandlung in Kleinbuchstaben). */
	private static final Pattern SHA256_HEX_PATTERN = Pattern.compile("[0-9a-f]{64}");

	/** Leerzeichen und Tabs am Ende einer Zeile. */
	private static final Pattern TRAILING_SPACES_PATTERN = Pattern.compile("[ \\t]+(?=\\R)");

	/** Mehrere Zeilenumbrüche hintereinander, also Leerzeilen. */
	private static final Pattern REPEATED_LINE_BREAKS_PATTERN = Pattern.compile("\\R{2,}");

	/**
	 * FELDNAMEN-REGEL für Solr-Felder: Anfang ein kleiner Buchstabe, danach Buchstaben und Ziffern, höchstens 100
	 * Zeichen (camelCase, z. B. {@code authorUsersGuid}). Kein Unterstrich: Namen wie {@code _version_} gehören Solr.
	 */
	private static final Pattern SOLR_FIELD_NAME_PATTERN = Pattern.compile("[a-z][A-Za-z0-9]{0,99}");

	/** Ein Graphem, also ein Zeichen, wie der Mensch es sieht (ein Emoji samt Hautton, Verbinder und Variante). */
	private static final Pattern SINGLE_GRAPHEME_PATTERN = Pattern.compile("\\X");

	/** Woran ein Emoji zu erkennen ist: ein Bildzeichen, eine Flagge (Regionalbuchstaben) oder eine Tastenkappe. */
	private static final Pattern EMOJI_CHARACTER_PATTERN = Pattern
			.compile("[\\p{IsExtended_Pictographic}\\p{IsEmoji_Presentation}\\x{1F1E6}-\\x{1F1FF}\\x{20E3}]");

	/**
	 * Paket und Name eines Symbols (Icon-Manager): kleine Buchstaben und Ziffern, durch einzelne Bindestriche getrennt,
	 * höchstens 120 Zeichen, z. B. {@code gameicons} und {@code 3d-glasses}. So, wie die Icon-Pakete sie nennen.
	 */
	private static final Pattern SYMBOL_PART_PATTERN = Pattern.compile("(?=.{1,120}$)[a-z0-9]+(?:-[a-z0-9]+)*");

	/** Eine Farbe als Hex-Text {@code #rrggbb}, z. B. {@code #e9ff3b}, wie sie ein Farbwähler im Browser liefert. */
	private static final Pattern HEX_COLOR_PATTERN = Pattern.compile("#[0-9a-fA-F]{6}");

	/**
	 * ENDUNGS-REGEL für Dateiendungen ({@code FileExtension}): klein, ohne Punkt, nur Buchstaben und Ziffern, höchstens
	 * 20 Zeichen, z. B. {@code jpg}, {@code mp4}. Die Key-Regel passt hier nicht, sie verlangt Großbuchstaben.
	 */
	private static final Pattern FILE_EXTENSION_PATTERN = Pattern.compile("[a-z0-9]{1,20}");

	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private Helper() {
	}

	/**
	 * Erzeugt eine neue UUID Version 7 nach RFC 9562: vorne die Unix-Zeit in Millisekunden, dahinter
	 * Zufall. Neue GUIDs sind dadurch zeitlich sortiert, das hält den Index in der Datenbank kompakt.
	 */
	public static UUID createUuidVersion7() {
		// Obere 64 Bit: 48 Bit Zeit, 4 Bit Version (7), 12 Bit Zufall
		long unixTimeMillis = System.currentTimeMillis();
		long timestampBits = (unixTimeMillis & 0xFFFF_FFFF_FFFFL) << 16;
		long versionBits = 0x7000L;
		int randomForUpperBits = SECURE_RANDOM.nextInt();
		long randomUpperBits = randomForUpperBits & 0x0FFFL;
		long mostSignificantBits = timestampBits | versionBits | randomUpperBits;

		// Untere 64 Bit: 2 Bit Variante (binär 10), 62 Bit Zufall
		long variantBits = 0x8000_0000_0000_0000L;
		long randomForLowerBits = SECURE_RANDOM.nextLong();
		long randomLowerBits = randomForLowerBits & 0x3FFF_FFFF_FFFF_FFFFL;
		long leastSignificantBits = variantBits | randomLowerBits;

		return new UUID(mostSignificantBits, leastSignificantBits);
	}

	/**
	 * Gibt {@code value} unverändert zurück, wenn es nicht {@code null} ist. Für Pflichtfelder aus einem
	 * Request.
	 *
	 * @throws IllegalArgumentException wenn {@code value} {@code null} ist
	 */
	public static <T> T requireNotNull(T value, String fieldName) {
		if (value == null) {
			throw new IllegalArgumentException("Das Feld \"" + fieldName + "\" fehlt.");
		}
		return value;
	}

	/**
	 * Gibt {@code value} unverändert zurück, wenn es Text enthält. Für Pflichtfelder aus einem
	 * Request.
	 *
	 * @throws IllegalArgumentException wenn {@code value} {@code null}, leer oder nur Leerzeichen ist
	 */
	public static String requireNotBlank(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException("Das Feld \"" + fieldName + "\" darf nicht leer sein.");
		}
		return value;
	}

	/**
	 * Gibt den mehrsprachigen Text {@code multilingualText} unverändert zurück, wenn er in der Sprache
	 * {@code requiredLanguageCode} Text enthält. Ein mehrsprachiger Text ist ein JSON-Objekt mit dem
	 * Sprachkürzel als Schlüssel, z. B. {@code {"de": "Admin"}}. Die Pflichtsprache steht in
	 * {@code gebiter.language.default-code}.
	 *
	 * @throws IllegalArgumentException wenn der Text fehlt oder in der Pflichtsprache leer ist
	 */
	public static Map<String, String> requireMultilingualText(Map<String, String> multilingualText, String fieldName,
			String requiredLanguageCode) {
		requireNotNull(multilingualText, fieldName);
		String requiredLanguageText = multilingualText.get(requiredLanguageCode);
		String requiredLanguageFieldName = fieldName + "." + requiredLanguageCode;
		requireNotBlank(requiredLanguageText, requiredLanguageFieldName);
		return multilingualText;
	}

	/**
	 * Gibt {@code solrFieldName} unverändert zurück, wenn er der Feldnamen-Regel für Solr entspricht.
	 *
	 * @throws IllegalArgumentException wenn nicht
	 */
	public static String requireValidSolrFieldName(String solrFieldName) {
		boolean validSolrFieldName = solrFieldName != null && SOLR_FIELD_NAME_PATTERN.matcher(solrFieldName).matches();
		if (!validSolrFieldName) {
			throw new IllegalArgumentException("Ungültiger Feldname \"" + solrFieldName + "\": Anfang ein kleiner "
					+ "Buchstabe, danach Buchstaben und Ziffern, höchstens 100 Zeichen (z. B. authorUsersGuid).");
		}
		return solrFieldName;
	}

	/** Entspricht {@code key} der Key-Regel? {@code null} ist nie gültig. */
	public static boolean isValidKey(String key) {
		return key != null && KEY_PATTERN.matcher(key).matches();
	}

	/**
	 * Gibt {@code key} unverändert zurück, wenn er der Key-Regel entspricht.
	 *
	 * @throws IllegalArgumentException wenn nicht
	 */
	public static String requireValidKey(String key) {
		if (!isValidKey(key)) {
			throw new IllegalArgumentException("Ungültiger Key \"" + key + "\": erlaubt sind Großbuchstaben, "
					+ "Ziffern und Unterstriche; Anfang und Ende müssen ein Großbuchstabe sein.");
		}
		return key;
	}

	/**
	 * Macht aus einer Eingabe einen Key: Leerzeichen am Rand entfernen, in Großbuchstaben umwandeln,
	 * dann gegen die Key-Regel prüfen. Für Eingaben von außen, z. B. aus einem Request.
	 *
	 * @throws IllegalArgumentException wenn das Ergebnis nicht der Key-Regel entspricht
	 */
	public static String parseKey(String rawKey) {
		if (rawKey == null) {
			// null ist nie gültig: requireValidKey wirft die übliche Fehlermeldung.
			return requireValidKey(rawKey);
		}
		String trimmedKey = rawKey.trim();
		String upperCaseKey = trimmedKey.toUpperCase(Locale.ROOT);
		return requireValidKey(upperCaseKey);
	}

	/** Entspricht {@code fileExtension} der Endungs-Regel (klein, ohne Punkt)? {@code null} ist nie gültig. */
	public static boolean isValidFileExtension(String fileExtension) {
		return fileExtension != null && FILE_EXTENSION_PATTERN.matcher(fileExtension).matches();
	}

	/**
	 * Gibt {@code fileExtension} unverändert zurück, wenn sie der Endungs-Regel entspricht.
	 *
	 * @throws IllegalArgumentException wenn nicht
	 */
	public static String requireValidFileExtension(String fileExtension) {
		if (!isValidFileExtension(fileExtension)) {
			throw new IllegalArgumentException("Ungültige Endung \"" + fileExtension + "\": erlaubt sind kleine "
					+ "Buchstaben und Ziffern ohne Punkt, höchstens 20 Zeichen (z. B. jpg).");
		}
		return fileExtension;
	}

	/**
	 * Schreibt Bytes als Base32 nach RFC 4648, ohne Füllzeichen, z. B. das Geheimnis einer Authenticator-App: So erwarten
	 * es die Apps im QR-Code und beim Abtippen (nur A–Z und 2–7, keine leicht verwechselbaren Zeichen).
	 */
	public static String encodeBase32(byte[] bytes) {
		requireNotNull(bytes, "bytes");
		String base32Alphabet = getBase32Alphabet();
		StringBuilder base32Text = new StringBuilder();
		int bitBuffer = 0;
		int bitCount = 0;
		for (byte currentByte : bytes) {
			bitBuffer = (bitBuffer << 8) | (currentByte & 0xff);
			bitCount = bitCount + 8;
			while (bitCount >= 5) {
				int alphabetIndex = (bitBuffer >> (bitCount - 5)) & 0x1f;
				char base32Character = base32Alphabet.charAt(alphabetIndex);
				base32Text.append(base32Character);
				bitCount = bitCount - 5;
			}
		}
		if (bitCount > 0) {
			int alphabetIndex = (bitBuffer << (5 - bitCount)) & 0x1f;
			char base32Character = base32Alphabet.charAt(alphabetIndex);
			base32Text.append(base32Character);
		}
		return base32Text.toString();
	}

	/**
	 * Ein Text ohne Leerzeilen: Leerzeichen am Zeilenende weg, mehrere Zeilenumbrüche hintereinander zu einem, vorn und
	 * hinten getrimmt. Z. B. für den Text, den Tika liest: Die Texterkennung liefert viele Leerzeilen (Wunsch des Nutzers
	 * 2026-11-08: jeden mehrfachen Zeilenumbruch heraus).
	 */
	public static String removeBlankLines(String text) {
		return doRemoveBlankLines(text);
	}

	/**
	 * Ein Tag in seiner einheitlichen Form: ohne Leerzeichen außen und ohne führende Raute ({@code #sky} wird {@code sky};
	 * die Raute zeigt nur die Oberfläche). Sonst wären {@code #sky} und {@code sky} zwei Tags, die Suche nach {@code sky}
	 * fände nichts, und die Zählung je FileClass zerfiele. Leer, wenn nichts übrig bleibt.
	 */
	public static String normalizeTag(String tag) {
		if (tag == null) {
			return "";
		}
		String strippedTag = tag.strip();
		int firstNonHashIndex = 0;
		while (firstNonHashIndex < strippedTag.length() && strippedTag.charAt(firstNonHashIndex) == '#') {
			firstNonHashIndex = firstNonHashIndex + 1;
		}
		String tagWithoutHash = strippedTag.substring(firstNonHashIndex);
		return tagWithoutHash.strip();
	}

	private static String doRemoveBlankLines(String text) {
		requireNotNull(text, "text");
		Matcher trailingSpacesMatcher = TRAILING_SPACES_PATTERN.matcher(text);
		String textWithoutTrailingSpaces = trailingSpacesMatcher.replaceAll("");
		Matcher repeatedLineBreaksMatcher = REPEATED_LINE_BREAKS_PATTERN.matcher(textWithoutTrailingSpaces);
		String textWithoutBlankLines = repeatedLineBreaksMatcher.replaceAll("\n");
		return textWithoutBlankLines.strip();
	}

	/**
	 * Liest Base32 nach RFC 4648 zurück in Bytes, das Gegenstück zu {@link #encodeBase32(byte[])}, z. B. den Schlüssel einer
	 * Authenticator-App, den der User abgetippt hat. Groß- und Kleinschreibung egal; Leerzeichen, Bindestriche und
	 * Füllzeichen ({@code =}) werden übersprungen (der Schlüssel wird in Viererblöcken angezeigt).
	 *
	 * @throws IllegalArgumentException wenn ein Zeichen nicht zum Alphabet gehört (A–Z und 2–7)
	 */
	public static byte[] decodeBase32(String base32Text) {
		requireNotNull(base32Text, "base32Text");
		String base32Alphabet = getBase32Alphabet();
		String upperCaseText = base32Text.toUpperCase(Locale.ROOT);
		ByteArrayOutputStream decodedBytes = new ByteArrayOutputStream();
		int bitBuffer = 0;
		int bitCount = 0;
		for (int characterIndex = 0; characterIndex < upperCaseText.length(); characterIndex++) {
			char base32Character = upperCaseText.charAt(characterIndex);
			boolean separator = Character.isWhitespace(base32Character) || base32Character == '-'
					|| base32Character == '=';
			if (separator) {
				continue;
			}
			int alphabetIndex = base32Alphabet.indexOf(base32Character);
			if (alphabetIndex < 0) {
				throw new IllegalArgumentException("Der Schlüssel darf nur A bis Z und 2 bis 7 enthalten.");
			}
			bitBuffer = (bitBuffer << 5) | alphabetIndex;
			bitCount = bitCount + 5;
			if (bitCount >= 8) {
				int decodedByte = (bitBuffer >> (bitCount - 8)) & 0xff;
				decodedBytes.write(decodedByte);
				bitCount = bitCount - 8;
			}
		}
		// übrige Bits (weniger als 8) sind Auffüllung am Ende
		return decodedBytes.toByteArray();
	}

	/** Das Alphabet von Base32, fest nach RFC 4648: nur A–Z und 2–7, keine leicht verwechselbaren Zeichen. */
	private static String getBase32Alphabet() {
		return "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	}

	/**
	 * Löscht eine Temp-Datei, falls es sie gibt; {@code null} wird übergangen. Scheitert das Löschen, steht es im Log und die
	 * Datei bleibt liegen (den Temp-Ordner räumt das Betriebssystem), der Aufrufer muss nichts abfangen.
	 */
	public static void deleteTempFile(Path tempFile) {
		if (tempFile == null) {
			return;
		}
		try {
			Files.deleteIfExists(tempFile);
		} catch (IOException exception) {
			LOGGER.warn("Temp-Datei {} ließ sich nicht löschen: {}", tempFile, exception.toString());
		}
	}

	/** Ist {@code value} ein SHA-256-Wert als Hex-Text (64 Zeichen, Groß- oder Kleinbuchstaben)? */
	public static boolean isSha256Hex(String value) {
		if (value == null) {
			return false;
		}
		String lowerCaseValue = value.toLowerCase(Locale.ROOT);
		return SHA256_HEX_PATTERN.matcher(lowerCaseValue).matches();
	}

	/**
	 * Gibt einen SHA-256-Hex-Wert einheitlich in Kleinbuchstaben zurück, damit derselbe Wert immer
	 * gleich gehasht und verglichen wird.
	 *
	 * @throws IllegalArgumentException wenn {@code value} kein SHA-256-Hex-Wert ist
	 */
	public static String requireSha256Hex(String value) {
		if (!isSha256Hex(value)) {
			throw new IllegalArgumentException("Kein SHA-256-Hex-Wert: erwartet werden genau 64 Zeichen 0–9 und a–f.");
		}
		return value.toLowerCase(Locale.ROOT);
	}

	/**
	 * Prüft Paket oder Name eines Symbols gegen die Symbol-Regel ({@code gameicons}, {@code 3d-glasses}).
	 *
	 * @throws IllegalArgumentException wenn der Wert fehlt oder die Regel verletzt
	 */
	public static String requireValidSymbolPart(String value, String fieldName) {
		boolean validSymbolPart = value != null && SYMBOL_PART_PATTERN.matcher(value).matches();
		if (!validSymbolPart) {
			throw new IllegalArgumentException("Ungültiges Feld \"" + fieldName + "\": erlaubt sind kleine Buchstaben und "
					+ "Ziffern, durch einzelne Bindestriche getrennt, höchstens 120 Zeichen.");
		}
		return value;
	}

	/**
	 * Gibt eine Farbe als Hex-Text in Kleinbuchstaben zurück, z. B. {@code #E9FF3B} wird {@code #e9ff3b}.
	 *
	 * @throws IllegalArgumentException wenn der Wert fehlt oder nicht {@code #rrggbb} ist
	 */
	public static String requireValidHexColor(String value, String fieldName) {
		boolean validHexColor = value != null && HEX_COLOR_PATTERN.matcher(value).matches();
		if (!validHexColor) {
			throw new IllegalArgumentException("Ungültige Farbe in \"" + fieldName + "\": erwartet wird #rrggbb, z. B. "
					+ "#e9ff3b.");
		}
		return value.toLowerCase(Locale.ROOT);
	}

	/**
	 * Prüft eine neue Reihenfolge (Drag and Drop in einer Liste): {@code keysInOrder} muss jeden Key aus
	 * {@code existingKeys} genau einmal enthalten und sonst nichts. So geht beim Verschieben nie ein Eintrag verloren, und
	 * eine veraltete Liste (ein anderer Admin hat inzwischen etwas angelegt) fliegt auf.
	 *
	 * @throws IllegalArgumentException wenn ein Key fehlt, doppelt oder unbekannt ist
	 */
	public static List<String> requireCompleteKeyOrder(List<String> keysInOrder, Collection<String> existingKeys,
			String fieldName) {
		requireNotNull(keysInOrder, fieldName);
		Set<String> seenKeys = new HashSet<>();
		for (String key : keysInOrder) {
			boolean knownKey = existingKeys.contains(key);
			boolean firstTimeSeen = seenKeys.add(key);
			if (!knownKey || !firstTimeSeen) {
				throw new IllegalArgumentException("Die Reihenfolge in \"" + fieldName + "\" passt nicht zum Stand der "
						+ "Datenbank (" + key + "). Bitte neu laden.");
			}
		}
		boolean everyKeyListed = seenKeys.size() == existingKeys.size();
		if (!everyKeyListed) {
			throw new IllegalArgumentException("Die Reihenfolge in \"" + fieldName + "\" ist unvollständig. Bitte neu "
					+ "laden.");
		}
		return keysInOrder;
	}

	/**
	 * Ein neuer Zufallswert für den Login, z. B. der Anmeldeschein der 2FA oder ein Refresh-Token: {@code tokenBytes} Byte
	 * aus {@link SecureRandom} als base64url ohne Padding. Passt so ohne Umkodierung in einen Link. Der Klartext geht
	 * einmal nach draußen, gespeichert wird nur sein SHA-256 ({@link #createSha256Hex(String)}).
	 *
	 * @param tokenBytes wie viele Byte Zufall, {@code gebiter.login.token-bytes}
	 */
	public static String createRandomLoginToken(int tokenBytes) {
		byte[] randomBytes = new byte[tokenBytes];
		SECURE_RANDOM.nextBytes(randomBytes);
		Base64.Encoder urlSafeEncoderWithoutPadding = Base64.getUrlEncoder().withoutPadding();
		return urlSafeEncoderWithoutPadding.encodeToString(randomBytes);
	}

	/**
	 * Hasht {@code plainText} mit SHA-256 und gibt den Wert als Hex-Text in Kleinbuchstaben zurück (64
	 * Zeichen). Das Backend macht damit dasselbe wie das Frontend mit einem Passwort, z. B. für das
	 * Startpasswort des Admin-Kontos.
	 */
	public static String createSha256Hex(String plainText) {
		MessageDigest sha256Digest;
		try {
			sha256Digest = MessageDigest.getInstance("SHA-256");
		} catch (NoSuchAlgorithmException exception) {
			// Jede Java-Laufzeit muss SHA-256 anbieten, das tritt praktisch nie ein.
			throw new IllegalStateException("SHA-256 fehlt in dieser Java-Laufzeit.", exception);
		}
		byte[] plainTextBytes = plainText.getBytes(StandardCharsets.UTF_8);
		byte[] sha256Bytes = sha256Digest.digest(plainTextBytes);
		HexFormat lowerCaseHexFormat = HexFormat.of();
		return lowerCaseHexFormat.formatHex(sha256Bytes);
	}

	/**
	 * Prüft, dass {@code emoji} genau ein Standard-Emoji ist, etwa für eine Smiley-Reaktion im Gästebuch: ein einziges
	 * Graphem (ein Zeichen, wie der Mensch es sieht, auch mit Hautton oder Verbinder) mit einem Bildzeichen, einer Flagge
	 * oder einer Tastenkappe darin. Text, mehrere Emojis oder Leerzeichen gehen nicht.
	 *
	 * @return das Emoji ohne Leerzeichen außen
	 * @throws IllegalArgumentException wenn es fehlt oder nicht genau ein Emoji ist
	 */
	public static String requireSingleEmoji(String emoji, String fieldName) {
		if (emoji == null || emoji.isBlank()) {
			throw new IllegalArgumentException("Das Feld \"" + fieldName + "\" fehlt.");
		}
		String strippedEmoji = emoji.strip();
		Matcher graphemeMatcher = SINGLE_GRAPHEME_PATTERN.matcher(strippedEmoji);
		int graphemeCount = 0;
		while (graphemeMatcher.find()) {
			graphemeCount = graphemeCount + 1;
		}
		Matcher emojiCharacterMatcher = EMOJI_CHARACTER_PATTERN.matcher(strippedEmoji);
		boolean containsEmojiCharacter = emojiCharacterMatcher.find();
		boolean singleEmoji = graphemeCount == 1 && containsEmojiCharacter;
		if (!singleEmoji) {
			throw new IllegalArgumentException("Im Feld \"" + fieldName + "\" muss genau ein Emoji stehen.");
		}
		return strippedEmoji;
	}
}
