package de.gebiter.file.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileConfig;
import de.gebiter.file.FileStagingFullException;
import de.gebiter.sftp.SftpConfig;
import de.gebiter.util.Helper;

/**
 * Der Upload-Puffer: ein Ordner auf der Platte des Backends ({@code gebiter.file.staging-directory}). Ein Upload
 * schreibt seine Bytes zuerst hierher, als {@code <zufall>.part}; ist er vollständig und der Hash bekannt, heißt die
 * Datei {@code <sha256>.bin}. Von hier bringt sie der Hintergrund-Thread ({@link FileAnalysisService}) auf den SFTP und
 * lässt Tika auf den Pfad los; danach verschwindet sie. Bis dahin liefert das Backend die Datei direkt von hier aus.
 * <p>
 * Der Ordner ist zugleich die Warteschlange des Hintergrund-Threads: Was als {@code .bin} hier liegt, ist noch zu tun.
 * Ein Neustart verliert nichts. {@code .part}-Dateien sind laufende Uploads; nach einem Neustart sind es Reste
 * abgebrochener Uploads und gehen weg ({@link #deleteAbandonedPartFiles()}, im Start-Runner).
 * <p>
 * Höchstens {@code gebiter.file.staging-max-size} dürfen hier liegen, laufende Uploads zählen mit ihrer angekündigten
 * Größe. Endungen wie auf dem SFTP ({@code gebiter.sftp.file-suffix}, {@code part-suffix}).
 */
@Service
public class FileStagingService {

	private static final Logger LOGGER = LoggerFactory.getLogger(FileStagingService.class);

	private final FileConfig fileConfig;

	private final SftpConfig sftpConfig;

	/** Platz, den laufende Uploads reserviert haben; geschützt durch {@code this}. */
	private long reservedBytes;

	public FileStagingService(FileConfig fileConfig, SftpConfig sftpConfig) {
		this.fileConfig = fileConfig;
		this.sftpConfig = sftpConfig;
	}

	/**
	 * CREATE: Reserviert Platz für einen Upload und legt seine leere Teil-Datei an. Die Reservierung gibt
	 * {@link #releaseReservation(long)} wieder frei, wenn der Upload fertig oder gescheitert ist.
	 *
	 * @param expectedSizeBytes so viel wird der Upload höchstens schreiben
	 * @throws FileStagingFullException (503) wenn der Puffer dafür zu voll ist
	 */
	public Path createPartFile(long expectedSizeBytes) {
		reserveSpace(expectedSizeBytes);
		Path stagingDirectory = fileConfig.stagingDirectory();
		UUID partFileGuid = UUID.randomUUID();
		String partFileName = partFileGuid + sftpConfig.partSuffix();
		Path partFile = stagingDirectory.resolve(partFileName);
		try {
			Files.createDirectories(stagingDirectory);
			return Files.createFile(partFile);
		} catch (IOException exception) {
			releaseReservation(expectedSizeBytes);
			throw new UncheckedIOException("Im Upload-Puffer ließ sich keine Datei anlegen.", exception);
		}
	}

	/** Gibt den reservierten Platz eines Uploads frei, ob er geklappt hat oder nicht. */
	public synchronized void releaseReservation(long expectedSizeBytes) {
		long remainingReservedBytes = reservedBytes - expectedSizeBytes;
		reservedBytes = Math.max(0, remainingReservedBytes);
	}

	/**
	 * UPDATE: Die vollständige Teil-Datei bekommt ihren endgültigen Namen {@code <sha256>.bin}. Liegt dort schon eine
	 * (Rest eines abgebrochenen Laufs), wird sie ersetzt: Gleicher Name heißt gleiche Bytes.
	 */
	public Path moveToStagedFile(Path partFile, String sha256Hex) {
		Path stagedFile = getStagedFile(sha256Hex);
		try {
			return Files.move(partFile, stagedFile, StandardCopyOption.ATOMIC_MOVE,
					StandardCopyOption.REPLACE_EXISTING);
		} catch (IOException exception) {
			throw new UncheckedIOException("Die Datei im Upload-Puffer ließ sich nicht umbenennen.", exception);
		}
	}

