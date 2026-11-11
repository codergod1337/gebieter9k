package de.gebiter.sftp.service;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.SftpATTRS;
import com.jcraft.jsch.SftpException;

import de.gebiter.sftp.SftpConfig;
import de.gebiter.sftp.SftpFileNotFoundException;
import de.gebiter.sftp.SftpUnavailableException;
import de.gebiter.sftp.dto.SftpStoredFile;
import de.gebiter.util.CountingDigestInputStream;
import de.gebiter.util.Helper;

/**
 * Die einzige Stelle, die mit dem Dateispeicher redet, wie in der Vorlage. Kennt keine Rechte und keine Dateiarten: Wer
 * eine Datei sehen darf, entscheidet der Aufrufer, hier kommen fertige Pfade und Ströme an.
 * <p>
 * Alle Pfade sind relativ zum root-dir und werden geprüft: kein absoluter Pfad, kein {@code ..}, kein Backslash. Kein
 * Aufrufer kann die Wurzel verlassen. Alles strömt, auch eine Datei von vielen Gigabyte liegt nie im Arbeitsspeicher.
 * Die Ströme gehören dem Aufrufer, er schließt sie.
 * <p>
 * Schreiben geht immer über eine {@code .part}-Datei: schreiben, Größe prüfen, umbenennen. Bricht eine Übertragung ab,
 * bleibt keine halbe Datei unter dem endgültigen Namen liegen. Das ist wichtig, weil der Name der Hash des Inhalts ist:
 * Eine halbe Datei gälte sonst als „haben wir schon“.
 * <p>
 * Ob die Grenze je User gilt, entscheidet der {@link SftpConnectionPool} über den angemeldeten User, nicht diese Klasse.
 */
@Service
public class SftpService {

	private static final Logger LOGGER = LoggerFactory.getLogger(SftpService.class);

	/** Ein erlaubtes Pfadsegment: nur Buchstaben, Ziffern, Punkt, Unterstrich und Minus. */
	private static final Pattern VALID_SEGMENT_PATTERN = Pattern.compile("[A-Za-z0-9._-]+");

	private final SftpConnectionPool sftpConnectionPool;

	private final SftpPathService sftpPathService;

	private final SftpConfig sftpConfig;

	/** Ordner, die es auf dem Server schon gibt: spart je Datei die Nachfrage. */
	private final Set<String> knownDirectories = ConcurrentHashMap.newKeySet();

	public SftpService(SftpConnectionPool sftpConnectionPool, SftpPathService sftpPathService, SftpConfig sftpConfig) {
		this.sftpConnectionPool = sftpConnectionPool;
		this.sftpPathService = sftpPathService;
		this.sftpConfig = sftpConfig;
	}

	/**
	 * CREATE: Legt den Inhalt unter diesem Pfad ab, z. B. {@link SftpPathService#createRelativePath(String)}. Fehlende
	 * Ordner werden angelegt. Gibt es die Datei schon, bleibt sie: Der Name ist der Hash, der Inhalt also derselbe. Wer
	 * hier andere Namen vergibt, sorgt selbst für eindeutige.
	 */
	public void createFileData(InputStream content, String relativePath) {
		String absolutePath = createAbsolutePath(relativePath);
		String partAbsolutePath = absolutePath + sftpConfig.partSuffix();
		try (PooledSftpChannel lentChannel = sftpConnectionPool.borrowSftpChannel()) {
			CountingDigestInputStream countingContent = new CountingDigestInputStream(content, null);
			writePart(lentChannel, countingContent, partAbsolutePath);
			finishPart(lentChannel, partAbsolutePath, absolutePath);
		}
	}

