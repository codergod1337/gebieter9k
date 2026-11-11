package de.gebiter.file.service;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Iterator;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileConfig;

/**
 * Rechnet aus Bildern, was die Auswertung braucht: das Vorschaubild und die verkleinerte Kopie für die Texterkennung.
 * <p>
 * Das Vorschaubild wie im Konzept: PNG, quadratisch ({@code gebiter.file.preview-size-pixels}), das
 * ganze Bild eingepasst und mittig, der Rest transparent, nichts abgeschnitten, nach EXIF gedreht. Als Base64 ohne
 * Präfix, damit eine Trefferliste die Vorschau direkt aus der Solr-Antwort zeigt.
 * <p>
 * Große Fotos werden schon beim Dekodieren verkleinert gelesen (Unterabtastung), danach stufenweise halbiert und zuletzt
 * bikubisch eingepasst. Gelesen wird über ImageIO, JPEG über TwelveMonkeys (kann auch CMYK). Scheitert etwas, gibt es
 * keine Vorschau, der Upload läuft trotzdem weiter.
 */
@Service
public class FilePreviewService {

	private static final Logger LOGGER = LoggerFactory.getLogger(FilePreviewService.class);

	private final FileConfig fileConfig;

	/** Die lange Seite der Kopie für die Texterkennung ({@code gebiter.file.text-recognition-max-long-side-pixels}). */
	private final int textRecognitionMaxLongSidePixels;

	/** JPEG-Qualität dieser Kopie, 0 bis 1 ({@code gebiter.file.text-recognition-jpeg-quality}). */
	private final float textRecognitionJpegQuality;

	public FilePreviewService(FileConfig fileConfig,
			@Value("${gebiter.file.text-recognition-max-long-side-pixels}") int textRecognitionMaxLongSidePixels,
			@Value("${gebiter.file.text-recognition-jpeg-quality}") float textRecognitionJpegQuality) {
		this.fileConfig = fileConfig;
		this.textRecognitionMaxLongSidePixels = textRecognitionMaxLongSidePixels;
		this.textRecognitionJpegQuality = textRecognitionJpegQuality;
		// Im ausführbaren Spring-Boot-Jar findet ImageIO Plugins aus eingebetteten Jars (TwelveMonkeys) erst nach einem Scan.
		ImageIO.scanForPlugins();
	}

	/**
	 * CREATE: Das Vorschaubild als Base64-PNG, {@code null}, wenn sich die Datei nicht als Bild lesen lässt.
	 *
	 * @param imageDataStream die Bytes der Datei, der Aufrufer schließt den Strom
	 * @param exifOrientation EXIF-Ausrichtung 1 bis 8 (von Tika), {@code null} heißt 1 (wie gespeichert)
	 */
	public String createPreviewBase64Png(InputStream imageDataStream, Integer exifOrientation) {
		try {
			BufferedImage decodedImage = decodeImageSubsampled(imageDataStream);
			if (decodedImage == null) {
				return null;
			}
			BufferedImage orientedImage = applyExifOrientation(decodedImage, exifOrientation);
			BufferedImage previewImage = fitIntoTransparentSquare(orientedImage);
			ByteArrayOutputStream pngBytes = new ByteArrayOutputStream();
			// fest PNG: das Konzept verlangt PNG mit Transparenz
			ImageIO.write(previewImage, "png", pngBytes);
			byte[] pngByteArray = pngBytes.toByteArray();
			Base64.Encoder base64Encoder = Base64.getEncoder();
			return base64Encoder.encodeToString(pngByteArray);
		} catch (IOException | RuntimeException exception) {
			LOGGER.info("Vorschaubild: nicht möglich: {}", exception.toString());
			return null;
		}
	}

	/**
	 * CREATE: Eine verkleinerte Kopie des Bildes für die Texterkennung, als JPEG im Temp-Ordner: lange Seite höchstens
	 * {@code gebiter.file.text-recognition-max-long-side-pixels}, nach EXIF gedreht (der Text steht aufrecht), auf weißem
	 * Grund. Kleinere Bilder bleiben so groß, wie sie sind. Tesseract braucht für ein Kamerafoto im Original ein
	 * Vielfaches: 51 Megapixel ohne Text 92 s auf dem Pi, die Kopie mit 4000 px 2,2 s; ein Brief in derselben Auflösung
	 * wird auf der Kopie genauso fehlerfrei gelesen (gemessen 2026-11-09). Der Aufrufer löscht die Datei.
	 *
	 * @return die Kopie, {@code null}, wenn sich die Datei nicht als Bild lesen lässt (dann liest der Aufrufer das Original)
	 */
	public Path createTextRecognitionImageFile(Path imageFile, Integer exifOrientation) {
		BufferedImage decodedImage;
		try (InputStream imageDataStream = Files.newInputStream(imageFile)) {
			decodedImage = decodeImageForLongSide(imageDataStream, textRecognitionMaxLongSidePixels);
		} catch (IOException | RuntimeException exception) {
			LOGGER.info("Texterkennung: Bild für die Kopie nicht lesbar: {}", exception.toString());
			return null;
		}
		if (decodedImage == null) {
			return null;
		}
		BufferedImage orientedImage = applyExifOrientation(decodedImage, exifOrientation);
		BufferedImage textRecognitionImage = fitLongSideOnWhite(orientedImage, textRecognitionMaxLongSidePixels);
		try {
			return writeJpegTempFile(textRecognitionImage, textRecognitionJpegQuality);
		} catch (IOException exception) {
			throw new UncheckedIOException("Die Kopie für die Texterkennung ließ sich nicht schreiben.", exception);
		}
	}