	/** READ: Wo die Datei mit dieser id im Puffer liegt bzw. liegen würde. */
	public Path getStagedFile(String id) {
		String sha256Hex = Helper.requireSha256Hex(id);
		String stagedFileName = sha256Hex + sftpConfig.fileSuffix();
		Path stagingDirectory = fileConfig.stagingDirectory();
		return stagingDirectory.resolve(stagedFileName);
	}

	/** READ: Liegt die Datei noch im Puffer, also noch nicht (sicher) fertig verarbeitet? */
	public boolean isStaged(String id) {
		Path stagedFile = getStagedFile(id);
		return Files.isRegularFile(stagedFile);
	}

	/**
	 * READ: Die ids aller Dateien im Puffer, die noch auf den SFTP und in die Auswertung müssen. Teil-Dateien laufender
	 * Uploads gehören nicht dazu.
	 */
	public List<String> getStagedFileIds() {
		List<String> stagedFileIds = new ArrayList<>();
		Path stagingDirectory = fileConfig.stagingDirectory();
		if (!Files.isDirectory(stagingDirectory)) {
			return stagedFileIds;
		}
		String fileSuffix = sftpConfig.fileSuffix();
		String stagedFilePattern = "*" + fileSuffix;
		try (DirectoryStream<Path> stagedFiles = Files.newDirectoryStream(stagingDirectory, stagedFilePattern)) {
			for (Path stagedFile : stagedFiles) {
				Path stagedFileNamePath = stagedFile.getFileName();
				String stagedFileName = stagedFileNamePath.toString();
				int idLength = stagedFileName.length() - fileSuffix.length();
				String stagedFileId = stagedFileName.substring(0, idLength);
				boolean validId = Helper.isSha256Hex(stagedFileId);
				if (validId) {
					stagedFileIds.add(stagedFileId);
				}
			}
		} catch (IOException exception) {
			throw new UncheckedIOException("Der Upload-Puffer ließ sich nicht lesen.", exception);
		}
		return stagedFileIds;
	}

	/**
	 * READ: Schreibt einen Ausschnitt der Datei aus dem Puffer in den Zielstrom, z. B. für den Download direkt nach dem
	 * Upload, solange sie noch nicht auf dem SFTP liegt.
	 *
	 * @return {@code false}, wenn die Datei nicht (mehr) im Puffer liegt: Dann gilt der SFTP
	 * @throws IOException wenn der Empfänger abbricht
	 */
	public boolean copyStagedFileRange(String id, long offset, long length, OutputStream target) throws IOException {
		Path stagedFile = getStagedFile(id);
		FileChannel stagedFileChannel;
		try {
			stagedFileChannel = FileChannel.open(stagedFile, StandardOpenOption.READ);
		} catch (NoSuchFileException exception) {
			return false;
		}
		// Offen bleibt die Datei lesbar, auch wenn der Hintergrund-Thread sie inzwischen löscht.
		try (stagedFileChannel) {
			stagedFileChannel.position(offset);
			InputStream stagedFileData = Channels.newInputStream(stagedFileChannel);
			byte[] copyBuffer = new byte[65536];
			long remainingBytes = length;
			while (remainingBytes > 0) {
				int chunkLength = (int) Math.min(copyBuffer.length, remainingBytes);
				int readCount = stagedFileData.read(copyBuffer, 0, chunkLength);
				if (readCount < 0) {
					throw new IOException("Die Datei " + id + " im Upload-Puffer ist kürzer als erwartet.");
				}
				target.write(copyBuffer, 0, readCount);
				remainingBytes = remainingBytes - readCount;
			}
		}
		return true;
	}

