package de.gebiter.file.service;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileConfig;
import de.gebiter.file.dto.FileDocumentBackendFacts;
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
}
