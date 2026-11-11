package de.gebiter.image.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Iterator;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import de.gebiter.tika.service.TikaService;

/**
 * Prüft ein Bild, das als Base64-PNG gespeichert werden soll, wie der Base64PngService der Vorlage (zuerst das
 * Profilbild): Der Browser hat zugeschnitten und skaliert, hier wird nur geprüft, ob wirklich ein PNG in genau den
 * verlangten Maßen und unter der Größengrenze kommt. Für jedes weitere Base64-Bild wiederverwendbar, Maße und Grenze gibt
 * der Aufrufer vor.
 * <p>
 * Dass es wirklich ein Bild ist und z. B. keine Textdatei, prüfen drei Stellen nacheinander: die Kennung am Anfang der
 * Bytes, Tika (erkennt den Typ an den Bytes wie beim Upload jeder Datei, Nutzer 2026-11-10) und zuletzt das Dekodieren
 * selbst.
 * <p>
 * Die Reihenfolge schützt den Speicher: erst die Länge des Base64, dann die Bytes, dann der Typ, dann die Maße aus dem
 * Kopf des PNG, und erst wenn alles stimmt, wird das Bild dekodiert. Ein PNG nennt seine Maße im Kopf; eine Datei von
 * wenigen hundert Bytes kann dort 30 000 × 30 000 Pixel behaupten, das Dekodieren verlangte dann Gigabytes.
 * <p>
 * Das Vorschaubild des Uploads ist der andere Weg: Dort rechnet das Backend aus einer Datei, hier kommt das fertige Bild
 * vom Client.
 */
@Service
public class Base64PngService {

	/** Erkennt den Typ an den Bytes, als zweite Meinung zur Kennung. */
	private final TikaService tikaService;

	public Base64PngService(TikaService tikaService) {
		this.tikaService = tikaService;
	}

	/**
	 * Das Base64 ohne Präfix zurück, wenn es ein PNG von genau {@code width} × {@code height} Pixeln und höchstens
	 * {@code maxBytes} ist; ein {@code data:}-Präfix wird abgeschnitten.
	 *
	 * @throws IllegalArgumentException wenn das Bild fehlt, kein Base64 oder kein PNG ist, zu groß ist oder andere Maße hat
	 */
	public String requireValidBase64Png(String base64Png, int width, int height, long maxBytes) {
		if (base64Png == null || base64Png.isBlank()) {
			throw new IllegalArgumentException("Das Bild fehlt.");
		}
		String rawBase64Png = base64Png.trim();
		int commaIndex = rawBase64Png.indexOf(',');
		boolean dataUrl = rawBase64Png.startsWith("data:") && commaIndex > 0;
		if (dataUrl) {
			rawBase64Png = rawBase64Png.substring(commaIndex + 1);
		}
		// Base64 macht aus je 3 Bytes 4 Zeichen: Ist der Text länger als die Grenze so je ergeben kann, wird er gar nicht
		// erst in Bytes umgewandelt
		long maxBase64Length = (maxBytes + 2) / 3 * 4;
		if (rawBase64Png.length() > maxBase64Length) {
			throw new IllegalArgumentException("Das Bild ist zu groß, erlaubt sind " + maxBytes + " Bytes.");
		}
		byte[] pngBytes;
		try {
			Base64.Decoder base64Decoder = Base64.getDecoder();
			pngBytes = base64Decoder.decode(rawBase64Png);
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("Das Bild ist kein Base64.");
		}
		if (pngBytes.length > maxBytes) {
			throw new IllegalArgumentException("Das Bild ist zu groß: " + pngBytes.length + " Bytes, erlaubt sind "
					+ maxBytes + ".");
		}
		boolean pngSignature = startsWithPngSignature(pngBytes);
		if (!pngSignature) {
			throw new IllegalArgumentException("Das Bild ist kein PNG.");
		}
		requireDetectedAsPng(pngBytes);
		requireReadablePngOfSize(pngBytes, width, height);
		return rawBase64Png;
	}

	/**
	 * Tika muss die Bytes ebenfalls als PNG erkennen, ohne Dateinamen: Es zählen nur die Bytes.
	 *
	 * @throws IllegalArgumentException wenn Tika einen anderen Typ erkennt oder die Bytes nicht lesen kann
	 */
	private void requireDetectedAsPng(byte[] pngBytes) {
		String detectedMimeType;
		try {
			ByteArrayInputStream pngInputStream = new ByteArrayInputStream(pngBytes);
			String noFileName = null;
			detectedMimeType = tikaService.detectMimeType(pngInputStream, noFileName);
		} catch (IOException exception) {
			throw new IllegalArgumentException("Das PNG ist nicht lesbar.");
		}
		boolean detectedAsPng = MediaType.IMAGE_PNG_VALUE.equals(detectedMimeType);
		if (!detectedAsPng) {
			throw new IllegalArgumentException("Das Bild ist kein PNG, Tika erkennt " + detectedMimeType + ".");
		}
	}

	/**
	 * Liest zuerst nur die Maße aus dem Kopf des PNG und dekodiert das Bild erst, wenn sie stimmen. So steht fest, wie
	 * viel Speicher das Dekodieren braucht, bevor es beginnt.
	 *
	 * @throws IllegalArgumentException wenn das PNG andere Maße nennt oder sich nicht lesen lässt
	 */
	private static void requireReadablePngOfSize(byte[] pngBytes, int width, int height) {
		ByteArrayInputStream pngInputStream = new ByteArrayInputStream(pngBytes);
		try (ImageInputStream imageInputStream = ImageIO.createImageInputStream(pngInputStream)) {
			if (imageInputStream == null) {
				throw new IllegalArgumentException("Das PNG ist nicht lesbar.");
			}
			Iterator<ImageReader> imageReaders = ImageIO.getImageReaders(imageInputStream);
			if (!imageReaders.hasNext()) {
				throw new IllegalArgumentException("Das PNG ist nicht lesbar.");
			}
			ImageReader imageReader = imageReaders.next();
			try {
				imageReader.setInput(imageInputStream, true, true);
				// nur der Kopf der Datei, noch kein einziges Pixel
				int imageWidth = imageReader.getWidth(0);
				int imageHeight = imageReader.getHeight(0);
				boolean expectedSize = imageWidth == width && imageHeight == height;
				if (!expectedSize) {
					throw new IllegalArgumentException("Das Bild muss " + width + " × " + height + " Pixel haben, es hat "
							+ imageWidth + " × " + imageHeight + ".");
				}
				// erst jetzt dekodieren: Die Maße stimmen, der Speicherbedarf steht fest
				BufferedImage pngImage = imageReader.read(0);
				if (pngImage == null) {
					throw new IllegalArgumentException("Das PNG ist nicht lesbar.");
				}
			} finally {
				imageReader.dispose();
			}
		} catch (IOException exception) {
			throw new IllegalArgumentException("Das PNG ist nicht lesbar.");
		}
	}

	/** Die ersten acht Bytes jeder PNG-Datei: 89 50 4E 47 0D 0A 1A 0A. Teil des PNG-Formats, keine Einstellung. */
	private static boolean startsWithPngSignature(byte[] pngBytes) {
		byte[] pngSignature = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
		if (pngBytes.length < pngSignature.length) {
			return false;
		}
		for (int index = 0; index < pngSignature.length; index++) {
			if (pngBytes[index] != pngSignature[index]) {
				return false;
			}
		}
		return true;
	}
}
