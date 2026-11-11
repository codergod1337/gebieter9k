package de.gebiter.file.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileConfig;
import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.dto.FileAnalysisProgress;
import de.gebiter.file.dto.FileAnalysisRunningStep;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.file.model.FileAnalysisProgressState;
import de.gebiter.file.model.FileAnalysisStep;
import de.gebiter.file.model.FileExtension;
import de.gebiter.heif.service.HeifService;
import de.gebiter.sftp.service.SftpService;
import de.gebiter.tika.dto.TikaFileContent;
import de.gebiter.tika.service.TikaService;
import de.gebiter.util.Helper;
import jakarta.annotation.PreDestroy;

/**
 * Der Hintergrund-Thread des File-Kerns (Wunsch des Nutzers 2026-11-08: EIN Thread). Der Upload legt die Datei nur in
 * den Upload-Puffer ({@link FileStagingService}) und checkt sie in Solr ein; alles Weitere passiert hier, eine Datei
 * nach der anderen:
 * <ol>
 * <li>Die Datei aus dem Puffer auf den SFTP (über {@code .part}, Größenprüfung, Umbenennen). Scheitert das, bleibt sie
 * im Puffer und der nächste Durchgang versucht es wieder; erst danach darf sie aus dem Puffer.</li>
 * <li>Tika samt Texterkennung, EXIF und Vorschaubild, mit dem Pfad der Datei im Puffer: Tika springt über, was es nicht
 * braucht, und kommt mit jeder Größe aus. Ergebnis per Atomic Update ins Dokument, {@code analysisStatus} von PENDING
 * auf DONE (oder FAILED).</li>
 * <li>Die Datei aus dem Puffer löschen.</li>
 * </ol>
 * Die Warteschlange ist der Puffer selbst: Was dort als {@code <sha256>.bin} liegt, ist noch zu tun. Er wird beim Start
 * und regelmäßig nachgesehen, ein Neustart verliert also nichts. Laufen zwei Backends auf demselben Solr (Pi und Mac),
 * arbeitet jedes nur seinen eigenen Puffer ab.
 * <p>
 * Hängende Auswertungen (Nutzer 2026-11-11): Eine Datei kann auf PENDING stehen bleiben, obwohl sie nicht mehr im Puffer
 * liegt, z. B. weil die Auswertung mit einem Error abgestürzt ist (Speicher voll) oder weil Solr beim Speichern des
 * Ergebnisses nicht antwortete. Zu ihr kommt von selbst niemand mehr. Einmal am Tag sucht ein Lauf diese Dateien, holt
 * sie vom SFTP zurück in den Puffer und wertet sie ein zweites Mal aus; scheitert auch das, steht FAILED im Dokument
 * ({@link #retryStuckFileDocumentAnalyses()}, Konzept {@code docu/konzept-file-kern.md}).
 * <p>
 * HEIF-Bilder (HEIC vom iPhone) wandelt libheif zuerst in ein JPEG samt EXIF: Tesseract und ImageIO lesen kein HEIF.
 * Tika, Texterkennung und Vorschau arbeiten dann auf dem JPEG, der Typ im Dokument bleibt der des Originals.
 * <p>
 * Läuft ohne angemeldeten User: Lesen und Schreiben gehen über Methoden, die kein Endpunkt erreicht.
 */
@Service
public class FileAnalysisService {

	private static final Logger LOGGER = LoggerFactory.getLogger(FileAnalysisService.class);

	private final FileDocumentResolveService fileDocumentResolveService;

	private final FileDocumentWriteService fileDocumentWriteService;

	private final FileExtensionService fileExtensionService;

	private final FilePreviewService filePreviewService;

	private final FileStagingService fileStagingService;

	private final TikaService tikaService;

	private final HeifService heifService;

	private final SftpService sftpService;

	private final FileConfig fileConfig;

	private final FileSolrFieldNames fileSolrFieldNames;

	/** Der eine Hintergrund-Thread: Aufträge und die regelmäßige Nachsuche laufen nacheinander darauf. */
	private final ScheduledExecutorService analysisExecutor = Executors
			.newSingleThreadScheduledExecutor(this::createAnalysisThread);

	/**
	 * ids, die in der Warteschlange stehen oder gerade laufen, in ihrer Reihenfolge: keine doppelt, die erste ist dran.
	 * Für „Platz x von y“ in der Anzeige. Zugriff nur in {@code synchronized} auf diese Menge.
	 */
	private final LinkedHashSet<String> queuedFileDocumentIds = new LinkedHashSet<>();

	/** Woran der Thread gerade arbeitet, {@code null} wenn an nichts. */
	private volatile FileAnalysisRunningStep runningStep;

	/** Wann der laufende Schritt begann, für seine Dauer im Log. */
	private volatile long runningStepStartNanos;

