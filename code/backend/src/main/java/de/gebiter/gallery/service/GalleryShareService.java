package de.gebiter.gallery.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.dto.FileDocumentSoftDeletedEvent;
import de.gebiter.file.service.FileDocumentResolveService;
import de.gebiter.file.service.FileDocumentWriteService;
import de.gebiter.gallery.dto.GalleryDeletedEvent;
import de.gebiter.gallery.dto.GalleryShareForClient;
import de.gebiter.gallery.model.GalleryShare;
import de.gebiter.gallery.repository.GalleryShareRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Freigaben einer Galerie über einen Token (Konzept {@code docu/konzept-galerie-freigabe.md}). Er nutzt
 * nur sein eigenes {@link GalleryShareRepository}; wem eine Galerie gehört, sagt der {@link GalleryService}, die Bilder
 * liegen im Kern FILE und werden über die File-Services gelesen und geschrieben.
 * <p>
 * Eine Freigabe steht an zwei Stellen, und beide müssen zusammenpassen, damit ein Besucher ein Bild bekommt:
 * <ul>
 * <li>die Zeile in Postgres ({@link GalleryShare}): Gibt es die Freigabe, ist sie noch gültig?</li>
 * <li>das Feld {@code galleryShareTokenHashes} im Solr-Dokument jedes Bildes der Galerie: Trägt das Bild sie?</li>
 * </ul>
 * In Solr steht nur der SHA-256 des Tokens. Der Token selbst steht in der Zeile in Postgres: Der Besitzer der Galerie
 * bekommt ihn mit jeder seiner Freigaben und kann den Link jederzeit wieder ansehen und weiterschicken (Nutzer
 * 2026-11-20). Ein Hash in einem Dokument, zu dem es keine Zeile (mehr) gibt, öffnet nichts.
 * <p>
 * Anlegen darf, wer ADMIN ist oder das Recht FREIGABE hat (Nutzer 2026-11-19), und nur für eine eigene Galerie; die GUID
 * kommt aus dem Token.
 * <p>
 * Gelöscht wird immer in dieser Reihenfolge (Nutzer 2026-11-19): zuerst der Hash aus den Solr-Dokumenten, erst danach die
 * Zeile in Postgres. Solange die Zeile steht, weiß das Backend, welcher Hash aus den Dokumenten muss, und ein
 * gescheitertes Löschen lässt sich wiederholen.
 */
@Service
public class GalleryShareService {

	private static final Logger LOGGER = LoggerFactory.getLogger(GalleryShareService.class);

	private final GalleryShareRepository galleryShareRepository;

	private final GalleryService galleryService;

	private final FileDocumentResolveService fileDocumentResolveService;

	private final FileDocumentWriteService fileDocumentWriteService;

	private final FileSolrFieldNames fileSolrFieldNames;

	/** So viele Byte Zufall hat ein Token ({@code gebiter.gallery-share.token-bytes}). */
	private final int tokenBytes;

	/** Höchstlänge der Bezeichnung ({@code gebiter.gallery-share.label-max-length}). */
	private final int labelMaxLength;

	public GalleryShareService(GalleryShareRepository galleryShareRepository, GalleryService galleryService,
			FileDocumentResolveService fileDocumentResolveService, FileDocumentWriteService fileDocumentWriteService,
			FileSolrFieldNames fileSolrFieldNames, @Value("${gebiter.gallery-share.token-bytes}") int tokenBytes,
			@Value("${gebiter.gallery-share.label-max-length}") int labelMaxLength) {
		// 16 Byte sind 128 Bit: darunter ließe sich ein Token durch Probieren finden
		int minTokenBytes = 16;
		if (tokenBytes < minTokenBytes) {
			throw new IllegalStateException("gebiter.gallery-share.token-bytes muss mindestens " + minTokenBytes + " sein.");
		}
		this.galleryShareRepository = galleryShareRepository;
		this.galleryService = galleryService;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.fileDocumentWriteService = fileDocumentWriteService;
		this.fileSolrFieldNames = fileSolrFieldNames;
		this.tokenBytes = tokenBytes;
		this.labelMaxLength = labelMaxLength;
	}

