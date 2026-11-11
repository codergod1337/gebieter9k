package de.gebiter.file.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.FileConfig;
import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.dto.FileCheerState;
import de.gebiter.file.dto.FileCheerUsersPage;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.file.dto.FileDocumentFinallyDeletedEvent;
import de.gebiter.file.model.FileCheer;
import de.gebiter.file.model.FileCheerDirection;
import de.gebiter.file.repository.FileCheerRepository;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Stimmen zu Dateien ({@link FileCheer}): begeistert (cheerUp) und angewidert (cheerDown). Er nutzt nur sein
 * eigenes {@link FileCheerRepository}; die Datei selbst liest und ändert er über die File-Services.
 * <p>
 * Die Regeln (Nutzer 2026-11-11):
 * <ul>
 * <li>Stimmen darf, wer die Datei lesen darf, auch ihr Autor. Eine Datei, die er nicht lesen darf, sieht aus wie „gibt es
 * nicht“.</li>
 * <li>Je User und Datei eine Stimme. Wer in die andere Richtung stimmt, wechselt; die eigene Stimme lässt sich
 * zurücknehmen.</li>
 * <li>Die Stimmen sind nicht anonym: Wer die Datei lesen darf, sieht, wer zuletzt wie gestimmt hat.</li>
 * <li>Die Stimmen haben mit dem Suchen und Auflösen von Dateien nichts zu tun: Dateien kommen sofort aus Solr, die
 * Stimmen lädt die Oberfläche danach getrennt, je Datei eine kleine Antwort. Nie alle User: nur die Zahlen und die
 * neuesten {@code gebiter.file.cheer-shown-users-max} je Richtung. Alle User einer Richtung gibt es nur auf Wunsch
 * („Alle laden“), seitenweise ({@link #resolveFileCheerUsersGuids}).</li>
 * </ul>
 * Die Zähler {@code cheerUpCount} und {@code cheerDownCount} im Solr-Dokument (zum Sortieren) zählt er nach jeder Stimme
 * aus der Tabelle neu und schreibt beide; so laufen Tabelle und Dokument nie auseinander. Wird eine Datei endgültig
 * gelöscht, gehen ihre Stimmen mit ({@link FileDocumentFinallyDeletedEvent}).
 */
@Service
public class FileCheerService {

	private final FileCheerRepository fileCheerRepository;

	private final FileDocumentResolveService fileDocumentResolveService;

	private final FileDocumentWriteService fileDocumentWriteService;

	private final FileSolrFieldNames fileSolrFieldNames;

	private final FileConfig fileConfig;

	private final CurrentUsersProvider currentUsersProvider;

	public FileCheerService(FileCheerRepository fileCheerRepository,
			FileDocumentResolveService fileDocumentResolveService, FileDocumentWriteService fileDocumentWriteService,
			FileSolrFieldNames fileSolrFieldNames, FileConfig fileConfig, CurrentUsersProvider currentUsersProvider) {
		this.fileCheerRepository = fileCheerRepository;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.fileDocumentWriteService = fileDocumentWriteService;
		this.fileSolrFieldNames = fileSolrFieldNames;
		this.fileConfig = fileConfig;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE: Der angemeldete User stimmt für eine Datei, begeistert oder angewidert. Hat er schon gestimmt, ersetzt die
	 * neue Stimme die alte (aus begeistert wird angewidert und umgekehrt); dieselbe Richtung noch einmal ändert nichts.
	 * Danach stehen die neuen Zähler im Solr-Dokument. Liefert den Stand der Stimmen danach.
	 *
	 * @throws IllegalArgumentException wenn die id oder die Richtung fehlt
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	@Transactional
	public FileCheerState createOwnFileCheer(String fileDocumentId, FileCheerDirection direction) {
		Helper.requireNotNull(direction, "direction");
		String readableFileDocumentId = requireReadableFileDocumentId(fileDocumentId);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		OffsetDateTime now = OffsetDateTime.now();
		Optional<FileCheer> foundFileCheer = fileCheerRepository.findByFileDocumentIdAndUsersGuid(
				readableFileDocumentId, currentUsersGuid);
		if (foundFileCheer.isEmpty()) {
			FileCheer newFileCheer = new FileCheer(readableFileDocumentId, currentUsersGuid, direction, now);
			fileCheerRepository.save(newFileCheer);
		} else {
			FileCheer existingFileCheer = foundFileCheer.get();
			FileCheerDirection previousDirection = existingFileCheer.getDirection();
			boolean directionChanged = previousDirection != direction;
			if (directionChanged) {
				existingFileCheer.setDirection(direction);
				existingFileCheer.setCheeredAt(now);
				fileCheerRepository.save(existingFileCheer);
			}
		}
		doWriteFileCheerCounts(readableFileDocumentId);
		return doGetFileCheerState(readableFileDocumentId);
	}

	/**
	 * READ: Der Stand der Stimmen zu einer Datei: beide Zahlen, wer zuletzt wie gestimmt hat und die Stimme des
	 * angemeldeten Users. Die Oberfläche lädt das getrennt vom Dokument, nachdem die Datei schon angezeigt ist (die Seite
	 * einer Datei, jede Bildkachel einer Galerie); erst danach zeigt sie die beiden Smileys zum Abstimmen.
	 *
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	@Transactional(readOnly = true)
	public FileCheerState getFileCheerState(String fileDocumentId) {
		String readableFileDocumentId = requireReadableFileDocumentId(fileDocumentId);
		return doGetFileCheerState(readableFileDocumentId);
	}

	/**
	 * READ (Auflösen): Eine Seite der User, die in einer Richtung für eine Datei gestimmt haben, der neueste zuerst,
	 * {@code gebiter.file.cheer-users-page-size} je Seite. Für „Alle laden“ in der Sprechblase der Stimmen: Die
	 * Oberfläche holt eine Seite nach der anderen, bis alle da sind. Beispiel: 5000 Stimmen „begeistert“ sind 50 Seiten
	 * zu je 100 GUIDs.
	 *
	 * @throws IllegalArgumentException wenn die Richtung fehlt oder die Seite negativ ist
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	@Transactional(readOnly = true)
	public FileCheerUsersPage resolveFileCheerUsersGuids(String fileDocumentId, FileCheerDirection direction, int page) {
		Helper.requireNotNull(direction, "direction");
		if (page < 0) {
			throw new IllegalArgumentException("page darf nicht negativ sein.");
		}
		String readableFileDocumentId = requireReadableFileDocumentId(fileDocumentId);
		int cheerUsersPageSize = fileConfig.cheerUsersPageSize();
		Pageable usersPage = PageRequest.of(page, cheerUsersPageSize);
		List<UUID> usersGuids = doGetCheerUsersGuids(readableFileDocumentId, direction, usersPage);
		long totalCount = fileCheerRepository.countByFileDocumentIdAndDirection(readableFileDocumentId, direction);
		return new FileCheerUsersPage(readableFileDocumentId, direction, usersGuids, totalCount, page, cheerUsersPageSize);
	}

	/**
	 * DELETE: Der angemeldete User nimmt seine Stimme zu einer Datei zurück. Hat er nicht gestimmt, passiert nichts.
	 * Danach stehen die neuen Zähler im Solr-Dokument. Liefert den Stand der Stimmen danach.
	 *
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	@Transactional
	public FileCheerState deleteOwnFileCheer(String fileDocumentId) {
		String readableFileDocumentId = requireReadableFileDocumentId(fileDocumentId);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Optional<FileCheer> foundFileCheer = fileCheerRepository.findByFileDocumentIdAndUsersGuid(
				readableFileDocumentId, currentUsersGuid);
		if (foundFileCheer.isPresent()) {
			FileCheer existingFileCheer = foundFileCheer.get();
			fileCheerRepository.delete(existingFileCheer);
			doWriteFileCheerCounts(readableFileDocumentId);
		}
		return doGetFileCheerState(readableFileDocumentId);
	}

	/**
	 * Eine Datei wurde endgültig gelöscht ({@link FileDocumentFinallyDeletedEvent}): Ihre Stimmen gehen mit. Die Rechte
	 * hat das Löschen schon geprüft (nur ADMIN).
	 */
	@EventListener
	@Transactional
	void deleteFileCheersOfFinallyDeletedFileDocument(FileDocumentFinallyDeletedEvent finallyDeletedEvent) {
		String deletedFileDocumentId = finallyDeletedEvent.fileDocumentId();
		fileCheerRepository.deleteAllByFileDocumentId(deletedFileDocumentId);
	}

	/**
	 * Die geprüfte id der Datei, nur wenn der angemeldete User sie lesen darf (derselbe Lesefilter wie überall, aus
	 * Solr). Gelesen werden nur die wenigen Fakten der Datei, nicht ihr ganzes Dokument.
	 *
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	private String requireReadableFileDocumentId(String fileDocumentId) {
		String sha256Hex = Helper.requireSha256Hex(fileDocumentId);
		FileDocumentBackendFacts readableFileDocumentBackendFacts = fileDocumentResolveService
				.resolveReadableFileDocumentBackendFacts(sha256Hex);
		if (readableFileDocumentBackendFacts == null) {
			throw new EntityNotFoundException("Die Datei gibt es nicht.");
		}
		return sha256Hex;
	}

	/**
	 * Der Stand der Stimmen zu einer Datei aus der Tabelle: beide Zahlen, je Richtung die neuesten User und die eigene
	 * Stimme. Fünf kleine Abfragen, egal wie viele Stimmen die Datei hat.
	 */
	private FileCheerState doGetFileCheerState(String fileDocumentId) {
		long cheerUpCount = fileCheerRepository.countByFileDocumentIdAndDirection(fileDocumentId, FileCheerDirection.UP);
		long cheerDownCount = fileCheerRepository.countByFileDocumentIdAndDirection(fileDocumentId,
				FileCheerDirection.DOWN);
		List<UUID> cheerUpUsersGuids = doGetNewestCheerUsersGuids(fileDocumentId, FileCheerDirection.UP);
		List<UUID> cheerDownUsersGuids = doGetNewestCheerUsersGuids(fileDocumentId, FileCheerDirection.DOWN);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Optional<FileCheer> foundOwnFileCheer = fileCheerRepository.findByFileDocumentIdAndUsersGuid(fileDocumentId,
				currentUsersGuid);
		FileCheerDirection directionOfCurrentUsers = null;
		if (foundOwnFileCheer.isPresent()) {
			FileCheer ownFileCheer = foundOwnFileCheer.get();
			directionOfCurrentUsers = ownFileCheer.getDirection();
		}
		return new FileCheerState(fileDocumentId, cheerUpCount, cheerDownCount, cheerUpUsersGuids, cheerDownUsersGuids,
				directionOfCurrentUsers);
	}

	/** Die User, die zuletzt in dieser Richtung gestimmt haben, der neueste zuerst, höchstens so viele wie eingestellt. */
	private List<UUID> doGetNewestCheerUsersGuids(String fileDocumentId, FileCheerDirection direction) {
		int cheerShownUsersMax = fileConfig.cheerShownUsersMax();
		Pageable newestUsersPage = PageRequest.of(0, cheerShownUsersMax);
		return doGetCheerUsersGuids(fileDocumentId, direction, newestUsersPage);
	}

	/** Die User einer Seite der Stimmen einer Richtung, der neueste zuerst. */
	private List<UUID> doGetCheerUsersGuids(String fileDocumentId, FileCheerDirection direction, Pageable usersPage) {
		List<FileCheer> fileCheersOfPage = fileCheerRepository
				.findByFileDocumentIdAndDirectionOrderByCheeredAtDescIdDesc(fileDocumentId, direction, usersPage);
		List<UUID> cheerUsersGuids = new ArrayList<>();
		for (FileCheer fileCheer : fileCheersOfPage) {
			UUID cheerUsersGuid = fileCheer.getUsersGuid();
			cheerUsersGuids.add(cheerUsersGuid);
		}
		return cheerUsersGuids;
	}

	/** Zählt die Stimmen der Datei neu und schreibt beide Zähler ins Solr-Dokument. */
	private void doWriteFileCheerCounts(String fileDocumentId) {
		long cheerUpCount = fileCheerRepository.countByFileDocumentIdAndDirection(fileDocumentId, FileCheerDirection.UP);
		long cheerDownCount = fileCheerRepository.countByFileDocumentIdAndDirection(fileDocumentId,
				FileCheerDirection.DOWN);
		String cheerUpCountFieldName = fileSolrFieldNames.cheerUpCount();
		String cheerDownCountFieldName = fileSolrFieldNames.cheerDownCount();
		Map<String, Object> cheerCountFieldValues = new LinkedHashMap<>();
		cheerCountFieldValues.put(cheerUpCountFieldName, cheerUpCount);
		cheerCountFieldValues.put(cheerDownCountFieldName, cheerDownCount);
		fileDocumentWriteService.changeFileDocumentBackendFieldValues(fileDocumentId, cheerCountFieldValues);
	}
}
