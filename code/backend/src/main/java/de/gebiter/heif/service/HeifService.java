package de.gebiter.heif.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.InterruptedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import de.gebiter.util.Helper;

/**
 * HEIF-Bilder (HEIC vom iPhone, auch das Standbild eines Live Photos): Kein Browser außer Safari zeigt sie, und Java
 * liest sie nicht. Dieser Service wandelt sie mit {@code heif-dec} aus libheif in JPEG, dem Standard-Decoder für HEIF
 * (auch in GIMP, ImageMagick und libvips). libheif muss auf dem Rechner des Backends installiert sein, siehe
 * {@code gebiter.heif} in der {@code application.yaml}.
 * <p>
 * libheif dreht das Bild dabei aufrecht und übernimmt die EXIF-Daten (Aufnahme, Kamera, GPS) ins JPEG. Die Ausrichtung
 * darin steht danach auf 1, damit niemand ein zweites Mal dreht.
 */
@Service
public class HeifService {

	/** Diese Typen (laut Tika) sind HEIF-Bilder, {@code gebiter.heif.mime-types}. */
	private final List<String> heifMimeTypes;

	/** Der Befehl von libheif, der HEIF in JPEG wandelt. */
	private final String decoderCommand;

	/** JPEG-Qualität 0 bis 100. */
	private final int jpegQuality;

	/** Länger darf das Umwandeln eines Bildes nicht dauern. */
	private final Duration decoderTimeout;

	public HeifService(@Value("${gebiter.heif.mime-types}") List<String> heifMimeTypes,
			@Value("${gebiter.heif.decoder-command}") String decoderCommand,
			@Value("${gebiter.heif.jpeg-quality}") int jpegQuality,
			@Value("${gebiter.heif.decoder-timeout}") Duration decoderTimeout) {
		this.heifMimeTypes = List.copyOf(heifMimeTypes);
		this.decoderCommand = decoderCommand;
		this.jpegQuality = jpegQuality;
		this.decoderTimeout = decoderTimeout;
	}

	/** READ: Ist das ein HEIF-Bild, das erst in JPEG gewandelt werden muss? {@code null} heißt nein. */
	public boolean isHeifMimeType(String mimeType) {
		return mimeType != null && heifMimeTypes.contains(mimeType);
	}

	/**
	 * CREATE: Wandelt ein HEIF-Bild in ein JPEG in einer neuen Temp-Datei. Die gehört dem Aufrufer, er löscht sie mit
	 * {@link Helper#deleteTempFile(Path)}. Scheitert das Umwandeln, gibt es keine Temp-Datei.
	 *
	 * @throws IOException wenn {@code heif-dec} fehlt, scheitert oder zu lange braucht
	 */
	public Path createJpegTempFileFromHeif(Path heifFile) throws IOException {
		Path jpegFile = Files.createTempFile("gebiter-heif-", ".jpg");
		try {
			runDecoder(heifFile, jpegFile);
			return jpegFile;
		} catch (IOException exception) {
			Helper.deleteTempFile(jpegFile);
			throw exception;
		}
	}

	/** Ruft {@code heif-dec} auf, ohne Shell: Jeder Teil ist ein eigenes Argument. Das Zielformat folgt aus der Endung .jpg. */
	private void runDecoder(Path heifFile, Path jpegFile) throws IOException {
		String jpegQualityText = Integer.toString(jpegQuality);
		String heifFilePath = heifFile.toString();
		String jpegFilePath = jpegFile.toString();
		List<String> decoderCall = List.of(decoderCommand, "--quiet", "--quality", jpegQualityText, heifFilePath,
				jpegFilePath);
		ProcessBuilder decoderProcessBuilder = new ProcessBuilder(decoderCall);
		decoderProcessBuilder.redirectErrorStream(true);
		Process decoderProcess = decoderProcessBuilder.start();
		boolean finished;
		try {
			long decoderTimeoutMillis = decoderTimeout.toMillis();
			finished = decoderProcess.waitFor(decoderTimeoutMillis, TimeUnit.MILLISECONDS);
		} catch (InterruptedException exception) {
			decoderProcess.destroyForcibly();
			Thread.currentThread().interrupt();
			throw new InterruptedIOException("Warten auf " + decoderCommand + " unterbrochen.");
		}
		if (!finished) {
			decoderProcess.destroyForcibly();
			throw new IOException(decoderCommand + " brauchte länger als " + decoderTimeout + ".");
		}
		// Mit --quiet schreibt heif-dec nur Fehlermeldungen, ein paar Zeilen. Die passen in den Puffer der Pipe, deshalb
		// reicht es, sie nach dem Ende zu lesen.
		String decoderOutputText;
		try (InputStream decoderOutput = decoderProcess.getInputStream()) {
			byte[] decoderOutputBytes = decoderOutput.readAllBytes();
			decoderOutputText = new String(decoderOutputBytes, StandardCharsets.UTF_8);
		}
		int exitCode = decoderProcess.exitValue();
		if (exitCode != 0) {
			String trimmedDecoderOutputText = decoderOutputText.strip();
			throw new IOException(decoderCommand + " endete mit " + exitCode + ": " + trimmedDecoderOutputText);
		}
	}
}