	/** Für höchstens so viele Dateien auf einmal gibt es den Stand ({@code gebiter.file.analysis-progress-max-ids}). */
	private final int analysisProgressMaxIds;

	public FileAnalysisService(FileDocumentResolveService fileDocumentResolveService,
			FileDocumentWriteService fileDocumentWriteService, FileExtensionService fileExtensionService,
			FilePreviewService filePreviewService, FileStagingService fileStagingService, TikaService tikaService,
			HeifService heifService, SftpService sftpService, FileConfig fileConfig,
			FileSolrFieldNames fileSolrFieldNames,
			@Value("${gebiter.file.analysis-progress-max-ids}") int analysisProgressMaxIds) {
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.fileDocumentWriteService = fileDocumentWriteService;
		this.fileExtensionService = fileExtensionService;
		this.filePreviewService = filePreviewService;
		this.fileStagingService = fileStagingService;
		this.tikaService = tikaService;
		this.heifService = heifService;
		this.sftpService = sftpService;
		this.fileConfig = fileConfig;
		this.fileSolrFieldNames = fileSolrFieldNames;
		this.analysisProgressMaxIds = analysisProgressMaxIds;
	}

	/**
	 * Nach dem Start: sofort und dann regelmäßig im Puffer nach Arbeit sehen; dazu den täglichen Lauf für hängende
	 * Auswertungen planen.
	 */
	@EventListener(ApplicationReadyEvent.class)
	void startStagingScan() {
		long scanIntervalMillis = fileConfig.analysisPendingScanInterval().toMillis();
		analysisExecutor.scheduleWithFixedDelay(this::enqueueStagedFileDocuments, 0, scanIntervalMillis,
				TimeUnit.MILLISECONDS);
		scheduleNextStuckAnalysisRetry();
	}

	@PreDestroy
	void stopAnalysisExecutor() {
		analysisExecutor.shutdownNow();
	}

	/** CREATE: Reiht eine Datei ein, z. B. direkt nach dem Upload. Steht sie schon drin, passiert nichts. */
	public void enqueueFileDocumentAnalysis(String id) {
		// Einreihen und Auftrag im selben Block: Die Reihenfolge der Menge ist die des Threads
		synchronized (queuedFileDocumentIds) {
			boolean newlyQueued = queuedFileDocumentIds.add(id);
			if (!newlyQueued) {
				return;
			}
			boolean secondAttempt = false;
			analysisExecutor.execute(() -> processStagedFile(id, secondAttempt));
		}
	}

	/**
	 * READ (Auflösen): Wie weit die Auswertung dieser Dateien ist, für die Upload-Liste: Platz in der Warteschlange und,
	 * wenn sie läuft, der Schritt. Nur aus dem Hauptspeicher, ohne Solr. Verrät nichts über den Inhalt einer Datei.
	 *
	 * @throws IllegalArgumentException wenn die Liste fehlt, zu lang ist oder eine id kein SHA-256-Hex-Wert ist
	 */
	public List<FileAnalysisProgress> resolveFileAnalysisProgress(List<String> fileDocumentIds) {
		Helper.requireNotNull(fileDocumentIds, "fileDocumentIds");
		if (fileDocumentIds.size() > analysisProgressMaxIds) {
			throw new IllegalArgumentException("Höchstens " + analysisProgressMaxIds + " Dateien auf einmal.");
		}
		List<String> checkedFileDocumentIds = new ArrayList<>();
		for (String fileDocumentId : fileDocumentIds) {
			String checkedFileDocumentId = Helper.requireSha256Hex(fileDocumentId);
			checkedFileDocumentIds.add(checkedFileDocumentId);
		}
		List<String> queueSnapshot;
		synchronized (queuedFileDocumentIds) {
			queueSnapshot = new ArrayList<>(queuedFileDocumentIds);
		}
		FileAnalysisRunningStep currentRunningStep = runningStep;
		int queueSize = queueSnapshot.size();
		List<FileAnalysisProgress> fileAnalysisProgresses = new ArrayList<>();
		for (String fileDocumentId : checkedFileDocumentIds) {
			FileAnalysisProgress fileAnalysisProgress = createFileAnalysisProgress(fileDocumentId, queueSnapshot,
					currentRunningStep, queueSize);
			fileAnalysisProgresses.add(fileAnalysisProgress);
		}
		return fileAnalysisProgresses;
	}