	/**
	 * Dekodiert das erste Bild so verkleinert, dass die lange Seite noch mindestens {@code minLongSide} lang ist (jede
	 * n-te Zeile und Spalte). {@code null}, wenn kein Leser passt.
	 */
	private BufferedImage decodeImageForLongSide(InputStream imageDataStream, int minLongSide) throws IOException {
		try (ImageInputStream imageInputStream = ImageIO.createImageInputStream(imageDataStream)) {
			if (imageInputStream == null) {
				return null;
			}
			Iterator<ImageReader> imageReaders = ImageIO.getImageReaders(imageInputStream);
			if (!imageReaders.hasNext()) {
				return null;
			}
			ImageReader imageReader = imageReaders.next();
			try {
				imageReader.setInput(imageInputStream, true, true);
				int imageWidth = imageReader.getWidth(0);
				int imageHeight = imageReader.getHeight(0);
				int longSide = Math.max(imageWidth, imageHeight);
				int subsamplingStep = Math.max(1, longSide / minLongSide);
				ImageReadParam imageReadParam = imageReader.getDefaultReadParam();
				imageReadParam.setSourceSubsampling(subsamplingStep, subsamplingStep, 0, 0);
				return imageReader.read(0, imageReadParam);
			} finally {
				imageReader.dispose();
			}
		}
	}

	/** Verkleinert bikubisch auf höchstens {@code maxLongSide} lange Seite (nie größer) und malt auf Weiß, ohne Alpha. */
	private BufferedImage fitLongSideOnWhite(BufferedImage image, int maxLongSide) {
		int width = image.getWidth();
		int height = image.getHeight();
		int longSide = Math.max(width, height);
		double scale = Math.min(1.0, (double) maxLongSide / longSide);
		long roundedWidth = Math.round(width * scale);
		long roundedHeight = Math.round(height * scale);
		int fittedWidth = (int) Math.max(1, roundedWidth);
		int fittedHeight = (int) Math.max(1, roundedHeight);
		BufferedImage fittedImage = new BufferedImage(fittedWidth, fittedHeight, BufferedImage.TYPE_INT_RGB);
		Graphics2D graphics = fittedImage.createGraphics();
		try {
			graphics.setColor(Color.WHITE);
			graphics.fillRect(0, 0, fittedWidth, fittedHeight);
			graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
			graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
			graphics.drawImage(image, 0, 0, fittedWidth, fittedHeight, null);
		} finally {
			graphics.dispose();
		}
		return fittedImage;
	}

	/** Schreibt das Bild als JPEG in dieser Qualität in eine neue Datei im Temp-Ordner. */
	private static Path writeJpegTempFile(BufferedImage image, float jpegQuality) throws IOException {
		Iterator<ImageWriter> jpegWriters = ImageIO.getImageWritersByFormatName("jpeg");
		if (!jpegWriters.hasNext()) {
			throw new IOException("Kein JPEG-Schreiber vorhanden.");
		}
		ImageWriter jpegWriter = jpegWriters.next();
		Path jpegFile = Files.createTempFile("gebiter9k-ocr-", ".jpg");
		try (ImageOutputStream imageOutputStream = ImageIO.createImageOutputStream(jpegFile.toFile())) {
			jpegWriter.setOutput(imageOutputStream);
			ImageWriteParam writeParam = jpegWriter.getDefaultWriteParam();
			writeParam.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
			writeParam.setCompressionQuality(jpegQuality);
			IIOImage jpegImage = new IIOImage(image, null, null);
			jpegWriter.write(null, jpegImage, writeParam);
		} catch (IOException | RuntimeException exception) {
			Files.deleteIfExists(jpegFile);
			throw exception;
		} finally {
			jpegWriter.dispose();
		}
		return jpegFile;
	}

	/** Dekodiert das erste Bild der Datei, bei großen Bildern gleich verkleinert. {@code null}, wenn kein Leser passt. */
	private BufferedImage decodeImageSubsampled(InputStream imageDataStream) throws IOException {
		try (ImageInputStream imageInputStream = ImageIO.createImageInputStream(imageDataStream)) {
			if (imageInputStream == null) {
				return null;
			}
			Iterator<ImageReader> imageReaders = ImageIO.getImageReaders(imageInputStream);
			if (!imageReaders.hasNext()) {
				return null;
			}
			ImageReader imageReader = imageReaders.next();
			try {
				imageReader.setInput(imageInputStream, true, true);
				int imageWidth = imageReader.getWidth(0);
				int imageHeight = imageReader.getHeight(0);
				int shortSide = Math.min(imageWidth, imageHeight);
				int minShortSide = fileConfig.previewDecodeMinShortSidePixels();
				// jede n-te Zeile und Spalte: die kurze Seite bleibt mindestens minShortSide lang
				int subsamplingStep = Math.max(1, shortSide / minShortSide);
				ImageReadParam imageReadParam = imageReader.getDefaultReadParam();
				imageReadParam.setSourceSubsampling(subsamplingStep, subsamplingStep, 0, 0);
				return imageReader.read(0, imageReadParam);
			} finally {
				imageReader.dispose();
			}
		}
	}

