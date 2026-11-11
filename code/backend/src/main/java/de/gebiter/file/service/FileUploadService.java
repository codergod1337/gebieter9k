package de.gebiter.file.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;

import de.gebiter.file.FileAccessDeniedException;
import de.gebiter.file.FileConfig;
import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.FileUploadLimitReachedException;
import de.gebiter.file.dto.FileDocumentExistence;
import de.gebiter.file.dto.FileUploadFacts;
import de.gebiter.file.dto.FileUploadIntoGalleryData;
import de.gebiter.file.dto.FileUploadIntoShopCategoryData;
import de.gebiter.file.dto.FileUploadResult;
import de.gebiter.file.model.FileClassDestination;
import de.gebiter.file.model.FileUploadStatus;
import de.gebiter.gallery.service.GalleryService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.sftp.service.SftpPathService;
import de.gebiter.shop.service.ShopCategoryService;
import de.gebiter.shop.service.ShopItemService;
import de.gebiter.solr.service.SolrDocumentFieldService;
import de.gebiter.status.model.Visibility;
import de.gebiter.tika.service.TikaService;
import de.gebiter.users.service.UsersDetailService;
import de.gebiter.users.service.UsersPointBookingService;
import de.gebiter.util.Helper;
import de.gebiter.util.MultipartStreamReader;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * Der Upload in den File-Kern, so schnell wie möglich (Vorgabe des Nutzers 2026-11-08): Die Datei soll zügig auf der
 * Platte des Backends liegen, der Hash gleich danach feststehen, eine Dublette sofort verworfen werden. Alles Weitere
 * (SFTP, Tika, Vorschau) macht danach EIN Thread im Hintergrund ({@link FileAnalysisService}).
 * <p>
 * Ein Request, ein Durchgang: Der Body ist {@code multipart/form-data} mit zuerst {@code data} (JSON mit den Feldern),
 * dann {@code file}. Weil die Felder zuerst kommen, ist alles geprüft (FileClass, Rechte, Endung, Größe, Platz), bevor
 * das erste Byte der Datei angenommen wird. Die Bytes laufen dann einmal vom Netz in den Upload-Puffer
 * ({@link FileStagingService}), SHA-256 und Größe rechnen dabei mit. Am Ende des Uploads steht der Hash also schon fest.
 * <p>
 * Rollback: Scheitert irgendetwas vor dem Einchecken (Abbruch im Browser, Prüfung, Dublette), ist die Teil-Datei
 * sofort wieder weg und in Solr steht nichts. Scheitert Solr beim Einchecken, verschwindet auch die fertige Datei aus
 * dem Puffer. Reste nach einem Absturz räumt der Start-Runner weg.
 * <p>
 * Wer hochladen darf, hängt an zwei Dingen (Übersicht: {@code docu/konzept-file-kern.md}, „Upload-Wege“):
 * <ul>
 * <li>an der FileClass: Der User braucht ein Recht, das sie hochladen darf (Schalter „Hochladen“), auf jedem Weg;</li>
 * <li>am Weg: Jeder Upload-Weg ist eine eigene Methode mit eigenem Endpunkt. Ein Weg mit Ziel (die Galerie,
 * {@link #uploadFileIntoGallery}) nimmt nur FileClasses, die der Admin an diesem Ziel anbietet. Der Weg in eine Rubrik
 * des Gebietermarkts ({@link #uploadFileIntoShopCategory}) hat keine Wahl: Die FileClass ist die der Rubrik. Der Weg
 * ohne Ziel ({@link #uploadFile}) nimmt jede FileClass und ist deshalb nur für FILE_MANAGER und ADMIN.</li>
 * </ul>
 * Alle Wege laufen durch denselben Kern ({@code doUploadFromMultipart}). Normale User haben höchstens
 * {@code gebiter.file.max-files-per-users} aktive Dateien; für ADMIN und FILE_MANAGER gilt die Grenze nicht.
 */
@Service
public class FileUploadService {

	private static final Logger LOGGER = LoggerFactory.getLogger(FileUploadService.class);

	private final FileConfig fileConfig;
	private final FileSolrFieldNames fileSolrFieldNames;
	private final FileClassService fileClassService;
	private final FileClassAccessRoleService fileClassAccessRoleService;
	private final FileClassFileExtensionService fileClassFileExtensionService;
	private final FileDocumentResolveService fileDocumentResolveService;
	private final FileDocumentWriteService fileDocumentWriteService;
	private final FileDocumentAccessService fileDocumentAccessService;
	private final FileAnalysisService fileAnalysisService;
	private final FileStagingService fileStagingService;
	private final SolrDocumentFieldService solrDocumentFieldService;
	private final TikaService tikaService;
	private final SftpPathService sftpPathService;
	private final UsersDetailService usersDetailService;
	private final CurrentUsersProvider currentUsersProvider;
	private final ObjectMapper objectMapper;
	private final FileClassDestinationAssignmentService fileClassDestinationAssignmentService;
	private final GalleryService galleryService;

	private final UsersPointBookingService usersPointBookingService;
	private final ShopCategoryService shopCategoryService;
	private final ShopItemService shopItemService;

	/** Die Tätigkeit „Bild in eine Galerie hochgeladen“ ({@code gebiter.point-activity.gallery-upload.key}). */
	private final String galleryUploadPointActivityKey;

	/** Hashes, die gerade eingecheckt werden: Dieselbe Datei zweimal gleichzeitig ergibt beim zweiten Mal EXISTS. */
	private final Set<String> sha256HexesInUpload = ConcurrentHashMap.newKeySet();

	/** Laufende Uploads je User, die zur Grenze zählen, solange ihr Dokument noch nicht in Solr steht. */
	private final Map<UUID, Integer> runningUploadCountByUsersGuid = new ConcurrentHashMap<>();

	public FileUploadService(FileConfig fileConfig, FileSolrFieldNames fileSolrFieldNames,
			FileClassService fileClassService, FileClassAccessRoleService fileClassAccessRoleService,
			FileClassFileExtensionService fileClassFileExtensionService,
			FileDocumentResolveService fileDocumentResolveService, FileDocumentWriteService fileDocumentWriteService,
			FileDocumentAccessService fileDocumentAccessService, FileAnalysisService fileAnalysisService,
			FileStagingService fileStagingService, SolrDocumentFieldService solrDocumentFieldService,
			TikaService tikaService, SftpPathService sftpPathService, UsersDetailService usersDetailService,
			CurrentUsersProvider currentUsersProvider, ObjectMapper objectMapper,
			FileClassDestinationAssignmentService fileClassDestinationAssignmentService, GalleryService galleryService,
			UsersPointBookingService usersPointBookingService,
			ShopCategoryService shopCategoryService, ShopItemService shopItemService,
			@Value("${gebiter.point-activity.gallery-upload.key}") String galleryUploadPointActivityKey) {
		this.usersPointBookingService = usersPointBookingService;
		this.shopCategoryService = shopCategoryService;
		this.shopItemService = shopItemService;
		this.galleryUploadPointActivityKey = galleryUploadPointActivityKey;
		this.fileConfig = fileConfig;
		this.fileSolrFieldNames = fileSolrFieldNames;
		this.fileClassService = fileClassService;
		this.fileClassAccessRoleService = fileClassAccessRoleService;
		this.fileClassFileExtensionService = fileClassFileExtensionService;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.fileDocumentWriteService = fileDocumentWriteService;
		this.fileDocumentAccessService = fileDocumentAccessService;
		this.fileAnalysisService = fileAnalysisService;
		this.fileStagingService = fileStagingService;
		this.solrDocumentFieldService = solrDocumentFieldService;
		this.tikaService = tikaService;
		this.sftpPathService = sftpPathService;
		this.usersDetailService = usersDetailService;
		this.currentUsersProvider = currentUsersProvider;
		this.objectMapper = objectMapper;
		this.fileClassDestinationAssignmentService = fileClassDestinationAssignmentService;
		this.galleryService = galleryService;
	}

	/**
	 * CREATE: Lädt eine Datei hoch, ohne Ziel: der Upload-Weg des File-Managers, nur für FILE_MANAGER und ADMIN (seit
	 * 2026-11-11). Er nimmt jede FileClass, die der User hochladen darf. Ein normaler User lädt nur über ein
	 * Ziel hoch ({@link #uploadFileIntoGallery}); sonst ginge er an der Liste vorbei, welche FileClass an welchem Ziel
	 * angeboten wird. Beispiel: An DOKUMENT darf die Rolle USER schreiben, angeboten wird DOKUMENT an keinem Ziel; ein
	 * normaler User kann also kein Word-Dokument hochladen, der File-Manager schon.
	 * <p>
	 * Antwort CREATED mit dem Dokument, sobald die Datei im Puffer liegt und eingecheckt ist, oder EXISTS, wenn es
	 * dieselben Bytes schon gibt (mit Dokument, wenn der User es lesen darf).
	 *
	 * @param requestBody der Body des Requests, {@code multipart/form-data}: erst {@code data}, dann {@code file}
	 * @param contentType der Content-Type des Requests samt boundary
	 * @param requestContentLength die Länge des Bodys laut Browser, -1 wenn unbekannt
	 * @throws IllegalArgumentException (400) bei falscher Form, falschen Feldwerten, zu großer oder leerer Datei, nicht
	 *             freigeschalteter Endung
	 * @throws FileAccessDeniedException (403) wenn der User weder FILE_MANAGER noch ADMIN ist oder ihm die Schreibrolle
	 *             an der FileClass fehlt
	 * @throws FileUploadLimitReachedException (409) wenn ein normaler User seine Grenze erreicht hat
	 * @throws de.gebiter.file.FileStagingFullException (503) wenn der Upload-Puffer zu voll ist
	 */
	@PreAuthorize("hasAnyRole('ADMIN', 'FILE_MANAGER')")
	public FileUploadResult uploadFile(InputStream requestBody, String contentType, long requestContentLength) {
		fileDocumentAccessService.requireCurrentUsersFileManagerOrAdmin();
		// 1. Form: erst das JSON mit den Feldern, dann die Datei mit Namen und Endung
		MultipartStreamReader multipartReader = openMultipartReader(requestBody, contentType);
		Map<String, Object> rawClientFieldValues = readDataPart(multipartReader);
		Map<String, Object> noBackendFieldValues = Map.of();
		return doUploadFromMultipart(multipartReader, rawClientFieldValues, requestContentLength, null,
				noBackendFieldValues, null);
	}

	/**
	 * CREATE: Lädt eine Datei in eine eigene Galerie hoch (Konzept {@code docu/konzept-galerie.md}), sonst wie
	 * {@link #uploadFile}. Der Teil {@code data} ist ein {@link FileUploadIntoGalleryData}: die Galerie und die Felder des
	 * Clients. Zusätzlich gilt:
	 * - Die Galerie gehört dem User ({@code GalleryService}).
	 * - Die FileClass wird am Ziel {@link FileClassDestination#GALLERY} angeboten.
	 * - Das Dokument bekommt die Galerie, ihre Sichtbarkeit und den Platz am Ende der Galerie.
	 *
	 * @throws jakarta.persistence.EntityNotFoundException (404) wenn die Galerie nicht dem User gehört
	 * @throws IllegalArgumentException (400) wie beim normalen Upload, dazu ohne Galerie oder mit einer FileClass, die
	 *             nicht für Galerien angeboten wird
	 */
	public FileUploadResult uploadFileIntoGallery(InputStream requestBody, String contentType, long requestContentLength) {
		MultipartStreamReader multipartReader = openMultipartReader(requestBody, contentType);
		Map<String, Object> rawData = readDataPart(multipartReader);
		FileUploadIntoGalleryData galleryData = objectMapper.convertValue(rawData, FileUploadIntoGalleryData.class);
		Long galleryId = galleryData.galleryId();
		Helper.requireNotNull(galleryId, "galleryId");
		Map<String, Object> galleryFieldValues = galleryService.prepareOwnGalleryUpload(galleryId);
		Map<String, Object> rawClientFieldValues = galleryData.fieldValuesByFieldName();
		if (rawClientFieldValues == null) {
			rawClientFieldValues = Map.of();
		}
		return doUploadFromMultipart(multipartReader, rawClientFieldValues, requestContentLength,
				FileClassDestination.GALLERY, galleryFieldValues, null);
	}

	/**
	 * CREATE: Lädt eine Datei in eine Rubrik des Gebietermarkts hoch (Nutzer 2026-11-11, Konzept
	 * {@code docu/konzept-shop.md}, Abschnitt 11), sonst wie {@link #uploadFile}. Der Teil {@code data} ist ein
	 * {@link FileUploadIntoShopCategoryData}: die Rubrik und die Felder des Clients. Zusätzlich gilt:
	 * - Die Rubrik gibt es ({@code ShopItemService}).
	 * - Die FileClass wählt niemand: Es ist immer die der Rubrik ({@code ShopCategory.fileClassKey}, Nutzer 2026-11-11).
	 *   Schickt der Client trotzdem eine, zählt sie nicht. Der User braucht wie überall das Recht, sie hochzuladen.
	 * - Das Dokument ist für jeden angemeldeten User sichtbar, sonst sähe im Markt niemand, was er kauft.
	 * - Nach dem Einchecken entsteht der Artikel ({@code ShopItem}) in der Rubrik, Verkäufer ist der Uploader. Das
	 *   Angebot dazu legt er danach in einem eigenen Schritt an ({@code POST /api/shop-offer}); so sieht er erst, dass
	 *   die Datei oben ist (Nutzer 2026-11-11).
	 * Gibt es dieselben Bytes schon (EXISTS), entsteht kein Artikel.
	 *
	 * @throws jakarta.persistence.EntityNotFoundException (404) wenn es die Rubrik nicht gibt
	 * @throws IllegalArgumentException (400) wie beim normalen Upload, dazu ohne Rubrik
	 * @throws FileAccessDeniedException (403) wenn der User die FileClass der Rubrik nicht hochladen darf
	 */
	public FileUploadResult uploadFileIntoShopCategory(InputStream requestBody, String contentType,
			long requestContentLength) {
		MultipartStreamReader multipartReader = openMultipartReader(requestBody, contentType);
		Map<String, Object> rawData = readDataPart(multipartReader);
		FileUploadIntoShopCategoryData shopCategoryData = objectMapper.convertValue(rawData,
				FileUploadIntoShopCategoryData.class);
		String shopCategoryKey = shopCategoryData.shopCategoryKey();
		Helper.requireNotNull(shopCategoryKey, "shopCategoryKey");
		Map<String, Object> shopFieldValues = shopItemService.prepareShopCategoryUpload(shopCategoryKey);
		Map<String, Object> rawClientFieldValues = new LinkedHashMap<>();
		Map<String, Object> sentClientFieldValues = shopCategoryData.fieldValuesByFieldName();
		if (sentClientFieldValues != null) {
			rawClientFieldValues.putAll(sentClientFieldValues);
		}
		// Die FileClass steht durch die Rubrik fest: Sie kommt hier fest hinein, eine vom Client geschickte fällt weg.
		String fileClassKeyOfShopCategory = shopCategoryService.getFileClassKeyOfShopCategory(shopCategoryKey);
		String fileClassKeyFieldName = fileSolrFieldNames.fileClassKey();
		rawClientFieldValues.put(fileClassKeyFieldName, fileClassKeyOfShopCategory);
		return doUploadFromMultipart(multipartReader, rawClientFieldValues, requestContentLength, null, shopFieldValues,
				shopCategoryKey);
	}

	/** Öffnet den Multipart-Body zum Lesen, Teil für Teil. */
	private MultipartStreamReader openMultipartReader(InputStream requestBody, String contentType) {
		String boundary = MultipartStreamReader.extractBoundary(contentType);
		long uploadBufferBytes = fileConfig.uploadBufferSize().toBytes();
		int uploadBufferLength = (int) uploadBufferBytes;
		return new MultipartStreamReader(requestBody, boundary, uploadBufferLength);
	}

	/**
	 * Der Kern aller Upload-Wege, nachdem der Teil {@code data} gelesen ist: Datei-Teil, Größe, Felder, FileClass (am
	 * Ziel {@code destination}, wenn eins genannt ist), Endung, Grenze, dann die Bytes. Mit {@code shopCategoryKey}
	 * entsteht nach dem Einchecken der Artikel in dieser Rubrik; ihre FileClass hat der Aufrufer schon in die Felder
	 * gesetzt.
	 */
	private FileUploadResult doUploadFromMultipart(MultipartStreamReader multipartReader,
			Map<String, Object> rawClientFieldValues, long requestContentLength, FileClassDestination destination,
			Map<String, Object> backendFieldValues, String shopCategoryKey) {
		String originalFileName = readFilePartFileName(multipartReader);
		String fileExtension = getFileExtension(originalFileName);
		String browserMimeType = multipartReader.getPartContentType();

		// 2. Größe laut Browser: nicht über der Grenze, bevor auch nur ein Byte der Datei angenommen wird
		long uploadMaxFileSizeBytes = fileConfig.uploadMaxFileSize().toBytes();
		requireUploadSizeAllowed(requestContentLength, uploadMaxFileSizeBytes);

		// 3. Felder des Clients: nur die mit „vom Client“, geprüft nach Typ (400 mit allen Beanstandungen)
		String solrCoreKey = fileConfig.solrCoreKey();
		Map<String, Object> convertedClientFieldValues = solrDocumentFieldService.convertClientFieldValues(solrCoreKey,
				rawClientFieldValues);
		// Wie beim Ändern: Referenz-Felder nur File-Manager und Admin, Tags einheitlich ohne Raute
		Map<String, Object> clientFieldValues = fileDocumentWriteService.prepareClientFieldValues(convertedClientFieldValues);

		// 4. FileClass: Pflicht, muss es geben, der User braucht eines der Rechte, die sie hochladen dürfen
		String fileClassKey = getRequiredFileClassKey(clientFieldValues);
		List<String> uploaderAccessRoleKeys = fileClassAccessRoleService
				.getUploaderAccessRoleKeysByFileClassKey(fileClassKey);
		requireCurrentUsersHasOneOf(uploaderAccessRoleKeys, fileClassKey);
		// Bis die Regel fürs Bearbeiten steht (Nutzer 2026-11-11), bleiben die Schreibrollen im Dokument die Rechte, die
		// hochladen dürfen: Der Autor ändert und löscht seine eigene Datei damit wie bisher.
		List<String> writerAccessRoleKeys = uploaderAccessRoleKeys;
		// am Ziel des Upload-Wegs (z. B. Galerie) nur FileClasses, die der Admin dort anbietet
		if (destination != null) {
			boolean offeredAtDestination = fileClassDestinationAssignmentService
					.existsFileClassDestinationAssignment(fileClassKey, destination);
			if (!offeredAtDestination) {
				throw new IllegalArgumentException(
						"Die FileClass " + fileClassKey + " wird hier nicht angeboten (Ziel " + destination + ").");
			}
		}

		// 5. Endung: muss für die FileClass freigeschaltet sein
		boolean fileExtensionEnabled = fileClassFileExtensionService.existsFileClassFileExtension(fileClassKey,
				fileExtension);
		if (!fileExtensionEnabled) {
			throw new IllegalArgumentException(
					"Die Endung " + fileExtension + " ist für die FileClass " + fileClassKey + " nicht freigeschaltet.");
		}

		// 6. Grenze je User: nur für normale User, ADMIN und FILE_MANAGER laden ohne Grenze
		UUID authorUsersGuid = currentUsersProvider.currentUsersGuid();
		boolean fileManagerOrAdmin = fileDocumentAccessService.isCurrentUsersFileManagerOrAdmin();
		boolean uploadLimitApplies = !fileManagerOrAdmin;
		if (uploadLimitApplies) {
			reserveUploadSlot(authorUsersGuid);
		}
		try {
			InputStream fileContent = multipartReader.getPartContent();
			FileUploadFacts fileUploadFacts = new FileUploadFacts(originalFileName, fileExtension, browserMimeType,
					fileClassKey, writerAccessRoleKeys, clientFieldValues, authorUsersGuid, backendFieldValues,
					destination, shopCategoryKey);
			return doUploadFile(fileContent, requestContentLength, uploadMaxFileSizeBytes, fileUploadFacts);
		} finally {
			if (uploadLimitApplies) {
				releaseUploadSlot(authorUsersGuid);
			}
		}
	}

	/** READ: Gibt es diese Bytes schon, und wenn der User sie lesen darf, das Dokument. Für die Vorprüfung im Browser. */
	public FileDocumentExistence getFileDocumentExistence(String sha256Hex) {
		String normalizedSha256Hex = Helper.requireSha256Hex(sha256Hex);
		boolean exists = fileDocumentResolveService.existsFileDocument(normalizedSha256Hex);
		if (!exists) {
			return new FileDocumentExistence(false, null);
		}
		Map<String, Object> readableDocument = fileDocumentResolveService.resolveFileDocumentById(normalizedSha256Hex);
		return new FileDocumentExistence(true, readableDocument);
	}

	/** Die Schritte 7 bis 10, nach allen Prüfungen: Platz reservieren, Bytes in den Puffer, Dublette, Einchecken. */
	private FileUploadResult doUploadFile(InputStream fileContent, long requestContentLength,
			long uploadMaxFileSizeBytes, FileUploadFacts fileUploadFacts) {
		// 7. Platz im Puffer: so viel, wie der Browser angekündigt hat (sonst die Höchstgröße)
		long reservedBytes = uploadMaxFileSizeBytes;
		if (requestContentLength > 0) {
			reservedBytes = requestContentLength;
		}
		Path partFile = fileStagingService.createPartFile(reservedBytes);
		boolean partFileMoved = false;
		try {
			// 8. Ein Durchgang: Bytes vom Netz in den Puffer, SHA-256 und Größe rechnen mit
			MessageDigest sha256Digest = createSha256Digest();
			long fileSizeBytes = writeFileContentIntoPartFile(fileContent, partFile, sha256Digest,
					uploadMaxFileSizeBytes);
			if (fileSizeBytes == 0) {
				throw new IllegalArgumentException("Die Datei ist leer.");
			}
			byte[] sha256Bytes = sha256Digest.digest();
			HexFormat lowerCaseHexFormat = HexFormat.of();
			String sha256Hex = lowerCaseHexFormat.formatHex(sha256Bytes);
			String originalFileName = fileUploadFacts.originalFileName();
			String browserMimeType = fileUploadFacts.browserMimeType();
			String mimeType = detectMimeType(partFile, originalFileName, browserMimeType);

			// 9. Dublette: dieselben Bytes gibt es schon oder sie werden gerade eingecheckt; kein Merge
			boolean sha256HexReserved = sha256HexesInUpload.add(sha256Hex);
			if (!sha256HexReserved) {
				return createExistsResult(sha256Hex);
			}
			try {
				boolean alreadyExists = fileDocumentResolveService.existsFileDocument(sha256Hex);
				if (alreadyExists) {
					return createExistsResult(sha256Hex);
				}
				// 10. Einchecken: Datei heißt jetzt wie ihr Hash, Dokument nach Solr
				fileStagingService.moveToStagedFile(partFile, sha256Hex);
				partFileMoved = true;
				return doCheckInFile(fileUploadFacts, sha256Hex, fileSizeBytes, mimeType);
			} finally {
				sha256HexesInUpload.remove(sha256Hex);
			}
		} finally {
			if (!partFileMoved) {
				fileStagingService.deletePartFile(partFile);
			}
			fileStagingService.releaseReservation(reservedBytes);
		}
	}

	/**
	 * Die Bytes der Datei vom Netz in die Teil-Datei, Hash und Größe nebenbei. Bricht ab, sobald die Datei größer wird als
	 * erlaubt (der Content-Length des Browsers allein ist kein Beweis).
	 *
	 * @return die Größe in Bytes
	 */
	private long writeFileContentIntoPartFile(InputStream fileContent, Path partFile, MessageDigest sha256Digest,
			long uploadMaxFileSizeBytes) {
		long uploadBufferBytes = fileConfig.uploadBufferSize().toBytes();
		byte[] copyBuffer = new byte[(int) uploadBufferBytes];
		long writtenBytes = 0;
		try (OutputStream partFileData = Files.newOutputStream(partFile)) {
			int readCount = fileContent.read(copyBuffer);
			while (readCount >= 0) {
				writtenBytes = writtenBytes + readCount;
				if (writtenBytes > uploadMaxFileSizeBytes) {
					DataSize uploadMaxFileSize = fileConfig.uploadMaxFileSize();
					throw new IllegalArgumentException("Die Datei ist größer als " + uploadMaxFileSize + ".");
				}
				sha256Digest.update(copyBuffer, 0, readCount);
				partFileData.write(copyBuffer, 0, readCount);
				readCount = fileContent.read(copyBuffer);
			}
		} catch (IOException exception) {
			throw new UncheckedIOException("Der Upload ist abgebrochen.", exception);
		}
		return writtenBytes;
	}

	/** Schritt 10: das Dokument nach Solr, danach der Hintergrund-Thread. Scheitert Solr, verschwindet die Datei wieder. */
	private FileUploadResult doCheckInFile(FileUploadFacts fileUploadFacts, String sha256Hex, long fileSizeBytes,
			String mimeType) {
		// Der Platz auf dem SFTP steht schon fest, die Bytes bringt der Hintergrund-Thread hin
		String sftpPath = sftpPathService.createRelativePath(sha256Hex);
		String fileClassKey = fileUploadFacts.fileClassKey();
		String originalFileName = fileUploadFacts.originalFileName();
		UUID authorUsersGuid = fileUploadFacts.authorUsersGuid();

		// Dokument: die geprüften Werte des Clients, darüber die Felder des Backends, die immer gewinnen
		List<String> readerAccessRoleKeys = fileClassAccessRoleService.getReaderAccessRoleKeysByFileClassKey(fileClassKey);
		Map<String, Object> clientFieldValues = fileUploadFacts.clientFieldValues();
		Map<String, Object> fileDocumentFieldValues = new LinkedHashMap<>(clientFieldValues);
		// Beim Upload ist der Name immer der der hochgeladenen Datei, nie ein Wert aus dem Body; ändern lässt er sich danach
		// beim Bearbeiten (mit Schreibrecht an der FileClass)
		String fileNameFieldName = fileSolrFieldNames.fileName();
		fileDocumentFieldValues.put(fileNameFieldName, originalFileName);
		Date now = new Date();
		String authorUsersGuidText = authorUsersGuid.toString();
		String activeStatus = fileConfig.statusActive();
		long zeroCheerCount = 0L;
		String idFieldName = fileSolrFieldNames.id();
		String sftpPathFieldName = fileSolrFieldNames.sftpPath();
		String authorUsersGuidFieldName = fileSolrFieldNames.authorUsersGuid();
		String fileClassKeyFieldName = fileSolrFieldNames.fileClassKey();
		String readerAccessRoleKeysFieldName = fileSolrFieldNames.readerAccessRoleKeys();
		String writerAccessRoleKeysFieldName = fileSolrFieldNames.writerAccessRoleKeys();
		String statusFieldName = fileSolrFieldNames.status();
		String visibilityFieldName = fileSolrFieldNames.visibility();
		Visibility defaultVisibility = fileConfig.defaultVisibility();
		String defaultVisibilityName = defaultVisibility.name();
		String fileExtensionFieldName = fileSolrFieldNames.fileExtension();
		String fileSizeBytesFieldName = fileSolrFieldNames.fileSizeBytes();
		String uploadedAtFieldName = fileSolrFieldNames.uploadedAt();
		String lastChangedAtFieldName = fileSolrFieldNames.lastChangedAt();
		String cheerUpCountFieldName = fileSolrFieldNames.cheerUpCount();
		String cheerDownCountFieldName = fileSolrFieldNames.cheerDownCount();
		String mimeTypeFieldName = fileSolrFieldNames.mimeType();
		String analysisStatusFieldName = fileSolrFieldNames.analysisStatus();
		String pendingAnalysisStatus = fileConfig.analysisStatusPending();
		List<String> writerAccessRoleKeys = fileUploadFacts.writerAccessRoleKeys();
		String fileExtension = fileUploadFacts.fileExtension();
		fileDocumentFieldValues.put(idFieldName, sha256Hex);
		fileDocumentFieldValues.put(sftpPathFieldName, sftpPath);
		fileDocumentFieldValues.put(authorUsersGuidFieldName, authorUsersGuidText);
		fileDocumentFieldValues.put(fileClassKeyFieldName, fileClassKey);
		fileDocumentFieldValues.put(readerAccessRoleKeysFieldName, readerAccessRoleKeys);
		fileDocumentFieldValues.put(writerAccessRoleKeysFieldName, writerAccessRoleKeys);
		fileDocumentFieldValues.put(statusFieldName, activeStatus);
		// Bis die Datei in eine Galerie kommt, sieht sie nur der Autor (dazu ADMIN und FILE_MANAGER)
		fileDocumentFieldValues.put(visibilityFieldName, defaultVisibilityName);
		fileDocumentFieldValues.put(fileExtensionFieldName, fileExtension);
		fileDocumentFieldValues.put(fileSizeBytesFieldName, fileSizeBytes);
		fileDocumentFieldValues.put(uploadedAtFieldName, now);
		fileDocumentFieldValues.put(lastChangedAtFieldName, now);
		fileDocumentFieldValues.put(cheerUpCountFieldName, zeroCheerCount);
		fileDocumentFieldValues.put(cheerDownCountFieldName, zeroCheerCount);
		putIfPresent(fileDocumentFieldValues, mimeTypeFieldName, mimeType);
		// SFTP, Tika, EXIF und Vorschau stehen noch aus, der Hintergrund-Thread setzt danach DONE
		fileDocumentFieldValues.put(analysisStatusFieldName, pendingAnalysisStatus);
		// zuletzt die Felder des Upload-Wegs, z. B. Galerie und ihre Sichtbarkeit: Sie gewinnen über die Vorgaben
		Map<String, Object> backendFieldValues = fileUploadFacts.backendFieldValues();
		fileDocumentFieldValues.putAll(backendFieldValues);

		try {
			fileDocumentWriteService.createFileDocumentFromUpload(fileDocumentFieldValues);
		} catch (DuplicateKeyException duplicateKeyException) {
			// Ein anderes Backend (z. B. Pi und Mac auf demselben Solr) war schneller: Seine Datei gilt, unsere fällt weg.
			fileStagingService.deleteStagedFile(sha256Hex);
			return createExistsResult(sha256Hex);
		} catch (RuntimeException solrException) {
			// Rollback: kein Dokument, also auch keine Datei im Puffer
			fileStagingService.deleteStagedFile(sha256Hex);
			throw solrException;
		}

		// Zähler des Uploaders, erst jetzt: Datei im Puffer und Dokument in Solr sind gespeichert. Dann den
		// Hintergrund-Thread anstoßen; der Upload ist damit fertig und antwortet sofort.
		increaseUploadCountOfAuthor(authorUsersGuid);
		FileClassDestination destination = fileUploadFacts.destination();
		if (destination == FileClassDestination.GALLERY) {
			createGalleryUploadPointBooking(authorUsersGuid, sha256Hex);
		}
		// In eine Rubrik des Gebietermarkts hochgeladen: Jetzt entsteht dort der Artikel. Scheitert das, bleibt die Datei
		// als gewöhnliche Datei des Uploaders stehen (kein Artikel), und der Upload meldet den Fehler.
		String shopCategoryKey = fileUploadFacts.shopCategoryKey();
		if (shopCategoryKey != null) {
			shopItemService.createShopItemOfUploadedFile(sha256Hex, shopCategoryKey);
		}
		fileAnalysisService.enqueueFileDocumentAnalysis(sha256Hex);
		LOGGER.info("Upload: {} als {} ({} Bytes, FileClass {}) von {}", originalFileName, sha256Hex, fileSizeBytes,
				fileClassKey, authorUsersGuid);
		Map<String, Object> readableDocument = fileDocumentResolveService.resolveFileDocumentById(sha256Hex);
		return new FileUploadResult(FileUploadStatus.CREATED, sha256Hex, readableDocument);
	}

	/** Teil 1 des Bodys: {@code data}, das JSON mit den Feldern, höchstens {@code gebiter.file.upload-max-data-size}. */
	private Map<String, Object> readDataPart(MultipartStreamReader multipartReader) {
		String dataJson;
		try {
			boolean hasPart = multipartReader.nextPart();
			String partName = multipartReader.getPartName();
			if (!hasPart || !"data".equals(partName)) {
				throw new IllegalArgumentException("Der Upload muss mit dem Teil data (JSON mit den Feldern) beginnen.");
			}
			long uploadMaxDataBytes = fileConfig.uploadMaxDataSize().toBytes();
			int readLimit = (int) uploadMaxDataBytes + 1;
			InputStream dataContent = multipartReader.getPartContent();
			byte[] dataBytes = dataContent.readNBytes(readLimit);
			if (dataBytes.length > uploadMaxDataBytes) {
				throw new IllegalArgumentException("Der Teil data ist zu groß.");
			}
			dataJson = new String(dataBytes, StandardCharsets.UTF_8);
		} catch (IOException exception) {
			throw new UncheckedIOException("Der Upload ist abgebrochen.", exception);
		}
		if (dataJson.isBlank()) {
			return Map.of();
		}
		TypeReference<Map<String, Object>> fieldValuesType = new TypeReference<>() {
		};
		try {
			Map<String, Object> clientFieldValues = objectMapper.readValue(dataJson, fieldValuesType);
			if (clientFieldValues == null) {
				return Map.of();
			}
			return clientFieldValues;
		} catch (JacksonException exception) {
			throw new IllegalArgumentException("data ist kein JSON-Objekt.");
		}
	}

	/** Teil 2 des Bodys: {@code file}. Liest nur seine Kopfzeilen; der Dateiname ohne Pfad (manche Browser schicken ihn mit). */
	private static String readFilePartFileName(MultipartStreamReader multipartReader) {
		try {
			boolean hasPart = multipartReader.nextPart();
			String partName = multipartReader.getPartName();
			if (!hasPart || !"file".equals(partName)) {
				throw new IllegalArgumentException("Nach data muss der Teil file mit der Datei kommen.");
			}
		} catch (IOException exception) {
			throw new UncheckedIOException("Der Upload ist abgebrochen.", exception);
		}
		String rawFileName = multipartReader.getPartFileName();
		if (rawFileName == null || rawFileName.isBlank()) {
			throw new IllegalArgumentException("Die Datei hat keinen Namen.");
		}
		int lastSlashIndex = rawFileName.lastIndexOf('/');
		int lastBackslashIndex = rawFileName.lastIndexOf('\\');
		int lastSeparatorIndex = Math.max(lastSlashIndex, lastBackslashIndex);
		String fileNameWithoutPath = rawFileName.substring(lastSeparatorIndex + 1);
		return fileNameWithoutPath.trim();
	}

	/** Ist der Body laut Browser größer als die größte erlaubte Datei (plus Platz für data und Grenzen)? Dann gleich 400. */
	private void requireUploadSizeAllowed(long requestContentLength, long uploadMaxFileSizeBytes) {
		long uploadMaxDataBytes = fileConfig.uploadMaxDataSize().toBytes();
		long uploadMaxRequestBytes = uploadMaxFileSizeBytes + uploadMaxDataBytes;
		if (requestContentLength > uploadMaxRequestBytes) {
			DataSize uploadMaxFileSize = fileConfig.uploadMaxFileSize();
			throw new IllegalArgumentException("Die Datei ist größer als " + uploadMaxFileSize + ".");
		}
	}

	/**
	 * Der Typ aus den ersten Bytes (Tika, ohne zu parsen, Millisekunden), sonst der, den der Browser genannt hat. Die
	 * Auswertung im Hintergrund setzt ihn danach noch genauer.
	 */
	private String detectMimeType(Path partFile, String originalFileName, String browserMimeType) {
		try (InputStream partFileData = Files.newInputStream(partFile)) {
			String detectedMimeType = tikaService.detectMimeType(partFileData, originalFileName);
			if (detectedMimeType == null) {
				return browserMimeType;
			}
			return detectedMimeType;
		} catch (IOException exception) {
			LOGGER.info("Upload: Typ nicht erkannt: {}", exception.toString());
			return browserMimeType;
		}
	}

	private static void putIfPresent(Map<String, Object> fieldValues, String fieldName, Object fieldValue) {
		if (fieldValue != null) {
			fieldValues.put(fieldName, fieldValue);
		}
	}

	/** EXISTS: nichts gespeichert; das Dokument nur, wenn der User es lesen darf. */
	private FileUploadResult createExistsResult(String sha256Hex) {
		Map<String, Object> readableDocument = fileDocumentResolveService.resolveFileDocumentById(sha256Hex);
		return new FileUploadResult(FileUploadStatus.EXISTS, sha256Hex, readableDocument);
	}

	/** Die Endung nach dem letzten Punkt, klein, nach der Endungs-Regel. */
	private static String getFileExtension(String fileName) {
		int lastDotIndex = fileName.lastIndexOf('.');
		if (lastDotIndex < 0) {
			throw new IllegalArgumentException("Der Dateiname " + fileName + " hat keine Endung.");
		}
		String rawFileExtension = fileName.substring(lastDotIndex + 1);
		String lowerCaseFileExtension = rawFileExtension.toLowerCase(Locale.ROOT);
		return Helper.requireValidFileExtension(lowerCaseFileExtension);
	}

	private String getRequiredFileClassKey(Map<String, Object> clientFieldValues) {
		String fileClassKeyFieldName = fileSolrFieldNames.fileClassKey();
		Object rawFileClassKey = clientFieldValues.get(fileClassKeyFieldName);
		if (!(rawFileClassKey instanceof String fileClassKey)) {
			throw new IllegalArgumentException(fileClassKeyFieldName + " fehlt: Jede Datei braucht eine FileClass.");
		}
		Helper.requireValidKey(fileClassKey);
		boolean fileClassExists = fileClassService.existsFileClass(fileClassKey);
		if (!fileClassExists) {
			throw new IllegalArgumentException("Die FileClass " + fileClassKey + " gibt es nicht.");
		}
		return fileClassKey;
	}

	private void requireCurrentUsersHasOneOf(List<String> uploaderAccessRoleKeys, String fileClassKey) {
		for (String uploaderAccessRoleKey : uploaderAccessRoleKeys) {
			if (currentUsersProvider.currentUsersHasAccessRole(uploaderAccessRoleKey)) {
				return;
			}
		}
		throw new FileAccessDeniedException("In die FileClass " + fileClassKey + " darfst du nicht hochladen.");
	}

	/**
	 * Reserviert einen Platz für einen laufenden Upload: aktive Dateien in Solr plus laufende Uploads müssen unter der
	 * Grenze bleiben. Synchronisiert, damit zwei gleichzeitige Uploads nicht beide durch die letzte Lücke schlüpfen.
	 */
	private void reserveUploadSlot(UUID authorUsersGuid) {
		long activeFileCount = fileDocumentResolveService.countActiveFileDocumentsOfAuthor(authorUsersGuid);
		int maxFilesPerUsers = fileConfig.maxFilesPerUsers();
		synchronized (runningUploadCountByUsersGuid) {
			int runningUploadCount = runningUploadCountByUsersGuid.getOrDefault(authorUsersGuid, 0);
			long usedSlotCount = activeFileCount + runningUploadCount;
			if (usedSlotCount >= maxFilesPerUsers) {
				throw new FileUploadLimitReachedException(
						"Du hast schon " + activeFileCount + " Dateien, mehr als " + maxFilesPerUsers + " gehen nicht.");
			}
			runningUploadCountByUsersGuid.put(authorUsersGuid, runningUploadCount + 1);
		}
	}

	private void releaseUploadSlot(UUID authorUsersGuid) {
		synchronized (runningUploadCountByUsersGuid) {
			int runningUploadCount = runningUploadCountByUsersGuid.getOrDefault(authorUsersGuid, 0);
			int remainingUploadCount = runningUploadCount - 1;
			if (remainingUploadCount <= 0) {
				runningUploadCountByUsersGuid.remove(authorUsersGuid);
			} else {
				runningUploadCountByUsersGuid.put(authorUsersGuid, remainingUploadCount);
			}
		}
	}

	/**
	 * Punkte für ein neues Bild in einer Galerie (Tätigkeit {@code gebiter.point-activity.gallery-upload.key}), Bezug
	 * der SHA-256: Dieselbe Datei bringt nie zweimal Punkte. Scheitert die Buchung, steht es im Log; die Datei ist
	 * trotzdem gespeichert.
	 */
	private void createGalleryUploadPointBooking(UUID authorUsersGuid, String sha256Hex) {
		try {
			Instant bookedAt = Instant.now();
			usersPointBookingService.createActivityRewardBooking(authorUsersGuid, galleryUploadPointActivityKey,
					sha256Hex, bookedAt);
		} catch (RuntimeException exception) {
			LOGGER.error("Upload: Punkte für {} von {} nicht gebucht", sha256Hex, authorUsersGuid, exception);
		}
	}

	/** Der Zähler im Profil. Scheitert er, steht es im Log; die Datei ist trotzdem gespeichert. */
	private void increaseUploadCountOfAuthor(UUID authorUsersGuid) {
		try {
			usersDetailService.increaseUsersDetailUploadCount(authorUsersGuid);
		} catch (RuntimeException exception) {
			LOGGER.error("Upload: Zähler von {} nicht hochgezählt", authorUsersGuid, exception);
		}
	}

	private static MessageDigest createSha256Digest() {
		try {
			// fester Algorithmus: die id jedes Dokuments ist der SHA-256 der Bytes
			return MessageDigest.getInstance("SHA-256");
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 fehlt in dieser Java-Laufzeit.", exception);
		}
	}
}
