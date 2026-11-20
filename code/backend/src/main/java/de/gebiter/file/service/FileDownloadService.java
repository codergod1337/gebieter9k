package de.gebiter.file.service;

import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileConfig;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.file.dto.FileDocumentZipSource;
import de.gebiter.heif.service.HeifService;
import de.gebiter.sftp.service.SftpService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Der einzige Weg zu den Bytes einer Datei: erst die Datei mit der Leseprüfung des Users auflösen, dann die Bytes vom SFTP
 * streamen, im Thread der Anfrage (so kennt der SFTP-Broker den User und seine Grenze von 2 Verbindungen). Den Pfad auf dem
 * SFTP nennt nie der Client. Liegt die Datei noch im Upload-Puffer ({@link FileStagingService}), kommt sie von dort: So
 * geht sie gleich nach dem Upload, auch bevor der Hintergrund-Thread sie auf den SFTP gebracht hat.
 * <p>
 * Viewer (inline) nur für die Typen aus {@code gebiter.file.inline-mime-types}, alles andere geht als Download. Immer mit
 * {@code nosniff} und {@code sandbox}, damit der Browser nie etwas Hochgeladenes als Seite ausführt. Byte-Bereiche (Range)
 * gehen, damit Videos vorspulen können.
 * <p>
 * HEIF-Bilder (HEIC vom iPhone) bekommt der Viewer als JPEG, umgewandelt mit libheif; der Download liefert das Original.
 */
@Service
public class FileDownloadService {

	private static final Logger LOGGER = LoggerFactory.getLogger(FileDownloadService.class);

	/** Ein einzelner Byte-Bereich nach HTTP: {@code bytes=start-ende}, Ende optional, oder {@code bytes=-n} (die letzten n). */
	private static final Pattern SINGLE_BYTE_RANGE_PATTERN = Pattern.compile("bytes=(\\d*)-(\\d*)");

	private final FileDocumentResolveService fileDocumentResolveService;

	private final SftpService sftpService;

	private final HeifService heifService;

	private final FileConfig fileConfig;

	private final FileStagingService fileStagingService;

	public FileDownloadService(FileDocumentResolveService fileDocumentResolveService, SftpService sftpService,
			HeifService heifService, FileConfig fileConfig, FileStagingService fileStagingService) {
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.sftpService = sftpService;
		this.heifService = heifService;
		this.fileConfig = fileConfig;
		this.fileStagingService = fileStagingService;
	}

	/**
	 * READ: Streamt die Datei in die Antwort, ganz oder (mit Range-Header) einen Ausschnitt.
	 *
	 * @param asAttachment {@code true}: Download (Anhang); {@code false}: Viewer, inline nur bei erlaubtem Typ, HEIF als JPEG
	 * @param rangeHeader der Range-Header des Browsers, {@code null} ohne
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder der User sie nicht lesen darf (gleiche Antwort)
	 */
	public void streamFileDocument(String id, boolean asAttachment, String rangeHeader, HttpServletResponse response) {
		FileDocumentBackendFacts fileDocumentBackendFacts = fileDocumentResolveService
				.resolveReadableFileDocumentBackendFacts(id);
		if (fileDocumentBackendFacts == null) {
			throw new EntityNotFoundException("Die Datei gibt es nicht.");
		}
		doStreamFileDocument(id, fileDocumentBackendFacts, asAttachment, rangeHeader, response);
	}

	/**
	 * READ (Backend): Streamt eine Datei, deren Fakten der Aufrufer schon aufgelöst hat, genau wie
	 * {@link #streamFileDocument}. OHNE Leseprüfung: Die hat der Aufrufer gemacht, auf seinem eigenen Weg (der
	 * {@code GalleryShareVisitorService}: gültige Galerie-Freigabe, und das Bild gehört zu ihr). Über keinen Endpunkt
	 * direkt erreichbar.
	 *
	 * @param fileDocumentBackendFacts die Fakten genau dieser Datei, nie {@code null}
	 */
	public void streamFileDocumentWithBackendFacts(String id, FileDocumentBackendFacts fileDocumentBackendFacts,
			boolean asAttachment, String rangeHeader, HttpServletResponse response) {
		String sha256Hex = Helper.requireSha256Hex(id);
		Helper.requireNotNull(fileDocumentBackendFacts, "fileDocumentBackendFacts");
		doStreamFileDocument(sha256Hex, fileDocumentBackendFacts, asAttachment, rangeHeader, response);
	}