	/**
	 * CREATE: Der angemeldete User gibt eine eigene Galerie frei. Ablauf:
	 * <ol>
	 * <li>Prüfen: Bezeichnung, Grenzen der Freigabe, die Galerie gehört ihm.</li>
	 * <li>Token würfeln, die Freigabe mit ihm und seinem SHA-256 in Postgres anlegen.</li>
	 * <li>Über alle aktiven Bilder der Galerie gehen und den Hash in ihr Feld {@code galleryShareTokenHashes} aufnehmen
	 * (eine Anfrage an Solr, ein Commit).</li>
	 * <li>Die Zahl der beschriebenen Bilder an der Freigabe festhalten ({@code fileCount}), als Kontrolle.</li>
	 * </ol>
	 * Scheitert das Schreiben nach Solr, entsteht keine Freigabe (die Transaktion rollt zurück), und der Hash kommt aus
	 * den schon beschriebenen Bildern wieder heraus.
	 *
	 * @param label die Bezeichnung der Freigabe, z. B. „für Oma“
	 * @param expiresAt bis wann die Freigabe gilt, {@code null} ohne zeitliche Grenze
	 * @param maxAccessCount wie viele Aufrufe sie höchstens erlaubt, {@code null} ohne Grenze
	 * @return die angelegte Freigabe mit ihrem Token für den Link
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder sie nicht ihm gehört
	 * @throws IllegalArgumentException wenn die Bezeichnung fehlt oder zu lang ist, beide Grenzen gesetzt sind, der Ablauf
	 *         nicht in der Zukunft liegt oder die Zahl der Aufrufe kleiner als 1 ist
	 */
	@PreAuthorize("hasAnyRole('ADMIN', 'FREIGABE')")
	@Transactional
	public GalleryShareForClient createOwnGalleryShare(Long galleryId, String label, Instant expiresAt,
			Long maxAccessCount) {
		Helper.requireNotNull(galleryId, "galleryId");
		String checkedLabel = requireLabel(label);
		requireValidLimits(expiresAt, maxAccessCount);
		galleryService.checkOwnGalleryExists(galleryId);

		String shareToken = Helper.createRandomHexToken(tokenBytes);
		String shareTokenHash = Helper.createSha256Hex(shareToken);
		GalleryShare newGalleryShare = new GalleryShare(galleryId, checkedLabel, shareToken, shareTokenHash, expiresAt,
				maxAccessCount);
		GalleryShare savedGalleryShare = galleryShareRepository.save(newGalleryShare);

		List<String> galleryFileIds = fileDocumentResolveService.resolveActiveFileDocumentIdsOfGallery(galleryId);
		String galleryShareTokenHashesFieldName = fileSolrFieldNames.galleryShareTokenHashes();
		try {
			fileDocumentWriteService.addBackendFieldValueToFileDocuments(galleryFileIds, galleryShareTokenHashesFieldName,
					shareTokenHash);
		} catch (RuntimeException solrException) {
			doRemoveShareTokenHashAfterFailedCreate(galleryFileIds, shareTokenHash);
			throw solrException;
		}

		long writtenFileCount = galleryFileIds.size();
		savedGalleryShare.setFileCount(writtenFileCount);
		GalleryShare countedGalleryShare = galleryShareRepository.save(savedGalleryShare);
		Long galleryShareId = countedGalleryShare.getId();
		LOGGER.info("Galerie {}: Freigabe {} angelegt, in {} Bilder geschrieben", galleryId, galleryShareId,
				writtenFileCount);
		GalleryShareForClient galleryShareForClient = createGalleryShareForClient(countedGalleryShare);
		return galleryShareForClient;
	}

	/**
	 * READ: Die Freigaben einer eigenen Galerie, die älteste zuerst, je mit ihrem Token für den Link und mit der Zahl der
	 * Bilder laut Postgres und laut Solr (die Kontrolle). Sehen darf sie der Besitzer der Galerie, auch wenn er das Recht
	 * zum Anlegen nicht mehr hat.
	 *
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder sie nicht ihm gehört
	 */
	@Transactional(readOnly = true)
	public List<GalleryShareForClient> resolveOwnGalleryShares(Long galleryId) {
		Helper.requireNotNull(galleryId, "galleryId");
		galleryService.checkOwnGalleryExists(galleryId);
		List<GalleryShare> galleryShares = galleryShareRepository.findByGalleryIdOrderByIdAsc(galleryId);
		List<GalleryShareForClient> gallerySharesForClient = new ArrayList<>();
		for (GalleryShare galleryShare : galleryShares) {
			GalleryShareForClient galleryShareForClient = createGalleryShareForClient(galleryShare);
			gallerySharesForClient.add(galleryShareForClient);
		}
		return gallerySharesForClient;
	}