	/** DELETE: Nimmt die Datei aus dem Puffer, z. B. wenn sie sicher auf dem SFTP liegt. Fehlt sie, passiert nichts. */
	public void deleteStagedFile(String id) {
		Path stagedFile = getStagedFile(id);
		Helper.deleteTempFile(stagedFile);
	}

	/** DELETE: Nimmt die Teil-Datei eines gescheiterten oder verworfenen Uploads weg. */
	public void deletePartFile(Path partFile) {
		Helper.deleteTempFile(partFile);
	}

	/**
	 * DELETE beim Start (Start-Runner): Teil-Dateien sind Reste von Uploads, die beim Herunterfahren oder Absturz liefen.
	 * Ihre Uploads sind gescheitert, in Solr steht dazu nichts. Legt den Puffer an, falls er fehlt.
	 */
	public void deleteAbandonedPartFiles() {
		Path stagingDirectory = fileConfig.stagingDirectory();
		String partFilePattern = "*" + sftpConfig.partSuffix();
		int deletedCount = 0;
		try {
			Files.createDirectories(stagingDirectory);
			try (DirectoryStream<Path> partFiles = Files.newDirectoryStream(stagingDirectory, partFilePattern)) {
				for (Path partFile : partFiles) {
					Helper.deleteTempFile(partFile);
					deletedCount = deletedCount + 1;
				}
			}
		} catch (IOException exception) {
			throw new UncheckedIOException("Der Upload-Puffer " + stagingDirectory + " ließ sich nicht aufräumen.",
					exception);
		}
		LOGGER.info("Upload-Puffer {}: {} Reste abgebrochener Uploads gelöscht", stagingDirectory, deletedCount);
	}

	/**
	 * Reserviert Platz, wenn er reicht: Was im Puffer liegt, plus die Reservierungen laufender Uploads, plus diese.
	 * Synchronisiert, damit zwei Uploads nicht beide durch die letzte Lücke schlüpfen.
	 */
	private synchronized void reserveSpace(long expectedSizeBytes) {
		long stagedBytes = sumStagedFileSizes();
		long stagingMaxBytes = fileConfig.stagingMaxSize().toBytes();
		long neededBytes = stagedBytes + reservedBytes + expectedSizeBytes;
		if (neededBytes > stagingMaxBytes) {
			LOGGER.warn("Upload-Puffer voll: {} Bytes liegen, {} reserviert, {} angefragt, Grenze {}", stagedBytes,
					reservedBytes, expectedSizeBytes, stagingMaxBytes);
			throw new FileStagingFullException(
					"Der Upload-Puffer des Servers ist gerade voll. Bitte in ein paar Minuten noch einmal versuchen.");
		}
		reservedBytes = reservedBytes + expectedSizeBytes;
	}

	/** Die Größe aller fertigen Dateien im Puffer; Teil-Dateien zählen über ihre Reservierung. */
	private long sumStagedFileSizes() {
		Path stagingDirectory = fileConfig.stagingDirectory();
		if (!Files.isDirectory(stagingDirectory)) {
			return 0;
		}
		String stagedFilePattern = "*" + sftpConfig.fileSuffix();
		long stagedBytes = 0;
		try (DirectoryStream<Path> stagedFiles = Files.newDirectoryStream(stagingDirectory, stagedFilePattern)) {
			for (Path stagedFile : stagedFiles) {
				long stagedFileSize = readSizeOrZero(stagedFile);
				stagedBytes = stagedBytes + stagedFileSize;
			}
		} catch (IOException exception) {
			throw new UncheckedIOException("Der Upload-Puffer ließ sich nicht lesen.", exception);
		}
		return stagedBytes;
	}

	/** Die Größe, oder 0, wenn der Hintergrund-Thread die Datei gerade weggeräumt hat. */
	private static long readSizeOrZero(Path stagedFile) throws IOException {
		try {
			return Files.size(stagedFile);
		} catch (NoSuchFileException exception) {
			return 0;
		}
	}
}