	/**
	 * READ (Backend): Streamt mehrere Dateien als EINE ZIP-Datei in die Antwort, für „Auswahl“ und „alle“ einer
	 * Galerie-Freigabe. OHNE Leseprüfung: Welche Dateien es sind, hat der Aufrufer mit seiner eigenen Lesegrenze
	 * aufgelöst. Über keinen Endpunkt direkt erreichbar.
	 * <p>
	 * Gebaut für sehr große Galerien (50 bis 100 GB) auf dem Pi:
	 * <ul>
	 * <li>Nichts liegt je als Ganzes im Speicher oder auf der Platte: Datei für Datei läuft vom SFTP (oder aus dem
	 * Upload-Puffer) durch einen festen Puffer direkt in die Antwort. Der Speicherbedarf ist gleich, ob das ZIP 10 MB
	 * oder 100 GB hat.</li>
	 * <li>Ohne Kompression (Stufe 0): Bilder und Videos sind schon komprimiert, Packen kostete nur Rechenzeit.</li>
	 * <li>ZIP64 schreibt Java von selbst, sobald es mehr als 4 GB oder mehr als 65 535 Einträge werden.</li>
	 * <li>Die Gesamtgröße steht vorher nicht fest, die Antwort geht deshalb in Stücken (chunked) hinaus.</li>
	 * </ul>
	 * Geht mittendrin bei uns etwas schief (eine Datei fehlt auf dem SFTP, der SFTP fällt aus), bricht die Übertragung
	 * hart ab: Das ZIP bekommt KEIN Inhaltsverzeichnis, und der Fehler geht weiter nach oben, damit die Verbindung ohne
	 * sauberes Ende schließt und der Browser den Download als fehlgeschlagen meldet. So kann nie ein ZIP entstehen, das
	 * vollständig aussieht und dem Bilder fehlen. Bricht dagegen der Browser ab, ist das kein Fehler des Servers.
	 *
	 * @throws IllegalStateException wenn eine Datei auf dem SFTP fehlt oder ihr Lesen mittendrin scheitert
	 *
	 * @param zipSources die Dateien in der Reihenfolge, in der sie ins ZIP kommen
	 * @param zipFileName der Name der ZIP-Datei für den Browser, schon bereinigt, mit Endung
	 */
	public void streamFileDocumentsAsZip(List<FileDocumentZipSource> zipSources, String zipFileName,
			HttpServletResponse response) {
		Helper.requireNotNull(zipSources, "zipSources");
		Helper.requireNotBlank(zipFileName, "zipFileName");
		ContentDisposition contentDisposition = ContentDisposition.attachment().filename(zipFileName, StandardCharsets.UTF_8)
				.build();
		String contentDispositionText = contentDisposition.toString();
		response.setContentType("application/zip");
		response.setHeader(HttpHeaders.CONTENT_DISPOSITION, contentDispositionText);
		response.setHeader("X-Content-Type-Options", "nosniff");
		// Jeder Abruf zählt an der Freigabe: nichts davon darf aus einem Zwischenspeicher kommen
		response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
		int writtenFileCount = 0;
		ClientWriteTrackingOutputStream trackedResponseBody = null;
		try {
			OutputStream responseBody = response.getOutputStream();
			trackedResponseBody = new ClientWriteTrackingOutputStream(responseBody);
			// Bewusst kein try-with-resources: close() schriebe auch nach einem Fehler das Inhaltsverzeichnis
			ZipOutputStream zipOutputStream = new ZipOutputStream(trackedResponseBody, StandardCharsets.UTF_8);
			zipOutputStream.setLevel(Deflater.NO_COMPRESSION);
			Set<String> usedZipEntryNames = new HashSet<>();
			for (FileDocumentZipSource zipSource : zipSources) {
				String zipEntryName = createUniqueZipEntryName(zipSource, usedZipEntryNames);
				ZipEntry zipEntry = new ZipEntry(zipEntryName);
				zipOutputStream.putNextEntry(zipEntry);
				String fileDocumentId = zipSource.id();
				long fileSizeBytes = zipSource.fileSizeBytes();
				// Erst der Upload-Puffer (gerade hochgeladen), sonst der SFTP
				boolean servedFromStaging = fileStagingService.copyStagedFileRange(fileDocumentId, 0, fileSizeBytes,
						zipOutputStream);
				if (!servedFromStaging) {
					String sftpPath = zipSource.sftpPath();
					sftpService.readFileDataRange(sftpPath, 0, fileSizeBytes, zipOutputStream);
				}
				zipOutputStream.closeEntry();
				writtenFileCount = writtenFileCount + 1;
			}
			// Erst nach der letzten Datei: close() schreibt das Inhaltsverzeichnis, mit dem das ZIP als vollständig gilt,
			// und gibt den Speicher des Packers frei. Nach einem Fehler räumt ihn die Speicherbereinigung ab.
			zipOutputStream.close();
		} catch (IOException | RuntimeException exception) {
			boolean clientAborted = trackedResponseBody != null && trackedResponseBody.hasClientWriteFailed();
			if (clientAborted) {
				// Der Browser hat abgebrochen oder die Leitung ist weg. Kein Fehler des Servers.
				LOGGER.debug("ZIP-Auslieferung nach {} von {} Dateien vom Empfänger abgebrochen: {}", writtenFileCount,
						zipSources.size(), exception.toString());
				return;
			}
			// Bewusst ein Fehler, den kein Handler in eine Antwort verwandelt: Die Antwort läuft schon. Nur wenn er bis zum
			// Server durchgeht, schließt der die Verbindung ohne sauberes Ende, und der Browser meldet den Download als
			// fehlgeschlagen. Ein Handler schriebe seine Meldung ans Ende des ZIP und beendete die Antwort ordentlich.
			throw new IllegalStateException("Die ZIP-Auslieferung ist nach " + writtenFileCount + " von "
					+ zipSources.size() + " Dateien gescheitert.", exception);
		}
	}

