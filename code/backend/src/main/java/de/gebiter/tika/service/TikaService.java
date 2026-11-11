package de.gebiter.tika.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.tika.detect.Detector;
import org.apache.tika.exception.TikaException;
import org.apache.tika.exception.WriteLimitReachedException;
import org.apache.tika.io.TemporaryResources;
import org.apache.tika.io.TikaInputStream;
import org.apache.tika.metadata.Geographic;
import org.apache.tika.metadata.HttpHeaders;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.Property;
import org.apache.tika.metadata.TIFF;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.mime.MediaType;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.ocr.TesseractOCRConfig;
import org.apache.tika.parser.RecursiveParserWrapper;
import org.apache.tika.sax.BasicContentHandlerFactory;
import org.apache.tika.sax.BodyContentHandler;
import org.apache.tika.sax.RecursiveParserWrapperHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.xml.sax.SAXException;

import de.gebiter.tika.dto.TikaFileContent;
import de.gebiter.tika.dto.TikaProbeDocument;
import de.gebiter.tika.dto.TikaProbeResult;
import de.gebiter.util.CountingDigestInputStream;

/**
 * Tika im Backend: liest Dateityp, Metadaten (auch EXIF) und Text aus Dateien. Tika läuft nur hier, nie in Solr; was
 * davon nach Solr geht, entscheidet allein das Backend.
 * <p>
 * Dateien werden durchgeleitet, nie am Stück in den Speicher gelegt. Braucht ein Format wahlfreien Zugriff (z. B.
 * ZIP-basierte wie DOCX), legt Tika selbst eine Temp-Datei auf die Platte und räumt sie danach weg.
 */
@Service
public class TikaService {

	private static final Logger LOGGER = LoggerFactory.getLogger(TikaService.class);

	/** Erkennt das Format an den Bytes und wählt den Parser. Einmal gebaut, für alle Anfragen gleichzeitig nutzbar. */
	private final AutoDetectParser autoDetectParser;

	/** Texterkennung (Tesseract) in der Auswertung, {@code gebiter.tika.ocr-enabled}. */
	private final boolean ocrEnabled;

	/** Sprachen für Tesseract, z. B. {@code deu+eng}. */
	private final String ocrLanguage;

	/** Längstens so lange je Datei. */
	private final Duration ocrTimeout;

	public TikaService(@Value("${gebiter.tika.ocr-enabled}") boolean ocrEnabled,
			@Value("${gebiter.tika.ocr-language}") String ocrLanguage,
			@Value("${gebiter.tika.ocr-timeout}") Duration ocrTimeout) {
		this.autoDetectParser = new AutoDetectParser();
		this.ocrEnabled = ocrEnabled;
		this.ocrLanguage = ocrLanguage;
		this.ocrTimeout = ocrTimeout;
	}