	/**
	 * CREATE: Legt den Inhalt ab und rechnet dabei den SHA-256 mit, für Uploads, die direkt durchgereicht werden, ohne
	 * dass jemand den Hash vorher kennt. Geschrieben wird in den Tagesordner unter einem Zufallsnamen, am Ende steht der
	 * Hash fest und die Datei bekommt ihren Namen {@code <sha256>.bin}. Gibt es sie in diesem Ordner schon, bleibt die
	 * alte. Ob dieselben Bytes schon an einem anderen Tag liegen, weiß nur der Aufrufer (später Solr).
	 */
	public SftpStoredFile createFileData(InputStream content) {
		String relativeDirectory = sftpPathService.nextRelativeDirectory();
		UUID partFileName = UUID.randomUUID();
		String partRelativePath = relativeDirectory + "/" + partFileName + sftpConfig.partSuffix();
		String partAbsolutePath = createAbsolutePath(partRelativePath);
		try (PooledSftpChannel lentChannel = sftpConnectionPool.borrowSftpChannel()) {
			MessageDigest sha256Digest = createSha256Digest();
			CountingDigestInputStream countingContent = new CountingDigestInputStream(content, sha256Digest);
			writePart(lentChannel, countingContent, partAbsolutePath);
			String sha256Hex = countingContent.sha256Hex();
			String relativePath = relativeDirectory + "/" + sha256Hex + sftpConfig.fileSuffix();
			String absolutePath = createAbsolutePath(relativePath);
			finishPart(lentChannel, partAbsolutePath, absolutePath);
			long sizeBytes = countingContent.byteCount();
			return new SftpStoredFile(relativePath, sha256Hex, sizeBytes);
		}
	}

	/**
	 * READ: Schreibt die Datei in den Zielstrom, meist den der HTTP-Antwort.
	 *
	 * @throws SftpFileNotFoundException wenn es die Datei nicht gibt
	 * @throws UncheckedIOException wenn der Empfänger abbricht (z. B. Tab geschlossen), kein Fehler des Dateispeichers
	 */
	public void readFileData(String relativePath, OutputStream target) {
		String absolutePath = createAbsolutePath(relativePath);
		try (PooledSftpChannel lentChannel = sftpConnectionPool.borrowSftpChannel()) {
			InputStream fromServer = openForRead(lentChannel, absolutePath);
			// der Strom vom Server gehört uns, der Zielstrom dem Aufrufer
			try (fromServer) {
				fromServer.transferTo(target);
			} catch (IOException exception) {
				// mitten im Lesen abgebrochen: der Kanal steckt in der Übertragung fest und wird verworfen
				lentChannel.markBroken();
				throw new UncheckedIOException("Übertragung von " + absolutePath + " abgebrochen", exception);
			}
		}
	}

	/**
	 * READ: Holt die Datei in eine neue Temp-Datei, für Werkzeuge, die eine Datei auf der Platte brauchen (Tika und die
	 * Vorschau lesen mehrmals, libheif liest nur Dateien). Die Temp-Datei gehört dem Aufrufer, er löscht sie mit
	 * {@link Helper#deleteTempFile(Path)}. Scheitert das Holen, ist sie schon gelöscht.
	 *
	 * @throws SftpFileNotFoundException wenn es die Datei nicht gibt
	 * @throws UncheckedIOException wenn sich die Temp-Datei nicht anlegen oder schreiben lässt
	 */
	public Path readFileDataIntoTempFile(String relativePath) {
		Path tempFile;
		try {
			tempFile = Files.createTempFile("gebiter-sftp-", ".bin");
		} catch (IOException exception) {
			throw new UncheckedIOException("Temp-Datei ließ sich nicht anlegen.", exception);
		}
		try {
			try (OutputStream tempFileData = Files.newOutputStream(tempFile)) {
				readFileData(relativePath, tempFileData);
			}
			return tempFile;
		} catch (IOException exception) {
			Helper.deleteTempFile(tempFile);
			throw new UncheckedIOException("Temp-Datei " + tempFile + " ließ sich nicht schreiben.", exception);
		} catch (RuntimeException exception) {
			Helper.deleteTempFile(tempFile);
			throw exception;
		}
	}

	/**
	 * READ: Schreibt einen Ausschnitt der Datei in den Zielstrom: ab Byte {@code offset} genau {@code length} Bytes, z. B. für
	 * eine Range-Anfrage des Browsers (Video vorspulen). Wird vor dem Ende der Datei aufgehört, steckt der Kanal noch in der
	 * Übertragung und wird verworfen, wie bei {@link #openFileData(String)}.
	 *
	 * @throws SftpFileNotFoundException wenn es die Datei nicht gibt
	 * @throws UncheckedIOException wenn der Empfänger abbricht (z. B. Video weitergespult), kein Fehler des Dateispeichers
	 */
	public void readFileDataRange(String relativePath, long offset, long length, OutputStream target) {
		String absolutePath = createAbsolutePath(relativePath);
		try (PooledSftpChannel lentChannel = sftpConnectionPool.borrowSftpChannel()) {
			InputStream fromServer = openForRead(lentChannel, absolutePath, offset);
			try (fromServer) {
				ByteLimitedInputStream rangeFromServer = new ByteLimitedInputStream(fromServer, length);
				rangeFromServer.transferTo(target);
				// Nur wer bis zum Ende der Datei gelesen hat, gibt einen sauberen Kanal zurück
				int nextByte = fromServer.read();
				boolean readToEnd = nextByte < 0;
				if (!readToEnd) {
					lentChannel.markBroken();
				}
			} catch (IOException exception) {
				lentChannel.markBroken();
				throw new UncheckedIOException("Übertragung von " + absolutePath + " abgebrochen", exception);
			}
		}
	}