	private static FileAnalysisProgress createFileAnalysisProgress(String fileDocumentId, List<String> queueSnapshot,
			FileAnalysisRunningStep currentRunningStep, int queueSize) {
		int queueIndex = queueSnapshot.indexOf(fileDocumentId);
		if (queueIndex < 0) {
			return new FileAnalysisProgress(fileDocumentId, FileAnalysisProgressState.NOT_QUEUED, 0, queueSize, null, 0, 0);
		}
		int queuePosition = queueIndex + 1;
		boolean running = currentRunningStep != null && currentRunningStep.fileDocumentId().equals(fileDocumentId);
		if (!running) {
			return new FileAnalysisProgress(fileDocumentId, FileAnalysisProgressState.WAITING, queuePosition, queueSize,
					null, 0, 0);
		}
		FileAnalysisStep step = currentRunningStep.step();
		int stepNumber = currentRunningStep.stepNumber();
		int stepCount = currentRunningStep.stepCount();
		return new FileAnalysisProgress(fileDocumentId, FileAnalysisProgressState.RUNNING, queuePosition, queueSize, step,
				stepNumber, stepCount);
	}

	/** Reiht alles ein, was im Puffer liegt. Ein Fehler (z. B. Platte kurz weg) wartet auf den nächsten Durchgang. */
	private void enqueueStagedFileDocuments() {
		try {
			List<String> stagedFileIds = fileStagingService.getStagedFileIds();
			for (String stagedFileId : stagedFileIds) {
				enqueueFileDocumentAnalysis(stagedFileId);
			}
		} catch (RuntimeException exception) {
			LOGGER.warn("Hintergrund: Nachsehen im Upload-Puffer fehlgeschlagen: {}", exception.toString());
		}
	}

	/**
	 * Plant den nächsten täglichen Lauf für hängende Auswertungen: heute zur eingestellten Uhrzeit
	 * ({@code gebiter.file.analysis-retry-time} in der Zeitzone {@code analysis-retry-time-zone}) oder, ist sie heute schon
	 * vorbei, morgen. Jeder Lauf plant am Ende den nächsten; so stimmt die Uhrzeit auch über die Zeitumstellung hinweg.
	 */
	private void scheduleNextStuckAnalysisRetry() {
		ZoneId retryTimeZone = fileConfig.analysisRetryTimeZone();
		LocalTime retryTime = fileConfig.analysisRetryTime();
		ZonedDateTime now = ZonedDateTime.now(retryTimeZone);
		ZonedDateTime nextRetry = now.with(retryTime);
		boolean alreadyPassedToday = !nextRetry.isAfter(now);
		if (alreadyPassedToday) {
			nextRetry = nextRetry.plusDays(1);
		}
		Duration waitTime = Duration.between(now, nextRetry);
		// eine Millisekunde dazu: Der Lauf beginnt nie vor der Uhrzeit und plant sich deshalb nicht noch einmal für heute
		long waitMillis = waitTime.toMillis() + 1;
		analysisExecutor.schedule(this::retryStuckFileDocumentAnalyses, waitMillis, TimeUnit.MILLISECONDS);
		LOGGER.info("Hängende Auswertungen: nächster Lauf {}", nextRetry);
	}

	/**
	 * Der tägliche Lauf für hängende Auswertungen (Nutzer 2026-11-11), auf dem einen Hintergrund-Thread: Er sucht die
	 * Dateien, die noch auf PENDING stehen, obwohl ihr Upload länger her ist als
	 * {@code gebiter.file.analysis-retry-min-age}, und gibt jeder hängenden einen zweiten Versuch
	 * ({@link #retryFileDocumentAnalysisIfStuck}). Scheitert eine Datei, geht es mit der nächsten weiter.
	 * <p>
	 * Beispiel mit 05:00 und 5h: Ein PDF von gestern 14:10 steht noch auf PENDING, weil Tika mit „Speicher voll“ abgestürzt
	 * ist. Um 05:00 holt der Lauf es vom SFTP und wertet es noch einmal aus: Klappt es, steht DONE im Dokument; stürzt es
	 * wieder ab, FAILED, und ein Admin muss es sich ansehen (Ursache im Log).
	 */
	private void retryStuckFileDocumentAnalyses() {
		try {
			Duration retryMinAge = fileConfig.analysisRetryMinAge();
			Instant now = Instant.now();
			Instant uploadedBefore = now.minus(retryMinAge);
			List<String> pendingFileDocumentIds = fileDocumentResolveService
					.resolvePendingFileDocumentIdsUploadedBefore(uploadedBefore);
			int retriedCount = 0;
			for (String pendingFileDocumentId : pendingFileDocumentIds) {
				boolean retried = retryFileDocumentAnalysisIfStuck(pendingFileDocumentId);
				if (retried) {
					retriedCount = retriedCount + 1;
				}
			}
			int pendingCount = pendingFileDocumentIds.size();
			long retryMinAgeMinutes = retryMinAge.toMinutes();
			LOGGER.info("Hängende Auswertungen: {} Dateien seit über {} Minuten auf PENDING, {} ein zweites Mal ausgewertet",
					pendingCount, retryMinAgeMinutes, retriedCount);
		} catch (RuntimeException exception) {
			LOGGER.warn("Hängende Auswertungen: Lauf abgebrochen, nächster Versuch beim nächsten Lauf: {}",
					exception.toString());
		} finally {
			scheduleNextStuckAnalysisRetry();
		}
	}