	/**
	 * Für den Upload in eine Galerie (der {@code FileUploadService} ruft es, bevor er die Bytes annimmt): das Feld, mit
	 * dem das neue Bild die Freigaben seiner Galerie von Anfang an trägt. Ohne Freigabe eine leere Map. Ohne
	 * Rechteprüfung: Dass die Galerie dem User gehört, hat der Aufrufer schon über den {@link GalleryService} geprüft.
	 *
	 * @return {@code galleryShareTokenHashes} → die Hashes aller Freigaben der Galerie, oder leer
	 */
	@Transactional(readOnly = true)
	public Map<String, Object> prepareGalleryShareUpload(Long galleryId) {
		Helper.requireNotNull(galleryId, "galleryId");
		List<GalleryShare> galleryShares = galleryShareRepository.findByGalleryIdOrderByIdAsc(galleryId);
		Map<String, Object> galleryShareFieldValues = new HashMap<>();
		if (galleryShares.isEmpty()) {
			return galleryShareFieldValues;
		}
		List<String> shareTokenHashes = new ArrayList<>();
		for (GalleryShare galleryShare : galleryShares) {
			String shareTokenHash = galleryShare.getShareTokenHash();
			shareTokenHashes.add(shareTokenHash);
		}
		String galleryShareTokenHashesFieldName = fileSolrFieldNames.galleryShareTokenHashes();
		galleryShareFieldValues.put(galleryShareTokenHashesFieldName, shareTokenHashes);
		return galleryShareFieldValues;
	}

	/**
	 * UPDATE (Backend): Ein Bild ist neu in die Galerie hochgeladen (der {@code FileUploadService} ruft es, nachdem das
	 * Dokument angelegt ist): Jede Freigabe der Galerie zählt ein Bild mehr. Ohne Rechteprüfung, die hat der Upload
	 * gemacht. Ohne Freigabe geschieht nichts.
	 */
	public void increaseFileCountOfGalleryShares(Long galleryId) {
		Helper.requireNotNull(galleryId, "galleryId");
		long oneFileMore = 1L;
		galleryShareRepository.changeFileCountByGalleryId(galleryId, oneFileMore);
	}

	/**
	 * Eine Datei wurde weich gelöscht ({@link FileDocumentSoftDeletedEvent}): Die Freigaben ihrer Galerie zählen ein Bild
	 * weniger. Ein gelöschtes Bild liefert kein Leseweg mehr aus, auch nicht über eine Freigabe; sein Dokument behält
	 * den Hash, zählt aber nicht mehr mit. Die Rechte hat das Löschen schon geprüft (Autor oder Admin).
	 * <p>
	 * Scheitert das Zählen, bleibt das Löschen gültig und meldet keinen Fehler: Die Kontrolle der Freigabe zeigt die
	 * Abweichung dann an.
	 */
	@EventListener
	void decreaseFileCountAfterFileDocumentSoftDeleted(FileDocumentSoftDeletedEvent softDeletedEvent) {
		String deletedFileDocumentId = softDeletedEvent.fileDocumentId();
		List<Long> galleryIds = softDeletedEvent.galleryIds();
		long oneFileLess = -1L;
		for (Long galleryId : galleryIds) {
			try {
				galleryShareRepository.changeFileCountByGalleryId(galleryId, oneFileLess);
			} catch (RuntimeException exception) {
				LOGGER.warn("Galerie {}: Zahl der Bilder an den Freigaben nach dem Löschen der Datei {} nicht nachgezogen",
						galleryId, deletedFileDocumentId, exception);
			}
		}
	}