	/**
	 * READ: Öffnet die Datei zum Lesen als Strom, für Läufe, die eine große Datei nach und nach verarbeiten. Die
	 * Verbindung bleibt ausgeliehen, bis der Aufrufer den Strom schließt. Schließt er, ohne zu Ende gelesen zu haben,
	 * wird die Verbindung verworfen, denn der Kanal steckt dann noch in der Übertragung.
	 *
	 * @throws SftpFileNotFoundException wenn es die Datei nicht gibt
	 */
	public InputStream openFileData(String relativePath) {
		String absolutePath = createAbsolutePath(relativePath);
		PooledSftpChannel lentChannel = sftpConnectionPool.borrowSftpChannel();
		InputStream fromServer;
		try {
			fromServer = openForRead(lentChannel, absolutePath);
		} catch (RuntimeException exception) {
			lentChannel.close();
			throw exception;
		}
		return new ChannelReturningInputStream(fromServer, lentChannel);
	}

	/** READ: Gibt es die Datei? „Nein“ ist eine Antwort, kein Fehler. */
	public boolean existsFileData(String relativePath) {
		String absolutePath = createAbsolutePath(relativePath);
		try (PooledSftpChannel lentChannel = sftpConnectionPool.borrowSftpChannel()) {
			ChannelSftp channel = lentChannel.channel();
			try {
				return exists(channel, absolutePath);
			} catch (SftpException exception) {
				throw createFailedException(lentChannel, "Nachsehen von " + absolutePath, exception);
			}
		}
	}

	/** DELETE: Löscht die Datei. War sie schon weg, gilt das als Erfolg: Der gewünschte Zustand ist hergestellt. */
	public void deleteFileData(String relativePath) {
		String absolutePath = createAbsolutePath(relativePath);
		try (PooledSftpChannel lentChannel = sftpConnectionPool.borrowSftpChannel()) {
			ChannelSftp channel = lentChannel.channel();
			try {
				channel.rm(absolutePath);
			} catch (SftpException exception) {
				if (exception.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
					LOGGER.debug("SFTP: {} war schon weg", absolutePath);
					return;
				}
				throw createFailedException(lentChannel, "Löschen von " + absolutePath, exception);
			}
		}
	}

	// ===== Schreiben über .part =====

	/** Schreibt nach {@code partAbsolutePath} und prüft die Größe. Scheitert etwas, ist die .part danach weg. */
	private void writePart(PooledSftpChannel lentChannel, CountingDigestInputStream content, String partAbsolutePath) {
		ChannelSftp channel = lentChannel.channel();
		try {
			String partDirectory = getParentDirectory(partAbsolutePath);
			ensureDirectory(channel, partDirectory);
			channel.put(content, partAbsolutePath, ChannelSftp.OVERWRITE);
			SftpATTRS storedAttributes = channel.stat(partAbsolutePath);
			long storedSize = storedAttributes.getSize();
			long sentSize = content.byteCount();
			if (storedSize != sentSize) {
				removeQuietly(channel, partAbsolutePath);
				LOGGER.error("SFTP: {} unvollständig, {} von {} Bytes angekommen", partAbsolutePath, storedSize, sentSize);
				String retryAfterSeconds = sftpConfig.retryAfterSeconds();
				throw new SftpUnavailableException("Die Übertragung zum Dateispeicher war unvollständig.",
						retryAfterSeconds);
			}
		} catch (SftpException exception) {
			removeQuietly(channel, partAbsolutePath);
			throw createFailedException(lentChannel, "Schreiben nach " + partAbsolutePath, exception);
		}
	}