	/**
	 * Der zweite Versuch für eine Datei, wenn sie wirklich hängt: Sie steht auf PENDING, liegt aber nicht mehr im
	 * Upload-Puffer, also kommt von selbst niemand mehr zu ihr. Sie kommt vom SFTP zurück in den Puffer und läuft noch
	 * einmal durch die Auswertung, diesmal als zweiter Versuch: Danach steht DONE oder FAILED im Dokument.
	 * <p>
	 * Nicht angefasst wird eine Datei, die noch im Puffer liegt (der Thread kommt von selbst zu ihr, z. B. war der SFTP
	 * lange weg), und eine, die nicht auf dem SFTP liegt: Ohne Bytes gibt es keinen zweiten Versuch. Sie kann noch im
	 * Puffer eines anderen Backends liegen (Pi und Mac auf demselben Solr); das steht als Warnung im Log.
	 *
	 * @return {@code true}, wenn die Datei ein zweites Mal ausgewertet wurde
	 */
	private boolean retryFileDocumentAnalysisIfStuck(String id) {
		try {
			boolean staged = fileStagingService.isStaged(id);
			if (staged) {
				return false;
			}
			FileDocumentBackendFacts fileDocumentBackendFacts = fileDocumentResolveService
					.resolveFileDocumentBackendFacts(id);
			if (fileDocumentBackendFacts == null) {
				return false;
			}
			String sftpPath = fileDocumentBackendFacts.sftpPath();
			boolean onSftp = sftpService.existsFileData(sftpPath);
			if (!onSftp) {
				LOGGER.warn("Hängende Auswertung {}: liegt weder im Upload-Puffer noch auf dem SFTP, kein zweiter Versuch",
						id);
				return false;
			}
			LOGGER.info("Hängende Auswertung {}: zweiter Versuch", id);
			restoreStagedFileFromSftp(id, fileDocumentBackendFacts);
			boolean secondAttempt = true;
			processStagedFile(id, secondAttempt);
			return true;
		} catch (RuntimeException exception) {
			// z. B. SFTP kurz weg oder der Puffer voll: Die Datei bleibt auf PENDING, der nächste Lauf versucht es wieder
			LOGGER.warn("Hängende Auswertung {}: zweiter Versuch nicht möglich: {}", id, exception.toString());
			return false;
		}
	}

	/**
	 * Holt die Datei vom SFTP zurück in den Upload-Puffer, auf demselben Weg wie ein Upload: erst als Teil-Datei mit
	 * reserviertem Platz, dann unter ihrem Namen {@code <sha256>.bin}.
	 *
	 * @throws de.gebiter.file.FileStagingFullException wenn der Puffer dafür zu voll ist
	 * @throws UncheckedIOException wenn sich die Teil-Datei nicht schreiben lässt
	 */
	private void restoreStagedFileFromSftp(String id, FileDocumentBackendFacts fileDocumentBackendFacts) {
		long fileSizeBytes = fileDocumentBackendFacts.fileSizeBytes();
		String sftpPath = fileDocumentBackendFacts.sftpPath();
		Path partFile = fileStagingService.createPartFile(fileSizeBytes);
		try {
			try (OutputStream partFileData = Files.newOutputStream(partFile)) {
				sftpService.readFileData(sftpPath, partFileData);
			}
			fileStagingService.moveToStagedFile(partFile, id);
		} catch (IOException exception) {
			fileStagingService.deletePartFile(partFile);
			throw new UncheckedIOException("Die Datei ließ sich nicht in den Upload-Puffer zurückholen.", exception);
		} catch (RuntimeException exception) {
			fileStagingService.deletePartFile(partFile);
			throw exception;
		} finally {
			fileStagingService.releaseReservation(fileSizeBytes);
		}
	}

	/**
	 * Ein Auftrag: SFTP, Auswertung, Puffer leeren. Läuft nur auf dem einen Thread.
	 *
	 * @param secondAttempt {@code true} im täglichen Lauf für hängende Auswertungen: Stürzt die Auswertung auch jetzt
	 *        ab, bekommt die Datei FAILED
	 */
	private void processStagedFile(String id, boolean secondAttempt) {
		try {
			doProcessStagedFile(id, secondAttempt);
		} catch (RuntimeException exception) {
			// z. B. Solr kurz weg: Die Datei bleibt im Puffer, der nächste Durchgang versucht es wieder
			LOGGER.warn("Hintergrund {}: abgebrochen, nächster Versuch beim nächsten Durchgang: {}", id,
					exception.toString());
		} finally {
			logFinishedStep();
			runningStep = null;
			synchronized (queuedFileDocumentIds) {
				queuedFileDocumentIds.remove(id);
			}
		}
	}