	/** Der Kern jeder Auslieferung einer einzelnen Datei, ohne Leseprüfung: Die hat der Aufrufer gemacht. */
	private void doStreamFileDocument(String id, FileDocumentBackendFacts fileDocumentBackendFacts, boolean asAttachment,
			String rangeHeader, HttpServletResponse response) {
		long fileSizeBytes = fileDocumentBackendFacts.fileSizeBytes();
		String mimeType = fileDocumentBackendFacts.mimeType();
		boolean heifImage = heifService.isHeifMimeType(mimeType);
		if (!asAttachment && heifImage) {
			streamHeifImageAsJpeg(id, fileDocumentBackendFacts, response);
			return;
		}
		List<String> inlineMimeTypes = fileConfig.inlineMimeTypes();
		boolean inlineAllowed = mimeType != null && inlineMimeTypes.contains(mimeType);
		boolean inline = !asAttachment && inlineAllowed;

		String contentType = "application/octet-stream";
		if (mimeType != null) {
			contentType = mimeType;
		}
		String fileName = getFileNameOrId(fileDocumentBackendFacts, id);
		setDeliveryHeaders(response, contentType, fileName, inline);
		response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");

		long startByte = 0;
		long endByte = fileSizeBytes - 1;
		if (rangeHeader != null && !rangeHeader.isBlank()) {
			long[] requestedRange = parseSingleByteRange(rangeHeader, fileSizeBytes);
			if (requestedRange == null) {
				String unsatisfiableContentRange = "bytes */" + fileSizeBytes;
				response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
				response.setHeader(HttpHeaders.CONTENT_RANGE, unsatisfiableContentRange);
				return;
			}
			startByte = requestedRange[0];
			endByte = requestedRange[1];
			String contentRange = "bytes " + startByte + "-" + endByte + "/" + fileSizeBytes;
			response.setStatus(HttpStatus.PARTIAL_CONTENT.value());
			response.setHeader(HttpHeaders.CONTENT_RANGE, contentRange);
		}
		long contentLength = endByte - startByte + 1;
		response.setContentLengthLong(contentLength);

		String sftpPath = fileDocumentBackendFacts.sftpPath();
		try {
			OutputStream responseBody = response.getOutputStream();
			// Erst der Upload-Puffer (gerade hochgeladen), sonst der SFTP
			boolean servedFromStaging = fileStagingService.copyStagedFileRange(id, startByte, contentLength,
					responseBody);
			if (!servedFromStaging) {
				sftpService.readFileDataRange(sftpPath, startByte, contentLength, responseBody);
			}
		} catch (IOException | UncheckedIOException exception) {
			// Der Browser hat abgebrochen (Video weitergespult, Tab zu). Kein Fehler des Servers.
			LOGGER.debug("Auslieferung von {} abgebrochen: {}", id, exception.toString());
		}
	}