	/** Die fertige .part bekommt ihren Namen. Gibt es das Ziel schon, bleibt es, die .part fällt weg. */
	private void finishPart(PooledSftpChannel lentChannel, String partAbsolutePath, String absolutePath) {
		ChannelSftp channel = lentChannel.channel();
		try {
			boolean targetExists = exists(channel, absolutePath);
			if (targetExists) {
				LOGGER.debug("SFTP: {} gab es schon, die neue Übertragung fällt weg", absolutePath);
				channel.rm(partAbsolutePath);
				return;
			}
			channel.rename(partAbsolutePath, absolutePath);
		} catch (SftpException exception) {
			removeQuietly(channel, partAbsolutePath);
			throw createFailedException(lentChannel, "Umbenennen nach " + absolutePath, exception);
		}
	}

	/**
	 * Legt den Ordner samt allen fehlenden darüber an. SFTP kennt kein „leg den ganzen Pfad an“, nur eine Ebene auf
	 * einmal. Legen zwei Threads denselben Ordner gleichzeitig an, scheitert einer: Dann wird nachgesehen, ob er
	 * inzwischen da ist. Bekannte Ordner werden gemerkt, damit nicht jede Datei die Nachfrage kostet.
	 */
	private void ensureDirectory(ChannelSftp channel, String directory) throws SftpException {
		if (directory == null || knownDirectories.contains(directory)) {
			return;
		}
		boolean directoryExists = exists(channel, directory);
		if (!directoryExists) {
			String parentDirectory = getParentDirectory(directory);
			ensureDirectory(channel, parentDirectory);
			try {
				channel.mkdir(directory);
			} catch (SftpException exception) {
				boolean createdByOtherThread = exists(channel, directory);
				if (!createdByOtherThread) {
					throw exception;
				}
			}
		}
		if (knownDirectories.size() >= sftpConfig.maxKnownDirectories()) {
			knownDirectories.clear();
		}
		knownDirectories.add(directory);
	}

	// ===== Helfer =====

	private InputStream openForRead(PooledSftpChannel lentChannel, String absolutePath) {
		return openForRead(lentChannel, absolutePath, 0);
	}

	/** Öffnet die Datei ab Byte {@code offset} (0 = von vorn). */
	private InputStream openForRead(PooledSftpChannel lentChannel, String absolutePath, long offset) {
		ChannelSftp channel = lentChannel.channel();
		try {
			return channel.get(absolutePath, null, offset);
		} catch (SftpException exception) {
			if (exception.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
				throw new SftpFileNotFoundException();
			}
			throw createFailedException(lentChannel, "Lesen von " + absolutePath, exception);
		}
	}

	/** stat, „gibt es nicht“ als Antwort statt als Fehler. */
	private static boolean exists(ChannelSftp channel, String absolutePath) throws SftpException {
		try {
			channel.stat(absolutePath);
			return true;
		} catch (SftpException exception) {
			if (exception.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
				return false;
			}
			throw exception;
		}
	}

	/** Aufräumen nach einem Fehler darf den eigentlichen Fehler nicht verdecken. */
	private static void removeQuietly(ChannelSftp channel, String absolutePath) {
		try {
			channel.rm(absolutePath);
		} catch (SftpException exception) {
			if (exception.id != ChannelSftp.SSH_FX_NO_SUCH_FILE) {
				LOGGER.debug("SFTP: Aufräumen von {} fehlgeschlagen: {}", absolutePath, exception.getMessage());
			}
		}
	}

	/**
	 * Der Fehler nach außen bleibt allgemein, Pfad und Ursache stehen im Log. Ist die Verbindung selbst das Problem, wird
	 * sie verworfen.
	 */
	private SftpUnavailableException createFailedException(PooledSftpChannel lentChannel, String failedAction,
			SftpException exception) {
		boolean connectionProblem = exception.id == ChannelSftp.SSH_FX_NO_CONNECTION
				|| exception.id == ChannelSftp.SSH_FX_CONNECTION_LOST || exception.getCause() instanceof IOException;
		if (connectionProblem) {
			lentChannel.markBroken();
		}
		LOGGER.error("SFTP: {} fehlgeschlagen (Code {}): {}", failedAction, exception.id, exception.getMessage());
		String retryAfterSeconds = sftpConfig.retryAfterSeconds();
		return new SftpUnavailableException("Der Dateispeicher ist gerade nicht erreichbar.", retryAfterSeconds,
				exception);
	}