	private void doProcessStagedFile(String id, boolean secondAttempt) {
		Path stagedFile = fileStagingService.getStagedFile(id);
		if (!Files.isRegularFile(stagedFile)) {
			return;
		}
		FileDocumentBackendFacts fileDocumentBackendFacts = fileDocumentResolveService.resolveFileDocumentBackendFacts(id);
		if (fileDocumentBackendFacts == null) {
			// Kein Dokument: Rest eines abgebrochenen Eincheckens oder inzwischen endgültig gelöscht
			LOGGER.info("Hintergrund {}: kein Dokument dazu, Datei aus dem Upload-Puffer gelöscht", id);
			fileStagingService.deleteStagedFile(id);
			return;
		}

		// Welche Schritte diese Datei braucht, steht jetzt fest: für „Schritt x von y“ in der Anzeige
		List<FileAnalysisStep> plannedSteps = planAnalysisSteps(fileDocumentBackendFacts);

		// 1. Sicher auf den SFTP; scheitert das, bleibt die Datei im Puffer (Ausnahme geht an processStagedFile)
		startStep(id, plannedSteps, FileAnalysisStep.STORE_ON_SFTP);
		String sftpPath = fileDocumentBackendFacts.sftpPath();
		long storeStartNanos = System.nanoTime();
		boolean storedNow = storeStagedFileOnSftp(stagedFile, sftpPath);
		if (storedNow) {
			long storeMillis = (System.nanoTime() - storeStartNanos) / 1_000_000;
			LOGGER.info("Hintergrund {}: auf dem SFTP in {} ms", id, storeMillis);
		}
		boolean stillExists = fileDocumentResolveService.existsFileDocument(id);
		if (!stillExists) {
			// Endgültig gelöscht, während die Bytes unterwegs waren: dann auch vom SFTP wieder weg
			sftpService.deleteFileData(sftpPath);
			fileStagingService.deleteStagedFile(id);
			return;
		}

		// 2. Auswerten, wenn sie noch offen ist; die Datei liegt jetzt sicher auf dem SFTP
		String pendingStatus = fileConfig.analysisStatusPending();
		String analysisStatus = fileDocumentBackendFacts.analysisStatus();
		boolean analysisPending = pendingStatus.equals(analysisStatus);
		try {
			if (analysisPending) {
				long analysisStartNanos = System.nanoTime();
				analyzeStagedFile(id, stagedFile, fileDocumentBackendFacts, plannedSteps);
				long analysisMillis = (System.nanoTime() - analysisStartNanos) / 1_000_000;
				LOGGER.info("Auswertung {}: fertig in {} ms", id, analysisMillis);
			}
		} catch (RuntimeException exception) {
			LOGGER.warn("Auswertung {}: gescheitert", id, exception);
			markFileDocumentAnalysisFailed(id);
		} catch (Error error) {
			// Ein Error ist ein Absturz der Auswertung selbst, z. B. Speicher voll oder zu tief verschachtelt. Das kann am
			// Augenblick liegen (gerade viel los): Die Datei bleibt auf PENDING, der tägliche Lauf versucht es ein zweites
			// Mal. Stürzt sie auch dort ab, liegt es an der Datei: FAILED.
			if (secondAttempt) {
				LOGGER.error("Auswertung {}: auch im zweiten Versuch abgestürzt, Stand FAILED", id, error);
				markFileDocumentAnalysisFailed(id);
			} else {
				LOGGER.error("Auswertung {}: abgestürzt, bleibt auf PENDING bis zum täglichen Lauf", id, error);
			}
		} finally {
			// 3. Puffer leeren: Ab jetzt liefert der SFTP
			fileStagingService.deleteStagedFile(id);
		}
	}

	/**
	 * Bringt die Datei auf den SFTP, falls sie dort noch nicht liegt. Eine fertige Datei auf dem SFTP ist vollständig: Sie
	 * bekommt ihren Namen erst nach der Größenprüfung.
	 *
	 * @return {@code true}, wenn sie jetzt übertragen wurde
	 */
	private boolean storeStagedFileOnSftp(Path stagedFile, String sftpPath) {
		boolean alreadyOnSftp = sftpService.existsFileData(sftpPath);
		if (alreadyOnSftp) {
			return false;
		}
		try (InputStream stagedFileData = Files.newInputStream(stagedFile)) {
			sftpService.createFileData(stagedFileData, sftpPath);
		} catch (IOException exception) {
			throw new UncheckedIOException("Die Datei im Upload-Puffer ließ sich nicht lesen.", exception);
		}
		return true;
	}