	/**
	 * READ (Besucher): Die Freigabe zu einem Token, nur wenn sie gerade gilt. Ohne Anmeldung und ohne Rechteprüfung: Der
	 * Token ist das Recht. Geprüft wird in dieser Reihenfolge:
	 * <ol>
	 * <li>die Form des Tokens (Hex, feste Länge), bevor irgendetwas anderes mit ihm geschieht;</li>
	 * <li>gibt es eine Freigabe mit seinem SHA-256?</li>
	 * <li>ist sie nicht abgelaufen, und hat sie noch Aufrufe übrig?</li>
	 * </ol>
	 * Jeder dieser Fälle sieht für den Besucher gleich aus („gibt es nicht“): Niemand erfährt, woran es lag. Der Token
	 * wird nie geloggt.
	 *
	 * @throws EntityNotFoundException wenn der Token keine gültige Freigabe öffnet
	 */
	@Transactional(readOnly = true)
	public GalleryShare getValidGalleryShare(String shareToken) {
		int shareTokenLength = tokenBytes * 2;
		boolean shareTokenWellFormed = Helper.isLowerCaseHex(shareToken, shareTokenLength);
		if (!shareTokenWellFormed) {
			throw createInvalidGalleryShareException();
		}
		String shareTokenHash = Helper.createSha256Hex(shareToken);
		Optional<GalleryShare> foundGalleryShare = galleryShareRepository.findByShareTokenHash(shareTokenHash);
		if (foundGalleryShare.isEmpty()) {
			throw createInvalidGalleryShareException();
		}
		GalleryShare existingGalleryShare = foundGalleryShare.get();
		Instant expiresAt = existingGalleryShare.getExpiresAt();
		Instant now = Instant.now();
		boolean expired = expiresAt != null && !expiresAt.isAfter(now);
		Long maxAccessCount = existingGalleryShare.getMaxAccessCount();
		long accessCount = existingGalleryShare.getAccessCount();
		boolean accessesUsedUp = maxAccessCount != null && accessCount >= maxAccessCount;
		if (expired || accessesUsedUp) {
			throw createInvalidGalleryShareException();
		}
		return existingGalleryShare;
	}

	/**
	 * UPDATE (Besucher): Zählt Aufrufe an einer Freigabe, bevor das Backend die Bilder ausliefert. Ein Aufruf ist ein Bild,
	 * das der Viewer lädt oder das heruntergeladen wird (Nutzer 2026-11-19); ein ZIP mit 40 Bildern sind 40 Aufrufe.
	 * Prüfen und Zählen geschehen in einer Anweisung in der Datenbank
	 * ({@link GalleryShareRepository#increaseAccessCountIfValid}): Ist die Freigabe inzwischen abgelaufen oder reichen
	 * die Aufrufe nicht mehr für alle, wird nichts gezählt und nichts ausgeliefert.
	 *
	 * @param accessCountIncrease so viele Bilder werden gleich ausgeliefert, mindestens 1
	 * @throws EntityNotFoundException wenn die Freigabe nicht mehr gilt oder die Aufrufe nicht reichen
	 */
	public void countGalleryShareAccesses(Long id, long accessCountIncrease) {
		Helper.requireNotNull(id, "id");
		if (accessCountIncrease < 1) {
			throw new IllegalArgumentException("accessCountIncrease muss mindestens 1 sein.");
		}
		Instant now = Instant.now();
		int countedGalleryShares = galleryShareRepository.increaseAccessCountIfValid(id, accessCountIncrease, now);
		if (countedGalleryShares == 0) {
			throw createInvalidGalleryShareException();
		}
	}

	/**
	 * DELETE: Der Besitzer der Galerie löscht eine Freigabe; ihr Link öffnet danach nichts mehr. Reihenfolge (Nutzer
	 * 2026-11-19): zuerst kommt der Hash aus den Solr-Dokumenten, erst danach wird die Zeile in Postgres gelöscht. Geht in
	 * Solr etwas schief, steht die Freigabe noch in Postgres, und das Löschen lässt sich wiederholen.
	 * <ol>
	 * <li>Prüfen: Es gibt die Freigabe, ihre Galerie gehört ihm.</li>
	 * <li>Alle Dokumente lesen, die den Hash tragen (in jedem Status, auch weich gelöschte), und ihn herausnehmen.</li>
	 * <li>Nachlesen: Trägt noch ein Dokument den Hash, bricht das Löschen ab, die Zeile bleibt.</li>
	 * <li>Die Zeile löschen.</li>
	 * </ol>
	 * Löschen darf der Besitzer auch, wenn er das Recht zum Anlegen nicht mehr hat: Eine Freigabe zurückzunehmen ist immer
	 * erlaubt.
	 *
	 * @throws EntityNotFoundException wenn es die Freigabe nicht gibt oder ihre Galerie nicht ihm gehört
	 * @throws IllegalStateException wenn der Hash danach noch in einem Dokument steht
	 */
	@Transactional
	public void deleteOwnGalleryShare(Long id) {
		Helper.requireNotNull(id, "id");
		GalleryShare ownGalleryShare = doGetOwnGalleryShare(id);
		doDeleteGalleryShare(ownGalleryShare);
	}