	/**
	 * Viewer für ein HEIF-Bild: Das Original kommt vom SFTP in eine Temp-Datei (liegt es noch im Upload-Puffer, direkt von
	 * dort), libheif wandelt es in ein JPEG, das geht inline an den Browser. Bei jedem Aufruf neu (~0,5 s je Bild), der
	 * Browser hält es wie jede Datei 5 Minuten. Ohne Byte-Bereiche: Ein Bild lädt der Browser am Stück.
	 *
	 * @throws UncheckedIOException wenn sich das Bild nicht umwandeln lässt (z. B. libheif fehlt), dann 500
	 */
	private void streamHeifImageAsJpeg(String id, FileDocumentBackendFacts fileDocumentBackendFacts,
			HttpServletResponse response) {
		Path heifFile;
		Path heifTempFile = null;
		boolean staged = fileStagingService.isStaged(id);
		if (staged) {
			heifFile = fileStagingService.getStagedFile(id);
		} else {
			String sftpPath = fileDocumentBackendFacts.sftpPath();
			heifTempFile = sftpService.readFileDataIntoTempFile(sftpPath);
			heifFile = heifTempFile;
		}
		Path jpegFile = null;
		try {
			long jpegSizeBytes;
			try {
				jpegFile = heifService.createJpegTempFileFromHeif(heifFile);
				jpegSizeBytes = Files.size(jpegFile);
			} catch (IOException exception) {
				throw new UncheckedIOException("Das HEIF-Bild " + id + " ließ sich nicht umwandeln.", exception);
			}
			String fileName = getFileNameOrId(fileDocumentBackendFacts, id);
			String jpegFileName = replaceFileExtensionWithJpg(fileName);
			setDeliveryHeaders(response, MediaType.IMAGE_JPEG_VALUE, jpegFileName, true);
			response.setContentLengthLong(jpegSizeBytes);
			try {
				OutputStream responseBody = response.getOutputStream();
				Files.copy(jpegFile, responseBody);
			} catch (IOException exception) {
				// Der Browser hat abgebrochen (Tab zu). Kein Fehler des Servers.
				LOGGER.debug("Auslieferung von {} abgebrochen: {}", id, exception.toString());
			}
		} finally {
			// Die Datei im Upload-Puffer bleibt, nur die Temp-Kopie vom SFTP geht
			Helper.deleteTempFile(heifTempFile);
			Helper.deleteTempFile(jpegFile);
		}
	}

	/**
	 * Die Header jeder Auslieferung: Typ, Anhang oder inline samt Dateiname, und der Schutz davor, dass der Browser etwas
	 * Hochgeladenes als Seite ausführt.
	 */
	private static void setDeliveryHeaders(HttpServletResponse response, String contentType, String fileName,
			boolean inline) {
		ContentDisposition.Builder contentDispositionBuilder = ContentDisposition.attachment();
		if (inline) {
			contentDispositionBuilder = ContentDisposition.inline();
		}
		ContentDisposition contentDisposition = contentDispositionBuilder.filename(fileName, StandardCharsets.UTF_8)
				.build();
		String contentDispositionText = contentDisposition.toString();
		response.setContentType(contentType);
		response.setHeader(HttpHeaders.CONTENT_DISPOSITION, contentDispositionText);
		// Der Browser nimmt den Typ, den wir nennen, und rät nie selbst (kein HTML aus einem „Bild“).
		response.setHeader("X-Content-Type-Options", "nosniff");
		// Öffnet jemand die Adresse direkt, läuft darin weder Skript noch Formular.
		response.setHeader("Content-Security-Policy", "sandbox");
		// Der Inhalt zu einer id ändert sich nie (id = Hash der Bytes), die Rechte schon: nur im Browser, kurz.
		response.setHeader(HttpHeaders.CACHE_CONTROL, "private, max-age=300");
	}

	/**
	 * Der Name eines Eintrags im ZIP: der gespeicherte Dateiname, bereinigt ({@link Helper#createSafeFileName}), ohne
	 * Namen die id mit Endung. Heißen zwei Bilder gleich, bekommt das zweite „ (2)“ vor der Endung, das dritte „ (3)“:
	 * Sonst überschriebe beim Entpacken eins das andere. Verglichen wird ohne Groß- und Kleinschreibung, wie Windows
	 * und macOS es beim Entpacken tun.
	 */
	private static String createUniqueZipEntryName(FileDocumentZipSource zipSource, Set<String> usedZipEntryNames) {
		String fileDocumentId = zipSource.id();
		String fileExtension = zipSource.fileExtension();
		String fallbackFileName = fileDocumentId;
		if (fileExtension != null && !fileExtension.isBlank()) {
			fallbackFileName = fileDocumentId + "." + fileExtension;
		}
		String storedFileName = zipSource.fileName();
		String safeFileName = Helper.createSafeFileName(storedFileName, fallbackFileName);
		int lastDotIndex = safeFileName.lastIndexOf('.');
		String nameWithoutExtension = safeFileName;
		String extensionWithDot = "";
		if (lastDotIndex > 0) {
			nameWithoutExtension = safeFileName.substring(0, lastDotIndex);
			extensionWithDot = safeFileName.substring(lastDotIndex);
		}
		String zipEntryName = safeFileName;
		int sameNameNumber = 1;
		while (true) {
			String comparableZipEntryName = zipEntryName.toLowerCase(Locale.ROOT);
			boolean nameFree = usedZipEntryNames.add(comparableZipEntryName);
			if (nameFree) {
				return zipEntryName;
			}
			sameNameNumber = sameNameNumber + 1;
			zipEntryName = nameWithoutExtension + " (" + sameNameNumber + ")" + extensionWithDot;
		}
	}