	/** Tika, Texterkennung, EXIF und Vorschau auf der Datei im Puffer; Ergebnis ins Dokument, Stand DONE. */
	private void analyzeStagedFile(String id, Path stagedFile, FileDocumentBackendFacts fileDocumentBackendFacts,
			List<FileAnalysisStep> plannedSteps) {
		Path heifJpegFile = null;
		try {
			Path analysisFile = stagedFile;
			String mimeType = fileDocumentBackendFacts.mimeType();
			boolean heifImage = heifService.isHeifMimeType(mimeType);
			if (heifImage) {
				startStep(id, plannedSteps, FileAnalysisStep.CONVERT_HEIF);
				heifJpegFile = createJpegFromHeif(stagedFile);
				analysisFile = heifJpegFile;
			}
			Map<String, Object> analysisValuesByFieldName = new LinkedHashMap<>();
			// Bei Bildern liest Tika nur Inhalt und EXIF; die Texterkennung läuft danach auf einer verkleinerten Kopie
			boolean textRecognitionOnCopy = plannedSteps.contains(FileAnalysisStep.RECOGNIZE_TEXT);
			boolean textRecognitionInTika = !textRecognitionOnCopy;
			startStep(id, plannedSteps, FileAnalysisStep.READ_WITH_TIKA);
			TikaFileContent tikaFileContent = readWithTika(analysisFile, textRecognitionInTika);
			if (textRecognitionOnCopy) {
				startStep(id, plannedSteps, FileAnalysisStep.RECOGNIZE_TEXT);
				Integer exifOrientation = tikaFileContent.exifOrientation();
				String recognizedText = recognizeTextOnSmallCopy(analysisFile, exifOrientation);
				tikaFileContent = withRecognizedText(tikaFileContent, recognizedText);
			}
			// Bei HEIF hat Tika die JPEG-Kopie gelesen: Der Typ des Originals (vom Upload) bleibt im Dokument.
			boolean keepUploadMimeType = heifImage;
			putTikaFieldValues(analysisValuesByFieldName, tikaFileContent, keepUploadMimeType);
			boolean previewPlanned = plannedSteps.contains(FileAnalysisStep.CREATE_PREVIEW);
			if (previewPlanned) {
				startStep(id, plannedSteps, FileAnalysisStep.CREATE_PREVIEW);
			}
			String previewBase64Png = createPreviewIfWanted(analysisFile, fileDocumentBackendFacts, tikaFileContent);
			if (previewBase64Png != null) {
				String previewBase64PngFieldName = fileSolrFieldNames.previewBase64Png();
				analysisValuesByFieldName.put(previewBase64PngFieldName, previewBase64Png);
			}
			String analysisStatusFieldName = fileSolrFieldNames.analysisStatus();
			String doneStatus = fileConfig.analysisStatusDone();
			analysisValuesByFieldName.put(analysisStatusFieldName, doneStatus);
			startStep(id, plannedSteps, FileAnalysisStep.SAVE_RESULT);
			fileDocumentWriteService.completeFileDocumentAnalysis(id, analysisValuesByFieldName);
		} finally {
			Helper.deleteTempFile(heifJpegFile);
		}
	}

	/** Das HEIF-Bild als JPEG-Kopie; scheitert libheif, scheitert die Auswertung (FAILED, Grund im Log). */
	private Path createJpegFromHeif(Path heifFile) {
		try {
			return heifService.createJpegTempFileFromHeif(heifFile);
		} catch (IOException exception) {
			throw new UncheckedIOException("Das HEIF-Bild ließ sich nicht umwandeln.", exception);
		}
	}

	/**
	 * Texterkennung eines Bildes auf der verkleinerten Kopie ({@link FilePreviewService#createTextRecognitionImageFile});
	 * lässt sich keine Kopie machen, auf dem Original. Die Kopie wird danach gelöscht.
	 */
	private String recognizeTextOnSmallCopy(Path imageFile, Integer exifOrientation) {
		Path textRecognitionImageFile = filePreviewService.createTextRecognitionImageFile(imageFile, exifOrientation);
		try {
			Path recognitionFile = imageFile;
			if (textRecognitionImageFile != null) {
				recognitionFile = textRecognitionImageFile;
			}
			TikaFileContent recognitionContent = readWithTika(recognitionFile, true);
			return recognitionContent.text();
		} finally {
			Helper.deleteTempFile(textRecognitionImageFile);
		}
	}

	/** Dieselben Werte von Tika, der Text aber aus der Texterkennung (steht dort nichts, bleibt der von Tika). */
	private static TikaFileContent withRecognizedText(TikaFileContent tikaFileContent, String recognizedText) {
		boolean hasRecognizedText = recognizedText != null && !recognizedText.isBlank();
		if (!hasRecognizedText) {
			return tikaFileContent;
		}
		return new TikaFileContent(tikaFileContent.mimeType(), recognizedText, tikaFileContent.imageWidth(),
				tikaFileContent.imageHeight(), tikaFileContent.exifOrientation(), tikaFileContent.capturedAt(),
				tikaFileContent.cameraModel(), tikaFileContent.gpsLatitude(), tikaFileContent.gpsLongitude());
	}