	/**
	 * Dreht und spiegelt nach der EXIF-Ausrichtung, so dass das Bild aufrecht steht. 1 = wie gespeichert, 3 = 180°,
	 * 6 = 90° im Uhrzeigersinn, 8 = 90° gegen den Uhrzeigersinn, 2/4/5/7 dazu gespiegelt.
	 */
	private BufferedImage applyExifOrientation(BufferedImage image, Integer exifOrientation) {
		if (exifOrientation == null || exifOrientation <= 1 || exifOrientation > 8) {
			return image;
		}
		int width = image.getWidth();
		int height = image.getHeight();
		boolean swapsSides = exifOrientation >= 5;
		int orientedWidth = width;
		int orientedHeight = height;
		if (swapsSides) {
			orientedWidth = height;
			orientedHeight = width;
		}
		AffineTransform orientationTransform = new AffineTransform();
		switch (exifOrientation) {
		case 2 -> {
			orientationTransform.translate(width, 0);
			orientationTransform.scale(-1, 1);
		}
		case 3 -> {
			orientationTransform.translate(width, height);
			orientationTransform.rotate(Math.PI);
		}
		case 4 -> {
			orientationTransform.translate(0, height);
			orientationTransform.scale(1, -1);
		}
		case 5 -> {
			orientationTransform.rotate(Math.PI / 2);
			orientationTransform.scale(1, -1);
		}
		case 6 -> {
			orientationTransform.translate(height, 0);
			orientationTransform.rotate(Math.PI / 2);
		}
		case 7 -> {
			orientationTransform.scale(-1, 1);
			orientationTransform.translate(-height, 0);
			orientationTransform.translate(0, width);
			orientationTransform.rotate(-Math.PI / 2);
		}
		case 8 -> {
			orientationTransform.translate(0, width);
			orientationTransform.rotate(-Math.PI / 2);
		}
		default -> {
			return image;
		}
		}
		BufferedImage orientedImage = new BufferedImage(orientedWidth, orientedHeight, BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = orientedImage.createGraphics();
		try {
			graphics.drawImage(image, orientationTransform, null);
		} finally {
			graphics.dispose();
		}
		return orientedImage;
	}

	/** Passt das Bild ins Quadrat: Seitenverhältnis bleibt, längste Seite = Kantenlänge, mittig, Rest transparent. */
	private BufferedImage fitIntoTransparentSquare(BufferedImage image) {
		int previewSize = fileConfig.previewSizePixels();
		int width = image.getWidth();
		int height = image.getHeight();
		int longSide = Math.max(width, height);
		double scale = (double) previewSize / longSide;
		if (scale > 1) {
			// kleine Bilder werden nicht hochgerechnet, sie stehen in Originalgröße mittig
			scale = 1;
		}
		long roundedFittedWidth = Math.round(width * scale);
		long roundedFittedHeight = Math.round(height * scale);
		// mindestens ein Pixel, auch bei extrem schmalen Bildern
		int fittedWidth = (int) Math.max(1, roundedFittedWidth);
		int fittedHeight = (int) Math.max(1, roundedFittedHeight);
		BufferedImage halvedImage = halveStepwise(image, fittedWidth, fittedHeight);

		BufferedImage squareImage = new BufferedImage(previewSize, previewSize, BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = squareImage.createGraphics();
		try {
			graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
			graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
			int left = (previewSize - fittedWidth) / 2;
			int top = (previewSize - fittedHeight) / 2;
			graphics.drawImage(halvedImage, left, top, fittedWidth, fittedHeight, null);
		} finally {
			graphics.dispose();
		}
		return squareImage;
	}

	/** Halbiert so lange, bis das Bild höchstens doppelt so groß ist wie das Ziel: Ein einziger großer Schritt flimmert. */
	private BufferedImage halveStepwise(BufferedImage image, int targetWidth, int targetHeight) {
		BufferedImage currentImage = image;
		while (currentImage.getWidth() > targetWidth * 2 && currentImage.getHeight() > targetHeight * 2) {
			int halfWidth = currentImage.getWidth() / 2;
			int halfHeight = currentImage.getHeight() / 2;
			BufferedImage halfImage = new BufferedImage(halfWidth, halfHeight, BufferedImage.TYPE_INT_ARGB);
			Graphics2D graphics = halfImage.createGraphics();
			try {
				graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
				graphics.drawImage(currentImage, 0, 0, halfWidth, halfHeight, null);
			} finally {
				graphics.dispose();
			}
			currentImage = halfImage;
		}
		return currentImage;
	}
}
