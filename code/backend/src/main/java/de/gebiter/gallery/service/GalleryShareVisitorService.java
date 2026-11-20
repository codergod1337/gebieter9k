package de.gebiter.gallery.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.dto.FileCommentThread;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.file.dto.FileDocumentPage;
import de.gebiter.file.dto.FileSolrFieldNameSet;
import de.gebiter.file.dto.FileDocumentZipSource;
import de.gebiter.file.service.FileCommentService;
import de.gebiter.file.service.FileDocumentResolveService;
import de.gebiter.file.service.FileDownloadService;
import de.gebiter.gallery.GalleryShareBusyException;
import de.gebiter.gallery.dto.SharedGalleryForClient;
import de.gebiter.gallery.model.Gallery;
import de.gebiter.gallery.model.GalleryShare;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Alles, was ein Besucher mit dem Link einer Galerie-Freigabe darf (Konzept {@code docu/konzept-galerie-freigabe.md}): die
 * Galerie ansehen, ein Bild im Viewer laden, ein Bild herunterladen, eine Auswahl oder alle als ZIP herunterladen. Ohne
 * Anmeldung: Der Token ist das Recht. Kein eigenes Repository, der Service führt nur die zuständigen Services zusammen.
 * <p>
 * Jeder Weg beginnt gleich, und nichts davon lässt sich überspringen:
 * <ol>
 * <li>Der Token öffnet eine gültige Freigabe ({@link GalleryShareService#getValidGalleryShare}): Schloss eins, Postgres.</li>
 * <li>Die Bilder kommen nur über die Lesegrenze der Freigabe aus Solr (das Bild trägt den Hash, steht in der Galerie der
 * Freigabe, ist aktiv): Schloss zwei. Die id der Galerie kommt aus der Freigabe, nie vom Besucher.</li>
 * <li>Bevor Bytes eines Bildes hinausgehen, wird der Aufruf gezählt
 * ({@link GalleryShareService#countGalleryShareAccesses}), in derselben Anweisung noch einmal geprüft.</li>
 * </ol>
 * Keine Methode fragt nach dem angemeldeten User: Seine Rollen und seine GUID gibt es hier nicht.
 * <p>
 * Besucher teilen sich eine feste Zahl gleichzeitiger Abrufe ({@code gebiter.gallery-share.max-parallel-deliveries}),
 * davon nur wenige ZIP-Downloads: So bleiben Verbindungen zum Dateispeicher für angemeldete User frei. Keine Methode läuft
 * in einer Datenbank-Transaktion: Ein ZIP von 100 GB streamt Stunden und hielte sonst so lange eine Verbindung fest.
 * <p>
 * Der Token wird nie geloggt, nur die id der Freigabe.
 */
@Service
public class GalleryShareVisitorService {

	private static final Logger LOGGER = LoggerFactory.getLogger(GalleryShareVisitorService.class);

	private final GalleryShareService galleryShareService;

	private final GalleryService galleryService;

	private final FileDocumentResolveService fileDocumentResolveService;

	private final FileDownloadService fileDownloadService;

	private final FileCommentService fileCommentService;

	/** So viele Bilder zeigt eine Seite der Besucheransicht ({@code gebiter.gallery-share.file-page-size}). */
	private final int filePageSize;

	/** Die Felder eines Bildes für Besucher ohne Anmeldung ({@code gebiter.gallery-share.visitor-field-names}). */
	private final List<String> visitorFieldNames;

	/** So lange wartet ein Abruf auf einen freien Platz ({@code gebiter.gallery-share.delivery-wait}). */
	private final Duration deliveryWait;

	/** Für den Header Retry-After, wenn kein Platz frei wird ({@code gebiter.gallery-share.delivery-retry-after-seconds}). */
	private final String deliveryRetryAfterSeconds;

	/** Höchstens so viele Bilder in einer Auswahl ({@code gebiter.gallery-share.selection-max-file-count}). */
	private final int selectionMaxFileCount;

	/** Die Plätze aller Abrufe von Besuchern, fair: Wer zuerst wartet, kommt zuerst dran. */
	private final Semaphore deliveryPermits;

	/** Die Plätze der ZIP-Downloads, zusätzlich zu einem Platz aus {@link #deliveryPermits}. */
	private final Semaphore zipDownloadPermits;

	public GalleryShareVisitorService(GalleryShareService galleryShareService, GalleryService galleryService,
			FileDocumentResolveService fileDocumentResolveService, FileDownloadService fileDownloadService,
			FileCommentService fileCommentService, FileSolrFieldNames fileSolrFieldNames,
			@Value("${gebiter.gallery-share.file-page-size}") int filePageSize,
			@Value("${gebiter.gallery-share.visitor-field-names}") List<String> visitorFieldNames,
			@Value("${gebiter.gallery-share.max-parallel-deliveries}") int maxParallelDeliveries,
			@Value("${gebiter.gallery-share.max-parallel-zip-downloads}") int maxParallelZipDownloads,
			@Value("${gebiter.gallery-share.delivery-wait}") Duration deliveryWait,
			@Value("${gebiter.gallery-share.delivery-retry-after-seconds}") String deliveryRetryAfterSeconds,
			@Value("${gebiter.gallery-share.selection-max-file-count}") int selectionMaxFileCount) {
		if (filePageSize < 1) {
			throw new IllegalStateException("gebiter.gallery-share.file-page-size muss mindestens 1 sein.");
		}
		if (maxParallelZipDownloads < 1 || maxParallelDeliveries < maxParallelZipDownloads) {
			throw new IllegalStateException("gebiter.gallery-share.max-parallel-zip-downloads muss mindestens 1 sein und "
					+ "darf max-parallel-deliveries nicht übersteigen.");
		}
		if (selectionMaxFileCount < 1) {
			throw new IllegalStateException("gebiter.gallery-share.selection-max-file-count muss mindestens 1 sein.");
		}
		// Diese Felder darf ein Besucher nie bekommen, egal was in der YAML steht: Pfad auf dem SFTP, die Hashes der
		// Freigaben und für wessen Freunde die Datei lesbar ist
		String sftpPathFieldName = fileSolrFieldNames.sftpPath();
		String galleryShareTokenHashesFieldName = fileSolrFieldNames.galleryShareTokenHashes();
		String readableForFriendsFieldName = fileSolrFieldNames.readableForFriendsOfUsersGuid();
		List<String> forbiddenVisitorFieldNames = List.of(sftpPathFieldName, galleryShareTokenHashesFieldName,
				readableForFriendsFieldName);
		for (String visitorFieldName : visitorFieldNames) {
			boolean forbidden = forbiddenVisitorFieldNames.contains(visitorFieldName);
			if (forbidden) {
				throw new IllegalStateException("gebiter.gallery-share.visitor-field-names darf das Feld "
						+ visitorFieldName + " nicht enthalten.");
			}
		}
		this.galleryShareService = galleryShareService;
		this.galleryService = galleryService;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.fileDownloadService = fileDownloadService;
		this.fileCommentService = fileCommentService;
		this.filePageSize = filePageSize;
		this.visitorFieldNames = List.copyOf(visitorFieldNames);
		this.deliveryWait = deliveryWait;
		this.deliveryRetryAfterSeconds = deliveryRetryAfterSeconds;
		this.selectionMaxFileCount = selectionMaxFileCount;
		this.deliveryPermits = new Semaphore(maxParallelDeliveries, true);
		this.zipDownloadPermits = new Semaphore(maxParallelZipDownloads, true);
	}

	/**
	 * READ (Besucher): Die Standardansicht einer Freigabe: Titel und Beschreibung der Galerie und eine Seite ihrer Bilder
	 * als Kacheln (die Vorschau steht im Dokument), dazu je Bild die Zahl seiner Kommentare. Das Ansehen der Kacheln ist
	 * kein Aufruf und wird nicht gezählt.
	 *
	 * @param page die Seite der Bilder, ab 0
	 * @throws EntityNotFoundException wenn der Token keine gültige Freigabe öffnet
	 * @throws IllegalArgumentException wenn {@code page} negativ ist
	 */
	public SharedGalleryForClient resolveSharedGallery(String shareToken, int page) {
		GalleryShare validGalleryShare = galleryShareService.getValidGalleryShare(shareToken);
		Long galleryId = validGalleryShare.getGalleryId();
		String shareTokenHash = validGalleryShare.getShareTokenHash();
		Gallery sharedGallery = galleryService.getGalleryForGalleryShare(galleryId);
		FileDocumentPage filePage = fileDocumentResolveService.resolveFileDocumentsOfGalleryShare(galleryId,
				shareTokenHash, page, filePageSize, visitorFieldNames);
		String title = sharedGallery.getTitle();
		Map<String, String> description = sharedGallery.getDescription();
		Instant expiresAt = validGalleryShare.getExpiresAt();
		Long maxAccessCount = validGalleryShare.getMaxAccessCount();
		Long remainingAccessCount = null;
		if (maxAccessCount != null) {
			long accessCount = validGalleryShare.getAccessCount();
			remainingAccessCount = Math.max(0L, maxAccessCount - accessCount);
		}
		FileSolrFieldNameSet fileSolrFieldNameSet = fileDocumentResolveService.getFileSolrFieldNameSet();
		// Die Zahl der Kommentare je Bild der Seite, für die Sprechblase an der Kachel: eine Abfrage für die ganze Seite
		String idFieldName = fileSolrFieldNameSet.id();
		List<Map<String, Object>> pageFiles = filePage.documents();
		List<String> pageFileIds = new ArrayList<>();
		for (Map<String, Object> pageFile : pageFiles) {
			Object rawPageFileId = pageFile.get(idFieldName);
			if (rawPageFileId != null) {
				String pageFileId = rawPageFileId.toString();
				pageFileIds.add(pageFileId);
			}
		}
		Map<String, Long> commentCountsByFileDocumentId = fileCommentService.resolveFileCommentCountsForGalleryShare(
				pageFileIds);
		return new SharedGalleryForClient(title, description, expiresAt, remainingAccessCount, filePage,
				fileSolrFieldNameSet, commentCountsByFileDocumentId);
	}

	/**
	 * READ (Besucher): Der Verlauf der Kommentare eines Bildes der Freigabe, die ältesten zuerst, mit ihren Autoren
	 * (Entscheidung 9 im Konzept: Kommentare sieht auch ein Besucher, schreiben kann nur ein angemeldeter User). Das Lesen
	 * der Kommentare ist kein Aufruf und wird nicht gezählt.
	 *
	 * @throws EntityNotFoundException wenn der Token keine gültige Freigabe öffnet oder das Bild nicht zu dieser Freigabe
	 *         gehört
	 */
	public FileCommentThread getSharedFileCommentThread(String shareToken, String fileDocumentId) {
		GalleryShare validGalleryShare = galleryShareService.getValidGalleryShare(shareToken);
		Long galleryId = validGalleryShare.getGalleryId();
		String shareTokenHash = validGalleryShare.getShareTokenHash();
		FileDocumentBackendFacts sharedFileBackendFacts = fileDocumentResolveService
				.resolveFileDocumentBackendFactsOfGalleryShare(fileDocumentId, galleryId, shareTokenHash);
		if (sharedFileBackendFacts == null) {
			throw new EntityNotFoundException("Dieses Bild gibt es in der Freigabe nicht.");
		}
		return fileCommentService.getFileCommentThreadForGalleryShare(fileDocumentId);
	}

	/**
	 * READ (Besucher): Streamt EIN Bild der Freigabe, für den Viewer oder als Download. Das ist ein Aufruf: Er wird
	 * gezählt, bevor das erste Byte hinausgeht. Jede Anfrage zählt, auch eine nach einem Byte-Bereich (Range): Sonst ließe
	 * sich eine Grenze der Aufrufe mit Teil-Anfragen umgehen.
	 *
	 * @param asAttachment {@code true}: Download (Anhang, das Original); {@code false}: Viewer
	 * @param rangeHeader der Range-Header des Browsers, {@code null} ohne
	 * @throws EntityNotFoundException wenn der Token keine gültige Freigabe öffnet, die Aufrufe verbraucht sind oder das
	 *         Bild nicht zu dieser Freigabe gehört
	 * @throws GalleryShareBusyException wenn gerade kein Platz für einen weiteren Abruf frei wird
	 */
	public void streamSharedFile(String shareToken, String fileDocumentId, boolean asAttachment, String rangeHeader,
			HttpServletResponse response) {
		GalleryShare validGalleryShare = galleryShareService.getValidGalleryShare(shareToken);
		Long galleryShareId = validGalleryShare.getId();
		Long galleryId = validGalleryShare.getGalleryId();
		String shareTokenHash = validGalleryShare.getShareTokenHash();
		FileDocumentBackendFacts sharedFileBackendFacts = fileDocumentResolveService
				.resolveFileDocumentBackendFactsOfGalleryShare(fileDocumentId, galleryId, shareTokenHash);
		if (sharedFileBackendFacts == null) {
			throw new EntityNotFoundException("Dieses Bild gibt es in der Freigabe nicht.");
		}
		doAcquirePermit(deliveryPermits);
		try {
			long oneAccess = 1L;
			galleryShareService.countGalleryShareAccesses(galleryShareId, oneAccess);
			fileDownloadService.streamFileDocumentWithBackendFacts(fileDocumentId, sharedFileBackendFacts, asAttachment,
					rangeHeader, response);
		} finally {
			deliveryPermits.release();
		}
	}

	/**
	 * READ (Besucher): Streamt mehrere Bilder der Freigabe als eine ZIP-Datei, eine Auswahl oder alle. Jedes Bild im ZIP
	 * ist ein Aufruf; gezählt wird alles zusammen, bevor das erste Byte hinausgeht. Reichen die Aufrufe der Freigabe nicht
	 * für alle Bilder, gibt es kein ZIP.
	 * <p>
	 * Bei einer Auswahl muss JEDES gewählte Bild zu dieser Freigabe gehören, sonst gibt es kein ZIP: Niemand bekommt ein
	 * ZIP, in dem stillschweigend etwas fehlt, und niemand kann mit fremden ids probieren, was es gibt.
	 *
	 * @param selectedFileDocumentIds die gewählten Bilder; {@code null}: alle Bilder der Freigabe
	 * @throws EntityNotFoundException wenn der Token keine gültige Freigabe öffnet, die Aufrufe nicht reichen, ein
	 *         gewähltes Bild nicht dazugehört oder die Freigabe keine Bilder hat
	 * @throws IllegalArgumentException wenn die Auswahl leer oder zu groß ist oder eine id nicht die Form einer id hat
	 * @throws GalleryShareBusyException wenn gerade kein Platz für einen weiteren Abruf frei wird
	 */
	public void streamSharedFilesAsZip(String shareToken, List<String> selectedFileDocumentIds,
			HttpServletResponse response) {
		Set<String> distinctSelectedIds = null;
		if (selectedFileDocumentIds != null) {
			distinctSelectedIds = requireValidSelection(selectedFileDocumentIds);
		}
		GalleryShare validGalleryShare = galleryShareService.getValidGalleryShare(shareToken);
		Long galleryShareId = validGalleryShare.getId();
		Long galleryId = validGalleryShare.getGalleryId();
		String shareTokenHash = validGalleryShare.getShareTokenHash();
		List<FileDocumentZipSource> zipSources = fileDocumentResolveService
				.resolveFileDocumentZipSourcesOfGalleryShare(galleryId, shareTokenHash);
		if (distinctSelectedIds != null) {
			// Die Auswahl aus allen Bildern der Freigabe heraussuchen: Die Reihenfolge der Galerie bleibt dabei erhalten
			List<FileDocumentZipSource> selectedZipSources = new ArrayList<>();
			for (FileDocumentZipSource zipSource : zipSources) {
				String zipSourceId = zipSource.id();
				boolean selected = distinctSelectedIds.contains(zipSourceId);
				if (selected) {
					selectedZipSources.add(zipSource);
				}
			}
			if (selectedZipSources.size() != distinctSelectedIds.size()) {
				throw new EntityNotFoundException("Mindestens ein gewähltes Bild gibt es in der Freigabe nicht.");
			}
			zipSources = selectedZipSources;
		}
		if (zipSources.isEmpty()) {
			throw new EntityNotFoundException("In dieser Freigabe gibt es keine Bilder.");
		}
		Gallery sharedGallery = galleryService.getGalleryForGalleryShare(galleryId);
		String galleryTitle = sharedGallery.getTitle();
		String fallbackZipName = "galerie";
		String safeZipName = Helper.createSafeFileName(galleryTitle, fallbackZipName);
		String zipFileName = safeZipName + ".zip";

		doAcquirePermit(deliveryPermits);
		try {
			doAcquirePermit(zipDownloadPermits);
			try {
				long accessCountIncrease = zipSources.size();
				galleryShareService.countGalleryShareAccesses(galleryShareId, accessCountIncrease);
				LOGGER.info("Freigabe {}: ZIP mit {} Bildern beginnt", galleryShareId, accessCountIncrease);
				fileDownloadService.streamFileDocumentsAsZip(zipSources, zipFileName, response);
				LOGGER.info("Freigabe {}: ZIP mit {} Bildern beendet", galleryShareId, accessCountIncrease);
			} finally {
				zipDownloadPermits.release();
			}
		} finally {
			deliveryPermits.release();
		}
	}

	/**
	 * Die Auswahl eines Besuchers, geprüft, bevor irgendetwas mit ihr geschieht: nicht leer, nicht größer als erlaubt, jede
	 * id in der Form einer id (SHA-256 als Hex). Doppelte fallen weg.
	 */
	private Set<String> requireValidSelection(List<String> selectedFileDocumentIds) {
		if (selectedFileDocumentIds.isEmpty()) {
			throw new IllegalArgumentException("Die Auswahl ist leer.");
		}
		if (selectedFileDocumentIds.size() > selectionMaxFileCount) {
			throw new IllegalArgumentException("Eine Auswahl darf höchstens " + selectionMaxFileCount
					+ " Bilder enthalten. Für mehr gibt es „alle herunterladen“.");
		}
		List<String> checkedSelectedIds = new ArrayList<>();
		for (String selectedFileDocumentId : selectedFileDocumentIds) {
			String checkedSelectedId = Helper.requireSha256Hex(selectedFileDocumentId);
			checkedSelectedIds.add(checkedSelectedId);
		}
		return new LinkedHashSet<>(checkedSelectedIds);
	}

	/**
	 * Nimmt einen Platz, wartet dafür höchstens {@link #deliveryWait}. Der Aufrufer gibt ihn in {@code finally} zurück.
	 *
	 * @throws GalleryShareBusyException wenn in der Wartezeit kein Platz frei wird
	 */
	private void doAcquirePermit(Semaphore permits) {
		long waitMillis = deliveryWait.toMillis();
		boolean permitAcquired = false;
		try {
			permitAcquired = permits.tryAcquire(waitMillis, TimeUnit.MILLISECONDS);
		} catch (InterruptedException interruptedException) {
			Thread.currentThread().interrupt();
		}
		if (!permitAcquired) {
			throw new GalleryShareBusyException(deliveryRetryAfterSeconds);
		}
	}
}