	/**
	 * Tika mit dem Pfad, für jede Größe: Text höchstens {@code gebiter.file.tika-max-text-characters} Zeichen, mit oder
	 * ohne Texterkennung.
	 */
	private TikaFileContent readWithTika(Path analysisFile, boolean textRecognitionWanted) {
		int tikaMaxTextCharacters = fileConfig.tikaMaxTextCharacters();
		try {
			return tikaService.readFileContent(analysisFile, tikaMaxTextCharacters, textRecognitionWanted);
		} catch (IOException exception) {
			throw new UncheckedIOException("Die Datei ließ sich für Tika nicht lesen.", exception);
		}
	}

	/**
	 * Die Schritte dieser Datei: immer der SFTP; ist die Auswertung offen, dazu HEIF (nur HEIC), Tika, Vorschau (nur mit
	 * Bildvorschau) und Speichern.
	 */
	private List<FileAnalysisStep> planAnalysisSteps(FileDocumentBackendFacts fileDocumentBackendFacts) {
		List<FileAnalysisStep> plannedSteps = new ArrayList<>();
		plannedSteps.add(FileAnalysisStep.STORE_ON_SFTP);
		String pendingStatus = fileConfig.analysisStatusPending();
		String analysisStatus = fileDocumentBackendFacts.analysisStatus();
		boolean analysisPending = pendingStatus.equals(analysisStatus);
		if (!analysisPending) {
			return plannedSteps;
		}
		String mimeType = fileDocumentBackendFacts.mimeType();
		boolean heifImage = heifService.isHeifMimeType(mimeType);
		if (heifImage) {
			plannedSteps.add(FileAnalysisStep.CONVERT_HEIF);
		}
		plannedSteps.add(FileAnalysisStep.READ_WITH_TIKA);
		// Texterkennung als eigener Schritt nur bei Bildern, und nur wenn sie in der YAML an ist
		boolean isImage = mimeType != null && mimeType.startsWith("image/");
		boolean textRecognitionEnabled = tikaService.isTextRecognitionEnabled();
		if (isImage && textRecognitionEnabled) {
			plannedSteps.add(FileAnalysisStep.RECOGNIZE_TEXT);
		}
		boolean previewWanted = isImagePreviewWanted(fileDocumentBackendFacts);
		if (previewWanted) {
			plannedSteps.add(FileAnalysisStep.CREATE_PREVIEW);
		}
		plannedSteps.add(FileAnalysisStep.SAVE_RESULT);
		return plannedSteps;
	}

	/**
	 * Merkt sich den Schritt für die Anzeige (der wievielte der geplanten Schritte dieser Datei) und schreibt die Dauer
	 * des vorigen ins Log: So sieht man, woran eine lange Auswertung hängt.
	 */
	private void startStep(String id, List<FileAnalysisStep> plannedSteps, FileAnalysisStep step) {
		logFinishedStep();
		int stepNumber = plannedSteps.indexOf(step) + 1;
		int stepCount = plannedSteps.size();
		runningStepStartNanos = System.nanoTime();
		runningStep = new FileAnalysisRunningStep(id, step, stepNumber, stepCount);
	}

	/** Die Dauer des laufenden Schritts ins Log, wenn einer läuft. */
	private void logFinishedStep() {
		FileAnalysisRunningStep finishedStep = runningStep;
		if (finishedStep == null) {
			return;
		}
		long stepMillis = (System.nanoTime() - runningStepStartNanos) / 1_000_000;
		LOGGER.info("Auswertung {}: Schritt {} von {} ({}) in {} ms", finishedStep.fileDocumentId(), finishedStep.stepNumber(),
				finishedStep.stepCount(), finishedStep.step(), stepMillis);
	}

	/** Bekommt die Datei ein Vorschaubild? Nur bei einer bekannten Endung mit Bildvorschau. */
	private boolean isImagePreviewWanted(FileDocumentBackendFacts fileDocumentBackendFacts) {
		// Eine inzwischen gelöschte Endung kennt der Katalog nicht mehr: dann ohne Vorschau, die Auswertung läuft weiter
		String fileExtension = fileDocumentBackendFacts.fileExtension();
		boolean fileExtensionKnown = fileExtension != null && fileExtensionService.existsFileExtension(fileExtension);
		if (!fileExtensionKnown) {
			return false;
		}
		FileExtension fileExtensionEntry = fileExtensionService.getFileExtension(fileExtension);
		return fileExtensionEntry.isImagePreview();
	}