	/**
	 * Der geprüfte relative Pfad mit der Wurzel davor. Programmierfehler der Aufrufer fallen hier auf.
	 *
	 * @throws IllegalArgumentException wenn der Pfad fehlt, zu lang, absolut ist oder ein ungültiges Segment hat
	 */
	private String createAbsolutePath(String relativePath) {
		if (relativePath == null || relativePath.isBlank()) {
			throw new IllegalArgumentException("relativePath fehlt.");
		}
		boolean tooLong = relativePath.length() > sftpConfig.maxPathLength();
		boolean absolute = relativePath.startsWith("/");
		boolean containsBackslash = relativePath.contains("\\");
		if (tooLong || absolute || containsBackslash) {
			throw new IllegalArgumentException("relativePath ist ungültig: " + relativePath);
		}
		String[] segments = relativePath.split("/");
		for (String segment : segments) {
			boolean validSegment = VALID_SEGMENT_PATTERN.matcher(segment).matches();
			boolean relativeSegment = segment.equals(".") || segment.equals("..");
			if (!validSegment || relativeSegment) {
				throw new IllegalArgumentException("relativePath ist ungültig: " + relativePath);
			}
		}
		return sftpConfig.rootDir() + "/" + relativePath;
	}

	/** Der Ordner über einem Pfad, {@code null} oberhalb der Wurzel. */
	private String getParentDirectory(String absolutePath) {
		int lastSlashIndex = absolutePath.lastIndexOf('/');
		boolean aboveRoot = lastSlashIndex <= 0 || absolutePath.length() <= sftpConfig.rootDir().length();
		if (aboveRoot) {
			return null;
		}
		return absolutePath.substring(0, lastSlashIndex);
	}

	private static MessageDigest createSha256Digest() {
		try {
			return MessageDigest.getInstance("SHA-256");
		} catch (NoSuchAlgorithmException exception) {
			// Jede Java-Laufzeit muss SHA-256 anbieten, das tritt praktisch nie ein.
			throw new IllegalStateException("SHA-256 fehlt in dieser Java-Laufzeit.", exception);
		}
	}

	/**
	 * Der Strom aus {@link #openFileData(String)}: gibt beim Schließen die Verbindung an den Broker zurück und verwirft
	 * sie, wenn nicht zu Ende gelesen wurde.
	 */
	private static final class ChannelReturningInputStream extends FilterInputStream {

		private final PooledSftpChannel lentChannel;

		private boolean exhausted;

		ChannelReturningInputStream(InputStream fromServer, PooledSftpChannel lentChannel) {
			super(fromServer);
			this.lentChannel = lentChannel;
		}

		@Override
		public int read() throws IOException {
			int readByte = super.read();
			exhausted = readByte < 0;
			return readByte;
		}

		@Override
		public int read(byte[] buffer, int offset, int length) throws IOException {
			int readCount = super.read(buffer, offset, length);
			exhausted = readCount < 0;
			return readCount;
		}

		@Override
		public void close() throws IOException {
			try {
				if (!exhausted) {
					lentChannel.markBroken();
				}
				super.close();
			} catch (IOException exception) {
				lentChannel.markBroken();
				throw exception;
			} finally {
				lentChannel.close();
			}
		}
	}

	/**
	 * Ein Strom, der nach {@code byteLimit} Bytes endet, für Ausschnitte einer Datei ({@link #readFileDataRange}). Den
	 * darunterliegenden Strom schließt er nicht, das macht der Aufrufer.
	 */
	private static final class ByteLimitedInputStream extends FilterInputStream {

		private long remainingBytes;

		ByteLimitedInputStream(InputStream content, long byteLimit) {
			super(content);
			this.remainingBytes = byteLimit;
		}

		@Override
		public int read() throws IOException {
			if (remainingBytes <= 0) {
				return -1;
			}
			int readByte = super.read();
			if (readByte >= 0) {
				remainingBytes = remainingBytes - 1;
			}
			return readByte;
		}

		@Override
		public int read(byte[] buffer, int offset, int length) throws IOException {
			if (remainingBytes <= 0) {
				return -1;
			}
			long allowedLength = Math.min(length, remainingBytes);
			int readBytes = super.read(buffer, offset, (int) allowedLength);
			if (readBytes > 0) {
				remainingBytes = remainingBytes - readBytes;
			}
			return readBytes;
		}

		@Override
		public void close() {
			// der darunterliegende Strom gehört dem Aufrufer
		}
	}
}