	/**
	 * Eine Galerie wird gelöscht ({@link GalleryDeletedEvent}): Ihre Freigaben gehen mit, jede in derselben Reihenfolge
	 * wie beim einzelnen Löschen (erst Solr, dann die Zeile). Läuft in der Transaktion des Löschens, die Rechte hat
	 * {@link GalleryService#deleteOwnGallery(Long)} schon geprüft. Ein Fehler wird weitergereicht: Die Galerie bleibt dann
	 * bestehen, und ihr Löschen lässt sich wiederholen.
	 */
	@EventListener
	@Transactional
	void deleteGallerySharesOfDeletedGallery(GalleryDeletedEvent galleryDeletedEvent) {
		Long deletedGalleryId = galleryDeletedEvent.galleryId();
		List<GalleryShare> gallerySharesOfGallery = galleryShareRepository.findByGalleryIdOrderByIdAsc(deletedGalleryId);
		for (GalleryShare galleryShareOfGallery : gallerySharesOfGallery) {
			doDeleteGalleryShare(galleryShareOfGallery);
		}
	}

	/**
	 * Der Kern des Löschens einer Freigabe, ohne Rechteprüfung: erst der Hash aus allen Dokumenten, die ihn tragen, dann
	 * die Zeile. Gesucht wird nach dem Hash, nicht nach der Galerie: So kommt er auch aus Dokumenten heraus, die schon
	 * weich gelöscht sind, und ein zweiter Anlauf findet genau die Dokumente, die beim ersten übrig geblieben sind.
	 */
	private void doDeleteGalleryShare(GalleryShare galleryShare) {
		Long galleryShareId = galleryShare.getId();
		Long galleryId = galleryShare.getGalleryId();
		String shareTokenHash = galleryShare.getShareTokenHash();
		String galleryShareTokenHashesFieldName = fileSolrFieldNames.galleryShareTokenHashes();
		List<String> sharedFileIds = fileDocumentResolveService.resolveFileDocumentIdsWithGalleryShareTokenHash(
				shareTokenHash);
		fileDocumentWriteService.removeBackendFieldValueFromFileDocuments(sharedFileIds, galleryShareTokenHashesFieldName,
				shareTokenHash);
		List<String> remainingFileIds = fileDocumentResolveService.resolveFileDocumentIdsWithGalleryShareTokenHash(
				shareTokenHash);
		int remainingFileCount = remainingFileIds.size();
		if (remainingFileCount > 0) {
			throw new IllegalStateException("Die Freigabe steht noch in " + remainingFileCount
					+ " Bildern. Sie ist nicht gelöscht, bitte das Löschen wiederholen.");
		}
		galleryShareRepository.delete(galleryShare);
		int clearedFileCount = sharedFileIds.size();
		LOGGER.info("Galerie {}: Freigabe {} gelöscht, aus {} Bildern herausgenommen", galleryId, galleryShareId,
				clearedFileCount);
	}

	/** Die Freigabe, nur wenn ihre Galerie dem angemeldeten User gehört; sonst sieht es aus wie „gibt es nicht“. */
	private GalleryShare doGetOwnGalleryShare(Long id) {
		Optional<GalleryShare> foundGalleryShare = galleryShareRepository.findById(id);
		if (foundGalleryShare.isEmpty()) {
			throw new EntityNotFoundException("Die Freigabe gibt es nicht.");
		}
		GalleryShare existingGalleryShare = foundGalleryShare.get();
		Long galleryId = existingGalleryShare.getGalleryId();
		try {
			galleryService.checkOwnGalleryExists(galleryId);
		} catch (EntityNotFoundException foreignGalleryException) {
			// dieselbe Meldung wie ohne Freigabe: Niemand erfährt, ob es eine fremde Freigabe mit dieser id gibt
			throw new EntityNotFoundException("Die Freigabe gibt es nicht.");
		}
		return existingGalleryShare;
	}

