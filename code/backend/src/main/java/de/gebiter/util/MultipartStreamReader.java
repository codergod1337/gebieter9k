package de.gebiter.util;

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Liest einen {@code multipart/form-data}-Body als Strom, Teil für Teil, ohne ihn irgendwo abzulegen. Spring und Tomcat
 * schreiben einen Multipart-Request erst komplett in Temp-Dateien, bevor der Controller ihn sieht: Bei 50 GB hieße das,
 * erst nach dem ganzen Upload prüfen und die Datei danach noch einmal lesen. Hier sieht der Aufrufer jeden Teil in
 * dem Moment, in dem er ankommt, und liest dessen Inhalt als {@link InputStream} direkt vom Netz. Commons FileUpload 2
 * kann das auch, gibt es aber nur als Milestone (Stand 2026-11-08: 2.0.0-M5).
 * <p>
 * Ablauf: {@link #nextPart()} springt zum nächsten Teil und liest dessen Kopfzeilen (Name, Dateiname, Typ), danach
 * liefert {@link #getPartContent()} den Inhalt bis zur nächsten Grenze. Was der Aufrufer davon nicht liest, überspringt
 * der nächste {@link #nextPart()}. Endet der Body mitten in einem Teil (Abbruch im Browser), wirft das Lesen eine
 * {@link EOFException}: Ein Teil ist nur dann vollständig, wenn sein Strom regulär mit -1 endet.
 * <p>
 * Kopfzeilen eines Teils müssen in den Puffer passen. Liest nur, schließt den Body nie: Der gehört dem Aufrufer.
 */
public final class MultipartStreamReader {

	/** {@code name="…"} in der Content-Disposition. */
	private static final Pattern PART_NAME_PATTERN = Pattern.compile("(?i)(?:^|;)\\s*name=\"([^\"]*)\"");

	/** {@code filename="…"} in der Content-Disposition. */
	private static final Pattern PART_FILE_NAME_PATTERN = Pattern.compile("(?i)(?:^|;)\\s*filename=\"([^\"]*)\"");

	/** {@code boundary=…} im Content-Type, mit oder ohne Anführungszeichen. */
	private static final Pattern BOUNDARY_PATTERN = Pattern.compile("(?i)(?:^|;)\\s*boundary=(\"[^\"]+\"|[^;\\s]+)");

	private final InputStream body;

	/** Die Grenze zwischen zwei Teilen: Zeilenende, zwei Bindestriche, Boundary. */
	private final byte[] delimiter;

	private final byte[] buffer;

	/** Das erste noch nicht gelesene Byte im Puffer. */
	private int bufferStart;

	/** Hinter dem letzten gültigen Byte im Puffer. */
	private int bufferEnd;

	/** Bis hierhin (ausschließlich) ist sicher Inhalt des aktuellen Teils, dort beginnt keine Grenze. */
	private int knownContentEnd;

	/** Wo die Grenze hinter dem aktuellen Teil beginnt, -1 solange sie nicht gefunden ist. */
	private int knownDelimiterIndex = -1;

	private boolean bodyExhausted;

	/** Der Inhalt des aktuellen Teils ist bis zur Grenze gelesen. */
	private boolean partContentEnded;

	/** Die schließende Grenze ist gelesen: Es kommt kein Teil mehr. */
	private boolean finished;

	private String partName;

	private String partFileName;

	private String partContentType;

	private final PartContentStream partContentStream = new PartContentStream();

	/**
	 * @param body der Body des Requests
	 * @param boundary die Grenze aus dem Content-Type ({@link #extractBoundary(String)})
	 * @param bufferBytes so viel wird je Schritt vom Netz gelesen; Kopfzeilen eines Teils müssen hineinpassen
	 */
	public MultipartStreamReader(InputStream body, String boundary, int bufferBytes) {
		this.body = body;
		String delimiterText = "\r\n--" + boundary;
		this.delimiter = delimiterText.getBytes(StandardCharsets.ISO_8859_1);
		int minimumBufferBytes = delimiter.length * 4;
		int effectiveBufferBytes = Math.max(bufferBytes, minimumBufferBytes);
		this.buffer = new byte[effectiveBufferBytes];
		// Der Body beginnt mit „--Boundary“ ohne Zeilenende davor: Ein vorangestelltes Zeilenende macht daraus eine
		// ganz normale Grenze, der Vorspann davor ist leer.
		buffer[0] = '\r';
		buffer[1] = '\n';
		this.bufferEnd = 2;
	}

	/**
	 * Die Grenze aus einem Content-Type wie {@code multipart/form-data; boundary=----geckoformboundary…}.
	 *
	 * @throws IllegalArgumentException wenn es kein multipart/form-data mit gültiger Grenze ist (400)
	 */
	public static String extractBoundary(String contentType) {
		if (contentType == null) {
			throw new IllegalArgumentException("Der Upload braucht den Content-Type multipart/form-data.");
		}
		String lowerCaseContentType = contentType.toLowerCase(Locale.ROOT);
		boolean multipartFormData = lowerCaseContentType.startsWith("multipart/form-data");
		Matcher boundaryMatcher = BOUNDARY_PATTERN.matcher(contentType);
		if (!multipartFormData || !boundaryMatcher.find()) {
			throw new IllegalArgumentException("Der Upload braucht den Content-Type multipart/form-data mit boundary.");
		}
		String rawBoundary = boundaryMatcher.group(1);
		String boundary = rawBoundary;
		boolean quoted = rawBoundary.startsWith("\"") && rawBoundary.endsWith("\"");
		if (quoted) {
			int lastQuoteIndex = rawBoundary.length() - 1;
			boundary = rawBoundary.substring(1, lastQuoteIndex);
		}
		// RFC 2046: 1 bis 70 Zeichen
		int boundaryLength = boundary.length();
		if (boundaryLength < 1 || boundaryLength > 70) {
			throw new IllegalArgumentException("Die boundary des Uploads ist ungültig.");
		}
		return boundary;
	}

	/**
	 * Springt zum nächsten Teil: Rest des aktuellen überspringen, Grenze lesen, Kopfzeilen lesen.
	 *
	 * @return {@code false}, wenn die schließende Grenze kam und kein Teil mehr folgt
	 * @throws IOException wenn der Body abbricht oder nicht dem Format entspricht
	 */
	public boolean nextPart() throws IOException {
		if (finished) {
			return false;
		}
		skipRestOfPartContent();
		// Hinter der Grenze: „--“ beendet den Body, „\r\n“ leitet die Kopfzeilen des nächsten Teils ein
		ensureBufferedBytes(2);
		byte firstByte = buffer[bufferStart];
		int secondByteIndex = bufferStart + 1;
		byte secondByte = buffer[secondByteIndex];
		bufferStart = bufferStart + 2;
		if (firstByte == '-' && secondByte == '-') {
			finished = true;
			return false;
		}
		if (firstByte != '\r' || secondByte != '\n') {
			throw new IOException("Der Upload ist kein gültiges multipart/form-data.");
		}
		readPartHeaders();
		knownContentEnd = bufferStart;
		knownDelimiterIndex = -1;
		partContentEnded = false;
		return true;
	}

	/** Der Name des aktuellen Teils ({@code name} der Content-Disposition), {@code null} ohne. */
	public String getPartName() {
		return partName;
	}

	/** Der Dateiname des aktuellen Teils ({@code filename}), {@code null} bei einem Feld ohne Datei. */
	public String getPartFileName() {
		return partFileName;
	}

	/** Der Content-Type des aktuellen Teils, {@code null} ohne. */
	public String getPartContentType() {
		return partContentType;
	}

	/** Der Inhalt des aktuellen Teils bis zur nächsten Grenze. Schließen schließt den Body nicht. */
	public InputStream getPartContent() {
		return partContentStream;
	}

	/** Liest den Rest des aktuellen Teils (bzw. den Vorspann vor dem ersten) und verwirft ihn. */
	private void skipRestOfPartContent() throws IOException {
		byte[] discardBuffer = new byte[8192];
		int readCount = readPartContent(discardBuffer, 0, discardBuffer.length);
		while (readCount >= 0) {
			readCount = readPartContent(discardBuffer, 0, discardBuffer.length);
		}
	}

	/**
	 * Der Kern: liefert Inhalt bis zur Grenze. Jede Stelle wird nur einmal nach der Grenze durchsucht ({@code
	 * knownContentEnd}), auch wenn der Aufrufer in kleinen Stücken liest.
	 */
	private int readPartContent(byte[] target, int offset, int length) throws IOException {
		if (partContentEnded) {
			return -1;
		}
		if (length == 0) {
			return 0;
		}
		while (true) {
			if (bufferStart < knownContentEnd) {
				int availableCount = knownContentEnd - bufferStart;
				int copyCount = Math.min(length, availableCount);
				System.arraycopy(buffer, bufferStart, target, offset, copyCount);
				bufferStart = bufferStart + copyCount;
				return copyCount;
			}
			if (knownDelimiterIndex >= 0) {
				// Inhalt zu Ende: die Grenze selbst überspringen
				bufferStart = knownDelimiterIndex + delimiter.length;
				knownContentEnd = bufferStart;
				knownDelimiterIndex = -1;
				partContentEnded = true;
				return -1;
			}
			int foundDelimiterIndex = indexOf(delimiter, bufferStart, bufferEnd);
			if (foundDelimiterIndex >= 0) {
				knownContentEnd = foundDelimiterIndex;
				knownDelimiterIndex = foundDelimiterIndex;
				continue;
			}
			// Keine Grenze: Alles bis kurz vor das Ende ist Inhalt, das Ende könnte der Anfang einer Grenze sein
			int lastPossibleDelimiterStart = bufferEnd - delimiter.length + 1;
			if (lastPossibleDelimiterStart > bufferStart) {
				knownContentEnd = lastPossibleDelimiterStart;
				continue;
			}
			boolean filled = fillBuffer();
			if (!filled) {
				throw new EOFException("Der Upload endet mitten in einem Teil (abgebrochen?).");
			}
		}
	}

	/** Liest die Kopfzeilen bis zur Leerzeile und merkt sich Name, Dateiname und Typ. */
	private void readPartHeaders() throws IOException {
		partName = null;
		partFileName = null;
		partContentType = null;
		ensureBufferedBytes(2);
		boolean noHeaders = buffer[bufferStart] == '\r' && buffer[bufferStart + 1] == '\n';
		if (noHeaders) {
			bufferStart = bufferStart + 2;
			return;
		}
		byte[] headerEnd = "\r\n\r\n".getBytes(StandardCharsets.ISO_8859_1);
		int headerEndIndex = indexOf(headerEnd, bufferStart, bufferEnd);
		while (headerEndIndex < 0) {
			int bufferedCount = bufferEnd - bufferStart;
			if (bufferedCount >= buffer.length) {
				throw new IOException("Die Kopfzeilen eines Teils sind zu lang.");
			}
			boolean filled = fillBuffer();
			if (!filled) {
				throw new EOFException("Der Upload endet in den Kopfzeilen eines Teils.");
			}
			headerEndIndex = indexOf(headerEnd, bufferStart, bufferEnd);
		}
		int headerLength = headerEndIndex - bufferStart;
		String headerText = new String(buffer, bufferStart, headerLength, StandardCharsets.UTF_8);
		bufferStart = headerEndIndex + headerEnd.length;
		String[] headerLines = headerText.split("\r\n");
		for (String headerLine : headerLines) {
			readPartHeaderLine(headerLine);
		}
	}

	private void readPartHeaderLine(String headerLine) {
		int colonIndex = headerLine.indexOf(':');
		if (colonIndex < 0) {
			return;
		}
		String rawHeaderName = headerLine.substring(0, colonIndex);
		String headerName = rawHeaderName.trim().toLowerCase(Locale.ROOT);
		int valueStartIndex = colonIndex + 1;
		String rawHeaderValue = headerLine.substring(valueStartIndex);
		String headerValue = rawHeaderValue.trim();
		if (headerName.equals("content-disposition")) {
			Matcher nameMatcher = PART_NAME_PATTERN.matcher(headerValue);
			if (nameMatcher.find()) {
				partName = nameMatcher.group(1);
			}
			Matcher fileNameMatcher = PART_FILE_NAME_PATTERN.matcher(headerValue);
			if (fileNameMatcher.find()) {
				partFileName = fileNameMatcher.group(1);
			}
		} else if (headerName.equals("content-type")) {
			partContentType = headerValue;
		}
	}

	/** Sorgt dafür, dass mindestens so viele ungelesene Bytes im Puffer stehen. */
	private void ensureBufferedBytes(int requiredCount) throws IOException {
		int bufferedCount = bufferEnd - bufferStart;
		while (bufferedCount < requiredCount) {
			boolean filled = fillBuffer();
			if (!filled) {
				throw new EOFException("Der Upload endet zu früh.");
			}
			bufferedCount = bufferEnd - bufferStart;
		}
	}

	/**
	 * Schiebt die ungelesenen Bytes an den Anfang des Puffers und liest vom Netz nach.
	 *
	 * @return {@code false}, wenn der Body zu Ende ist
	 */
	private boolean fillBuffer() throws IOException {
		if (bodyExhausted) {
			return false;
		}
		if (bufferStart > 0) {
			int bufferedCount = bufferEnd - bufferStart;
			System.arraycopy(buffer, bufferStart, buffer, 0, bufferedCount);
			knownContentEnd = Math.max(0, knownContentEnd - bufferStart);
			if (knownDelimiterIndex >= 0) {
				knownDelimiterIndex = knownDelimiterIndex - bufferStart;
			}
			bufferEnd = bufferedCount;
			bufferStart = 0;
		}
		int freeCount = buffer.length - bufferEnd;
		if (freeCount == 0) {
			return true;
		}
		int readCount = body.read(buffer, bufferEnd, freeCount);
		if (readCount < 0) {
			bodyExhausted = true;
			return false;
		}
		bufferEnd = bufferEnd + readCount;
		return true;
	}

	/** Die erste Stelle von {@code pattern} im Puffer zwischen {@code from} und {@code to}, -1 ohne. */
	private int indexOf(byte[] pattern, int from, int to) {
		int lastStart = to - pattern.length;
		byte firstPatternByte = pattern[0];
		for (int start = from; start <= lastStart; start++) {
			if (buffer[start] != firstPatternByte) {
				continue;
			}
			int matchedCount = 1;
			while (matchedCount < pattern.length && buffer[start + matchedCount] == pattern[matchedCount]) {
				matchedCount = matchedCount + 1;
			}
			if (matchedCount == pattern.length) {
				return start;
			}
		}
		return -1;
	}

	/** Der Inhalt des aktuellen Teils als Strom, bis zur nächsten Grenze. */
	private final class PartContentStream extends InputStream {

		@Override
		public int read() throws IOException {
			byte[] singleByte = new byte[1];
			int readCount = readPartContent(singleByte, 0, 1);
			if (readCount < 0) {
				return -1;
			}
			return singleByte[0] & 0xFF;
		}

		@Override
		public int read(byte[] target, int offset, int length) throws IOException {
			return readPartContent(target, offset, length);
		}

		@Override
		public void close() {
			// der Body gehört dem Aufrufer; den Rest des Teils überspringt nextPart()
		}
	}
}