	private String createPreviewIfWanted(Path localFile, FileDocumentBackendFacts fileDocumentBackendFacts,
			TikaFileContent tikaFileContent) {
		boolean previewWanted = isImagePreviewWanted(fileDocumentBackendFacts);
		if (!previewWanted) {
			return null;
		}
		Integer exifOrientation = tikaFileContent.exifOrientation();
		try (InputStream localFileData = Files.newInputStream(localFile)) {
			return filePreviewService.createPreviewBase64Png(localFileData, exifOrientation);
		} catch (IOException exception) {
			LOGGER.info("Auswertung: Vorschaubild nicht möglich: {}", exception.toString());
			return null;
		}
	}

	/**
	 * Die Werte von Tika fürs Dokument. Der gelesene Text kommt immer in {@code tikaFileDescription}, getrennt von der
	 * Beschreibung des Users ({@code fileDescription}): bei einem Bild die Texterkennung, bei einem Dokument (Word, Excel,
	 * Text …) sein Inhalt, ohne Leerzeilen ({@link Helper#removeBlankLines}). Den Text eines Dokuments bekommt zusätzlich
	 * der Volltext {@code searchableText} für die Suche; die Texterkennung eines Bildes nicht, auf Fotos ohne Schrift
	 * liefert sie oft nur Rauschen.
	 *
	 * @param keepUploadMimeType {@code true}: Tika hat eine Kopie in anderem Format gelesen (HEIF als JPEG), der Typ bleibt
	 */
	private void putTikaFieldValues(Map<String, Object> analysisValuesByFieldName, TikaFileContent tikaFileContent,
			boolean keepUploadMimeType) {
		String mimeType = tikaFileContent.mimeType();
		String text = tikaFileContent.text();
		boolean hasText = text != null && !text.isBlank();
		if (hasText) {
			String trimmedText = Helper.removeBlankLines(text);
			String tikaFileDescriptionFieldName = fileSolrFieldNames.tikaFileDescription();
			analysisValuesByFieldName.put(tikaFileDescriptionFieldName, trimmedText);
			boolean isImage = mimeType != null && mimeType.startsWith("image/");
			if (!isImage) {
				String searchableTextFieldName = fileSolrFieldNames.searchableText();
				analysisValuesByFieldName.put(searchableTextFieldName, trimmedText);
			}
		}
		String mimeTypeFieldName = fileSolrFieldNames.mimeType();
		String imageWidthFieldName = fileSolrFieldNames.imageWidth();
		String imageHeightFieldName = fileSolrFieldNames.imageHeight();
		String capturedAtFieldName = fileSolrFieldNames.capturedAt();
		String cameraModelFieldName = fileSolrFieldNames.cameraModel();
		String gpsLatitudeFieldName = fileSolrFieldNames.gpsLatitude();
		String gpsLongitudeFieldName = fileSolrFieldNames.gpsLongitude();
		Long imageWidth = tikaFileContent.imageWidth();
		Long imageHeight = tikaFileContent.imageHeight();
		Date capturedAt = tikaFileContent.capturedAt();
		String cameraModel = tikaFileContent.cameraModel();
		Double gpsLatitude = tikaFileContent.gpsLatitude();
		Double gpsLongitude = tikaFileContent.gpsLongitude();
		if (!keepUploadMimeType) {
			putIfPresent(analysisValuesByFieldName, mimeTypeFieldName, mimeType);
		}
		putIfPresent(analysisValuesByFieldName, imageWidthFieldName, imageWidth);
		putIfPresent(analysisValuesByFieldName, imageHeightFieldName, imageHeight);
		putIfPresent(analysisValuesByFieldName, capturedAtFieldName, capturedAt);
		putIfPresent(analysisValuesByFieldName, cameraModelFieldName, cameraModel);
		putIfPresent(analysisValuesByFieldName, gpsLatitudeFieldName, gpsLatitude);
		putIfPresent(analysisValuesByFieldName, gpsLongitudeFieldName, gpsLongitude);
	}

	private static void putIfPresent(Map<String, Object> fieldValues, String fieldName, Object fieldValue) {
		if (fieldValue != null) {
			fieldValues.put(fieldName, fieldValue);
		}
	}

	/** Setzt FAILED; scheitert auch das, steht es nur im Log. Die Datei liegt trotzdem sicher auf dem SFTP. */
	private void markFileDocumentAnalysisFailed(String id) {
		try {
			String analysisStatusFieldName = fileSolrFieldNames.analysisStatus();
			String failedStatus = fileConfig.analysisStatusFailed();
			Map<String, Object> failedValues = new LinkedHashMap<>();
			failedValues.put(analysisStatusFieldName, failedStatus);
			fileDocumentWriteService.completeFileDocumentAnalysis(id, failedValues);
		} catch (RuntimeException exception) {
			LOGGER.warn("Auswertung {}: Stand FAILED ließ sich nicht setzen: {}", id, exception.toString());
		}
	}

	private Thread createAnalysisThread(Runnable analysisTask) {
		Thread analysisThread = new Thread(analysisTask, "file-analysis");
		analysisThread.setDaemon(true);
		return analysisThread;
	}
}