	/**
	 * READ: Nur der Dateityp, erkannt an den ersten Bytes (Magic Bytes) und am Dateinamen, ohne die Datei zu parsen. Dauert
	 * Millisekunden; für den Upload, damit der Viewer die Datei sofort zeigen kann. {@code null}, wenn Tika nichts erkennt.
	 *
	 * @throws IOException wenn das Lesen scheitert
	 */
	public String detectMimeType(InputStream fileDataStream, String fileName) throws IOException {
		Metadata fileMetadata = new Metadata();
		fileMetadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, fileName);
		try (TemporaryResources temporaryResources = new TemporaryResources();
				TikaInputStream tikaInputStream = TikaInputStream.get(fileDataStream, temporaryResources,
						fileMetadata)) {
			Detector detector = autoDetectParser.getDetector();
			ParseContext detectContext = new ParseContext();
			MediaType mediaType = detector.detect(tikaInputStream, fileMetadata, detectContext);
			if (mediaType == null) {
				return null;
			}
			MediaType baseMediaType = mediaType.getBaseType();
			return baseMediaType.toString();
		}
	}

	/**
	 * CREATE: Der Tika-Test, nur ADMIN. Gibt die Datei an Tika und verwirft sie danach; zurück kommt alles, was Tika
	 * findet, auch in eingebetteten Dokumenten, der Text vollständig. Bewusst ohne Grenzen, wir wollen sehen, wo Tika an
	 * seine Grenzen kommt. Die Texterkennung läuft mit denselben Einstellungen wie nach dem Upload ({@code gebiter.tika.*}).
	 * <p>
	 * Liest den Request Body danach zu Ende, auch wenn Tika vorher aufgehört hat, z. B. bei einem Video nach den
	 * Kopfdaten: So kommt die Datei ganz an, und die Antwort nennt die volle Größe.
	 *
	 * @param fileDataStream die Bytes der Datei, roh, nichts sonst
	 * @throws IOException wenn das Lesen scheitert, z. B. weil der Client abbricht
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public TikaProbeResult createTikaProbe(InputStream fileDataStream) throws IOException {
		long startNanos = System.nanoTime();
		CountingDigestInputStream countingFileDataStream = new CountingDigestInputStream(fileDataStream, null);
		// TEXT ohne Grenze (-1): wirklich der ganze Text.
		BasicContentHandlerFactory textHandlerFactory = new BasicContentHandlerFactory(
				BasicContentHandlerFactory.HANDLER_TYPE.TEXT, -1);
		RecursiveParserWrapperHandler documentsHandler = new RecursiveParserWrapperHandler(textHandlerFactory);
		RecursiveParserWrapper recursiveParser = new RecursiveParserWrapper(autoDetectParser);
		Metadata fileMetadata = new Metadata();
		// dieselbe Texterkennung wie nach dem Upload, sonst prüft der Test etwas anderes
		ParseContext parseContext = createParseContext(true);

		String parseErrorText = null;
		try (TemporaryResources temporaryResources = new TemporaryResources();
				TikaInputStream tikaInputStream = TikaInputStream.get(countingFileDataStream, temporaryResources,
						fileMetadata)) {
			recursiveParser.parse(tikaInputStream, documentsHandler, fileMetadata, parseContext);
		} catch (TikaException | SAXException parseException) {
			parseErrorText = parseException.toString();
			LOGGER.info("Tika-Test: Tika hat abgebrochen: {}", parseErrorText);
		}
		OutputStream discardedBytes = OutputStream.nullOutputStream();
		countingFileDataStream.transferTo(discardedBytes);

		List<Metadata> documentMetadataList = documentsHandler.getMetadataList();
		List<TikaProbeDocument> documents = new ArrayList<>();
		for (Metadata documentMetadata : documentMetadataList) {
			TikaProbeDocument document = toTikaProbeDocument(documentMetadata);
			documents.add(document);
		}
		long receivedBytes = countingFileDataStream.byteCount();
		long durationNanos = System.nanoTime() - startNanos;
		long durationMillis = durationNanos / 1_000_000;
		int documentCount = documents.size();
		LOGGER.info("Tika-Test: {} Bytes, {} Dokumente, {} ms.", receivedBytes, documentCount, durationMillis);
		return new TikaProbeResult(receivedBytes, durationMillis, parseErrorText, documents);
	}

	/**
	 * READ: Liest eine Datei für die Auswertung nach dem Upload: Typ, Text (höchstens {@code maxTextCharacters} Zeichen,
	 * der Rest fällt weg) und die EXIF-Werte, die in den Kern gehen. Nur die Datei selbst, nicht ihre eingebetteten
	 * Dokumente. Bricht Tika ab, kommt zurück, was es bis dahin gefunden hat.
	 * <p>
	 * {@code textRecognitionWanted}: mit Texterkennung (Tesseract, wenn sie in der YAML an ist). Bei einem Foto aus der
	 * Kamera läuft sie besser nicht auf dem Original, sondern auf einer verkleinerten Kopie: Auf dem Pi brauchte sie für
	 * 51 Megapixel ohne Text 92 s, für dieselbe Kopie mit 4000 px 2,2 s (gemessen 2026-11-09).
	 * <p>
	 * Tika bekommt die Datei als Pfad: Was es überspringt (z. B. die Videodaten eines MP4), springt es auf der Platte
	 * einfach über, statt es zu lesen, und es legt keine eigene Kopie an. Der Speicher hängt deshalb nicht an der Größe
	 * der Datei (geprüft 2026-11-08: 50-GB-MP4 mit 64 MB Heap in 0,5 s). Grenze von Tika selbst: Bei einem MP4/MOV
	 * hört der Leser an einer Box über 2 GiB auf; stehen die Metadaten dahinter (Kameras), findet er sie nicht.
	 *
	 * @throws IOException wenn das Lesen der Bytes scheitert
	 */
	public TikaFileContent readFileContent(Path file, int maxTextCharacters, boolean textRecognitionWanted)
			throws IOException {
		BodyContentHandler textHandler = new BodyContentHandler(maxTextCharacters);
		Metadata fileMetadata = new Metadata();
		ParseContext parseContext = createParseContext(textRecognitionWanted);
		try (TikaInputStream tikaInputStream = TikaInputStream.get(file, fileMetadata)) {
			autoDetectParser.parse(tikaInputStream, textHandler, fileMetadata, parseContext);
		} catch (SAXException writeLimitException) {
			// Der Text ist länger als erlaubt: Was bis dahin kam, bleibt, der Rest fällt weg.
			boolean writeLimitReached = WriteLimitReachedException.isWriteLimitReached(writeLimitException);
			if (!writeLimitReached) {
				LOGGER.info("Auswertung: Tika hat abgebrochen: {}", writeLimitException.toString());
			}
		} catch (TikaException parseException) {
			LOGGER.info("Auswertung: Tika hat abgebrochen: {}", parseException.toString());
		}

		String text = textHandler.toString();
		return toTikaFileContent(fileMetadata, text);
	}

	/** Die Werte, die in den Kern gehen, aus den Metadaten und dem Text: Typ ohne Parameter, Text, Bildmaße, EXIF-Ausrichtung, Aufnahme, Kamera, GPS. */
	private TikaFileContent toTikaFileContent(Metadata fileMetadata, String text) {
		String contentType = fileMetadata.get(HttpHeaders.CONTENT_TYPE);
		String mimeType = getBaseMimeType(contentType);
		Long imageWidth = readLongValue(fileMetadata, TIFF.IMAGE_WIDTH);
		Long imageHeight = readLongValue(fileMetadata, TIFF.IMAGE_LENGTH);
		Integer exifOrientation = readIntegerValue(fileMetadata, TIFF.ORIENTATION);
		// Aufnahmezeit laut EXIF, sonst die Erstellzeit der Datei (z. B. bei Videos)
		Date capturedAt = fileMetadata.getDate(TIFF.ORIGINAL_DATE);
		if (capturedAt == null) {
			capturedAt = fileMetadata.getDate(TikaCoreProperties.CREATED);
		}
		String cameraModel = fileMetadata.get(TIFF.EQUIPMENT_MODEL);
		Double gpsLatitude = readDoubleValue(fileMetadata, Geographic.LATITUDE);
		Double gpsLongitude = readDoubleValue(fileMetadata, Geographic.LONGITUDE);
		return new TikaFileContent(mimeType, text, imageWidth, imageHeight, exifOrientation, capturedAt, cameraModel,
				gpsLatitude, gpsLongitude);
	}

	/** Ist die Texterkennung in der YAML an ({@code gebiter.tika.ocr-enabled})? */
	public boolean isTextRecognitionEnabled() {
		return ocrEnabled;
	}

	/**
	 * Der Rahmen jedes Lesens, für die Auswertung und den Tika-Test gleich: Texterkennung nur, wenn sie gewünscht und in
	 * der YAML an ist, mit Sprache und Zeitlimit aus der YAML.
	 */
	private ParseContext createParseContext(boolean textRecognitionWanted) {
		ParseContext parseContext = new ParseContext();
		TesseractOCRConfig ocrConfig = new TesseractOCRConfig();
		boolean skipOcr = !ocrEnabled || !textRecognitionWanted;
		ocrConfig.setSkipOcr(skipOcr);
		ocrConfig.setLanguage(ocrLanguage);
		long ocrTimeoutMillis = ocrTimeout.toMillis();
		ocrConfig.setTimeoutMillis(ocrTimeoutMillis);
		parseContext.set(TesseractOCRConfig.class, ocrConfig);
		return parseContext;
	}

	/**
	 * Nur der Typ ohne Parameter, wie beim Upload ({@link #detectMimeType}): Aus {@code text/plain; charset=windows-1252}
	 * wird {@code text/plain}. {@code null}, wenn Tika keinen Typ nennt.
	 */
	private String getBaseMimeType(String contentType) {
		MediaType mediaType = MediaType.parse(contentType);
		if (mediaType == null) {
			return null;
		}
		MediaType baseMediaType = mediaType.getBaseType();
		return baseMediaType.toString();
	}

	/** Eine ganze Zahl aus den Metadaten, {@code null} wenn sie fehlt oder keine Zahl ist (Tika schreibt z. B. „4032 pixels“). */
	private Long readLongValue(Metadata fileMetadata, Property property) {
		String rawValue = fileMetadata.get(property);
		if (rawValue == null) {
			return null;
		}
		String trimmedValue = rawValue.trim();
		String[] words = trimmedValue.split("\\s+");
		String firstWord = words[0];
		try {
			return Long.parseLong(firstWord);
		} catch (NumberFormatException exception) {
			return null;
		}
	}

	private Integer readIntegerValue(Metadata fileMetadata, Property property) {
		Long longValue = readLongValue(fileMetadata, property);
		if (longValue == null) {
			return null;
		}
		return longValue.intValue();
	}

	private Double readDoubleValue(Metadata fileMetadata, Property property) {
		String rawValue = fileMetadata.get(property);
		if (rawValue == null) {
			return null;
		}
		String trimmedValue = rawValue.trim();
		try {
			return Double.parseDouble(trimmedValue);
		} catch (NumberFormatException exception) {
			return null;
		}
	}

	/**
	 * Ein Dokument für die Antwort: Text und Pfad als eigene Felder, damit das Frontend Tikas Schlüssel nicht kennen
	 * muss (Tika 4 nennt sie {@code tk:content} und {@code tk:embedded-resource-path}, Tika 3 noch anders). Alle übrigen
	 * Metadaten unverändert, Schlüssel alphabetisch, jeder mit allen Werten.
	 */
	private TikaProbeDocument toTikaProbeDocument(Metadata documentMetadata) {
		String contentName = TikaCoreProperties.TIKA_CONTENT.getName();
		String content = documentMetadata.get(contentName);
		String embeddedResourcePathName = TikaCoreProperties.EMBEDDED_RESOURCE_PATH.getName();
		String embeddedResourcePath = documentMetadata.get(embeddedResourcePathName);
		String[] names = documentMetadata.names();
		Arrays.sort(names);
		Map<String, List<String>> sortedMetadata = new LinkedHashMap<>();
		for (String name : names) {
			boolean contentEntry = name.equals(contentName);
			if (contentEntry) {
				continue;
			}
			String[] values = documentMetadata.getValues(name);
			List<String> valueList = List.of(values);
			sortedMetadata.put(name, valueList);
		}
		return new TikaProbeDocument(embeddedResourcePath, content, sortedMetadata);
	}
}