	/** Der gespeicherte Dateiname, ohne einen die id. */
	private static String getFileNameOrId(FileDocumentBackendFacts fileDocumentBackendFacts, String id) {
		String fileName = fileDocumentBackendFacts.fileName();
		if (fileName == null || fileName.isBlank()) {
			return id;
		}
		return fileName;
	}

	/** {@code IMG_0001.HEIC} wird {@code IMG_0001.jpg}: Speichert jemand das Bild aus dem Viewer, passt die Endung. */
	private static String replaceFileExtensionWithJpg(String fileName) {
		int lastDotIndex = fileName.lastIndexOf('.');
		String fileNameWithoutExtension = fileName;
		if (lastDotIndex > 0) {
			fileNameWithoutExtension = fileName.substring(0, lastDotIndex);
		}
		return fileNameWithoutExtension + ".jpg";
	}

	/**
	 * Der erste Byte-Bereich aus dem Range-Header als {start, ende} (beide einschließlich), auf die Datei gekürzt.
	 * {@code null}, wenn er nicht passt (dann 416). Mehrere Bereiche auf einmal gibt es nicht, Browser fragen einzeln.
	 */
	private static long[] parseSingleByteRange(String rangeHeader, long fileSizeBytes) {
		String trimmedRangeHeader = rangeHeader.trim();
		Matcher rangeMatcher = SINGLE_BYTE_RANGE_PATTERN.matcher(trimmedRangeHeader);
		if (!rangeMatcher.matches() || fileSizeBytes <= 0) {
			return null;
		}
		String startText = rangeMatcher.group(1);
		String endText = rangeMatcher.group(2);
		long lastByte = fileSizeBytes - 1;
		if (startText.isEmpty()) {
			if (endText.isEmpty()) {
				return null;
			}
			// bytes=-n: die letzten n Bytes
			long suffixLength = Long.parseLong(endText);
			if (suffixLength <= 0) {
				return null;
			}
			long suffixStart = Math.max(0, fileSizeBytes - suffixLength);
			return new long[] { suffixStart, lastByte };
		}
		long startByte = Long.parseLong(startText);
		if (startByte > lastByte) {
			return null;
		}
		long endByte = lastByte;
		if (!endText.isEmpty()) {
			long requestedEndByte = Long.parseLong(endText);
			endByte = Math.min(requestedEndByte, lastByte);
		}
		if (endByte < startByte) {
			return null;
		}
		return new long[] { startByte, endByte };
	}

	/**
	 * Reicht alles an die Antwort weiter und merkt sich, ob ein Schreiben zum Browser gescheitert ist. Damit unterscheidet
	 * der ZIP-Strom „der Empfänger ist weg“ (kein Fehler) von „bei uns ging etwas schief“ (harter Abbruch).
	 */
	private static final class ClientWriteTrackingOutputStream extends FilterOutputStream {

		private boolean clientWriteFailed;

		private ClientWriteTrackingOutputStream(OutputStream responseBody) {
			super(responseBody);
		}

		private boolean hasClientWriteFailed() {
			return clientWriteFailed;
		}

		@Override
		public void write(int singleByte) throws IOException {
			try {
				out.write(singleByte);
			} catch (IOException exception) {
				clientWriteFailed = true;
				throw exception;
			}
		}

		@Override
		public void write(byte[] buffer, int offset, int length) throws IOException {
			try {
				// direkt als Block: FilterOutputStream schriebe sonst Byte für Byte
				out.write(buffer, offset, length);
			} catch (IOException exception) {
				clientWriteFailed = true;
				throw exception;
			}
		}

		@Override
		public void flush() throws IOException {
			try {
				out.flush();
			} catch (IOException exception) {
				clientWriteFailed = true;
				throw exception;
			}
		}
	}
}