	/** Die eine Antwort an einen Besucher, dessen Token nichts öffnet: immer dieselbe, egal woran es liegt. */
	private static EntityNotFoundException createInvalidGalleryShareException() {
		return new EntityNotFoundException("Diese Freigabe gibt es nicht, oder sie gilt nicht mehr.");
	}

	/** Die Bezeichnung ohne Leerzeichen außen; sie muss da sein und darf höchstens die Höchstlänge haben. */
	private String requireLabel(String label) {
		Helper.requireNotBlank(label, "label");
		String strippedLabel = label.strip();
		if (strippedLabel.length() > labelMaxLength) {
			throw new IllegalArgumentException("Die Bezeichnung darf höchstens " + labelMaxLength + " Zeichen haben.");
		}
		return strippedLabel;
	}

	/**
	 * Eine Freigabe ist dauerhaft, zeitlich begrenzt oder auf Aufrufe begrenzt: Höchstens eine der beiden Grenzen darf
	 * gesetzt sein, ein Ablauf muss in der Zukunft liegen, eine Zahl von Aufrufen mindestens 1 sein.
	 */
	private void requireValidLimits(Instant expiresAt, Long maxAccessCount) {
		boolean timeLimited = expiresAt != null;
		boolean accessLimited = maxAccessCount != null;
		if (timeLimited && accessLimited) {
			throw new IllegalArgumentException(
					"Eine Freigabe ist entweder zeitlich begrenzt oder auf Aufrufe begrenzt, nicht beides.");
		}
		if (timeLimited) {
			Instant now = Instant.now();
			boolean expiresInFuture = expiresAt.isAfter(now);
			if (!expiresInFuture) {
				throw new IllegalArgumentException("Der Ablauf der Freigabe muss in der Zukunft liegen.");
			}
		}
		if (accessLimited && maxAccessCount < 1) {
			throw new IllegalArgumentException("Die Zahl der Aufrufe muss mindestens 1 sein.");
		}
	}

	/**
	 * Aufräumen, wenn das Schreiben des Hashes nach Solr mittendrin gescheitert ist: Er kommt aus den Bildern wieder
	 * heraus, in die er schon geschrieben war. Scheitert auch das, bleibt er dort stehen und öffnet trotzdem nichts, denn
	 * die Freigabe in Postgres entsteht nicht.
	 */
	private void doRemoveShareTokenHashAfterFailedCreate(List<String> galleryFileIds, String shareTokenHash) {
		String galleryShareTokenHashesFieldName = fileSolrFieldNames.galleryShareTokenHashes();
		try {
			fileDocumentWriteService.removeBackendFieldValueFromFileDocuments(galleryFileIds,
					galleryShareTokenHashesFieldName, shareTokenHash);
		} catch (RuntimeException cleanupException) {
			LOGGER.warn("Freigabe nicht angelegt, der Hash ließ sich nicht aus allen Bildern wieder herausnehmen",
					cleanupException);
		}
	}

	/**
	 * Eine Freigabe für die Anzeige beim Besitzer, mit ihrem Token für den Link und mit der Zahl der Bilder, die sie in
	 * Solr wirklich tragen.
	 */
	private GalleryShareForClient createGalleryShareForClient(GalleryShare galleryShare) {
		Long id = galleryShare.getId();
		Long galleryId = galleryShare.getGalleryId();
		String label = galleryShare.getLabel();
		String shareToken = galleryShare.getShareToken();
		Instant expiresAt = galleryShare.getExpiresAt();
		Long maxAccessCount = galleryShare.getMaxAccessCount();
		long accessCount = galleryShare.getAccessCount();
		long fileCount = galleryShare.getFileCount();
		Instant createdAt = galleryShare.getCreatedAt();
		String shareTokenHash = galleryShare.getShareTokenHash();
		long sharedFileCount = fileDocumentResolveService.countActiveFileDocumentsWithGalleryShareTokenHash(shareTokenHash);
		return new GalleryShareForClient(id, galleryId, label, shareToken, expiresAt, maxAccessCount, accessCount,
				fileCount, sharedFileCount, createdAt);
	}
}
