package de.gebiter.file.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.FileAccessDeniedException;
import de.gebiter.file.FileConfig;
import de.gebiter.file.dto.FileCommentCount;
import de.gebiter.file.dto.FileCommentForClient;
import de.gebiter.file.dto.FileCommentThread;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.file.dto.FileDocumentFinallyDeletedEvent;
import de.gebiter.file.model.FileComment;
import de.gebiter.file.repository.FileCommentRepository;
import de.gebiter.richtext.service.RichTextService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.dto.UsersAvatarForClient;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Kommentare zu Dateien ({@link FileComment}, Nutzer 2026-11-20). Er nutzt nur sein eigenes
 * {@link FileCommentRepository}; die Datei selbst liest er über den {@link FileDocumentResolveService}, die Autoren
 * über den {@link UsersService}.
 * <p>
 * Die Regeln:
 * <ul>
 * <li>Kommentieren und die Kommentare lesen darf, wer die Datei lesen darf, auch ihr Autor. Eine Datei, die er nicht
 * lesen darf, sieht aus wie „gibt es nicht“.</li>
 * <li>Ein Kommentar wird nie geändert, nur gelöscht: von seinem Autor oder vom Autor der Datei.</li>
 * <li>Die Kommentare haben mit dem Suchen und Auflösen von Dateien nichts zu tun (wie die Stimmen): Die Kacheln kommen
 * sofort aus Solr, die Zahl der Kommentare lädt jede Kachel danach selbst nach ({@link #getFileCommentCount}), den
 * Verlauf erst, wer ihn öffnet ({@link #getFileCommentThread}).</li>
 * <li>Ein Besucher über den Link einer Galerie-Freigabe liest mit, schreibt aber nicht. Dass er die Datei sehen darf,
 * prüft der {@code GalleryShareVisitorService} (gültiger Token, das Bild gehört zur Freigabe); für ihn gibt es die
 * Methoden ohne Rechteprüfung ({@link #getFileCommentThreadForGalleryShare},
 * {@link #resolveFileCommentCountsForGalleryShare}).</li>
 * </ul>
 * Wird eine Datei endgültig gelöscht, gehen ihre Kommentare mit ({@link FileDocumentFinallyDeletedEvent}).
 */
@Service
public class FileCommentService {

	private final FileCommentRepository fileCommentRepository;

	private final FileDocumentResolveService fileDocumentResolveService;

	private final UsersService usersService;

	private final RichTextService richTextService;

	private final FileConfig fileConfig;

	private final CurrentUsersProvider currentUsersProvider;

	public FileCommentService(FileCommentRepository fileCommentRepository,
			FileDocumentResolveService fileDocumentResolveService, UsersService usersService,
			RichTextService richTextService, FileConfig fileConfig, CurrentUsersProvider currentUsersProvider) {
		this.fileCommentRepository = fileCommentRepository;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.usersService = usersService;
		this.richTextService = richTextService;
		this.fileConfig = fileConfig;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE: Der angemeldete User kommentiert eine Datei, die er lesen darf. Liefert den Verlauf der Kommentare danach,
	 * die Seite braucht also keine zweite Anfrage.
	 *
	 * @param commentText der Kommentar als mehrsprachiger Rich-Text; er wird bereinigt wie jeder Rich-Text
	 * @throws IllegalArgumentException wenn die id fehlt, der Text fehlt oder zu lang ist
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	@Transactional
	public FileCommentThread createOwnFileComment(String fileDocumentId, Map<String, String> commentText) {
		FileDocumentBackendFacts readableFileBackendFacts = requireReadableFileDocumentBackendFacts(fileDocumentId);
		String readableFileDocumentId = Helper.requireSha256Hex(fileDocumentId);
		int commentTextMaxLength = fileConfig.commentTextMaxLength();
		Map<String, String> checkedCommentText = richTextService.sanitizeMultilingualRichText(commentText, "Kommentar",
				commentTextMaxLength);
		if (checkedCommentText == null) {
			throw new IllegalArgumentException("„Kommentar“ darf nicht leer sein.");
		}
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		FileComment newFileComment = new FileComment(readableFileDocumentId, currentUsersGuid, checkedCommentText);
		fileCommentRepository.save(newFileComment);
		String fileAuthorUsersGuid = readableFileBackendFacts.authorUsersGuid();
		return doGetFileCommentThread(readableFileDocumentId, fileAuthorUsersGuid);
	}

	/**
	 * READ: Der Verlauf der Kommentare einer Datei, die ältesten zuerst, dazu jeder Autor einmal. Die Oberfläche lädt ihn
	 * erst, wenn jemand die Kommentare öffnet (am großen Bild, auf der Seite der Datei).
	 *
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	@Transactional(readOnly = true)
	public FileCommentThread getFileCommentThread(String fileDocumentId) {
		FileDocumentBackendFacts readableFileBackendFacts = requireReadableFileDocumentBackendFacts(fileDocumentId);
		String readableFileDocumentId = Helper.requireSha256Hex(fileDocumentId);
		String fileAuthorUsersGuid = readableFileBackendFacts.authorUsersGuid();
		return doGetFileCommentThread(readableFileDocumentId, fileAuthorUsersGuid);
	}

	/**
	 * READ: Wie viele Kommentare eine Datei hat, für die Sprechblase an ihrer Kachel. Die Kachel steht schon da und lädt
	 * die Zahl danach selbst nach, eine kleine Antwort je Datei.
	 *
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	@Transactional(readOnly = true)
	public FileCommentCount getFileCommentCount(String fileDocumentId) {
		requireReadableFileDocumentBackendFacts(fileDocumentId);
		String readableFileDocumentId = Helper.requireSha256Hex(fileDocumentId);
		long commentCount = fileCommentRepository.countByFileDocumentId(readableFileDocumentId);
		return new FileCommentCount(readableFileDocumentId, commentCount);
	}

	/**
	 * READ (Backend, Besucher): Der Verlauf der Kommentare eines Bildes einer Galerie-Freigabe. Ohne Rechteprüfung und
	 * ohne angemeldeten User: Dass der Besucher das Bild sehen darf, hat der Aufrufer geprüft (der
	 * {@code GalleryShareVisitorService}: gültiger Token, das Bild gehört zur Freigabe). Löschen kann hier niemand.
	 */
	@Transactional(readOnly = true)
	public FileCommentThread getFileCommentThreadForGalleryShare(String fileDocumentId) {
		String sha256Hex = Helper.requireSha256Hex(fileDocumentId);
		String noFileAuthorUsersGuid = null;
		return doGetFileCommentThread(sha256Hex, noFileAuthorUsersGuid);
	}

	/**
	 * READ (Backend, Besucher): Die Zahl der Kommentare für die Bilder einer Seite einer Galerie-Freigabe, in EINER
	 * Abfrage. Ohne Rechteprüfung: Die Bilder hat der Aufrufer gerade selbst für diese Freigabe aufgelöst (der
	 * {@code GalleryShareVisitorService}).
	 *
	 * @return id der Datei → Zahl ihrer Kommentare; eine Datei ohne Kommentar fehlt
	 */
	@Transactional(readOnly = true)
	public Map<String, Long> resolveFileCommentCountsForGalleryShare(Collection<String> fileDocumentIds) {
		Helper.requireNotNull(fileDocumentIds, "fileDocumentIds");
		Map<String, Long> commentCountsByFileDocumentId = new HashMap<>();
		if (fileDocumentIds.isEmpty()) {
			return commentCountsByFileDocumentId;
		}
		List<FileCommentCount> fileCommentCounts = fileCommentRepository.countByFileDocumentIds(fileDocumentIds);
		for (FileCommentCount fileCommentCount : fileCommentCounts) {
			String fileDocumentId = fileCommentCount.fileDocumentId();
			long commentCount = fileCommentCount.commentCount();
			commentCountsByFileDocumentId.put(fileDocumentId, commentCount);
		}
		return commentCountsByFileDocumentId;
	}

	/**
	 * DELETE: Der angemeldete User löscht einen Kommentar, als sein Autor oder als Autor der Datei. Liefert den Verlauf
	 * der Kommentare danach.
	 *
	 * @throws EntityNotFoundException wenn es den Kommentar nicht gibt oder er die Datei nicht lesen darf
	 * @throws FileAccessDeniedException wenn er weder den Kommentar noch die Datei geschrieben hat
	 */
	@Transactional
	public FileCommentThread deleteOwnFileComment(Long id) {
		Helper.requireNotNull(id, "id");
		Optional<FileComment> foundFileComment = fileCommentRepository.findById(id);
		if (foundFileComment.isEmpty()) {
			throw new EntityNotFoundException("Den Kommentar gibt es nicht.");
		}
		FileComment existingFileComment = foundFileComment.get();
		String fileDocumentId = existingFileComment.getFileDocumentId();
		FileDocumentBackendFacts readableFileBackendFacts = requireReadableFileDocumentBackendFacts(fileDocumentId);
		String fileAuthorUsersGuid = readableFileBackendFacts.authorUsersGuid();
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		boolean deletable = isDeletableBy(existingFileComment, currentUsersGuid, fileAuthorUsersGuid);
		if (!deletable) {
			throw new FileAccessDeniedException(
					"Löschen darf nur, wer den Kommentar geschrieben hat oder wem die Datei gehört.");
		}
		fileCommentRepository.delete(existingFileComment);
		return doGetFileCommentThread(fileDocumentId, fileAuthorUsersGuid);
	}

	/**
	 * Eine Datei wurde endgültig gelöscht ({@link FileDocumentFinallyDeletedEvent}): Ihre Kommentare gehen mit. Die Rechte
	 * hat das Löschen schon geprüft (nur ADMIN).
	 */
	@EventListener
	@Transactional
	void deleteFileCommentsOfFinallyDeletedFileDocument(FileDocumentFinallyDeletedEvent finallyDeletedEvent) {
		String deletedFileDocumentId = finallyDeletedEvent.fileDocumentId();
		fileCommentRepository.deleteAllByFileDocumentId(deletedFileDocumentId);
	}

	/**
	 * Die Fakten der Datei, nur wenn der angemeldete User sie lesen darf; sonst sieht es aus wie „gibt es nicht“.
	 *
	 * @throws IllegalArgumentException wenn die id kein SHA-256 ist
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt oder er sie nicht lesen darf
	 */
	private FileDocumentBackendFacts requireReadableFileDocumentBackendFacts(String fileDocumentId) {
		String sha256Hex = Helper.requireSha256Hex(fileDocumentId);
		FileDocumentBackendFacts readableFileDocumentBackendFacts = fileDocumentResolveService
				.resolveReadableFileDocumentBackendFacts(sha256Hex);
		if (readableFileDocumentBackendFacts == null) {
			throw new EntityNotFoundException("Die Datei gibt es nicht.");
		}
		return readableFileDocumentBackendFacts;
	}

	/**
	 * Der Verlauf der Kommentare einer Datei aus der Tabelle, ohne Rechteprüfung: die Kommentare, die ältesten zuerst,
	 * und jeder Autor einmal, nach der Sichtbarkeit seines Profils für den Betrachter.
	 *
	 * @param fileAuthorUsersGuid die GUID des Autors der Datei (er darf jeden Kommentar löschen); {@code null}, wenn
	 *        niemand löschen kann (Besucher)
	 */
	private FileCommentThread doGetFileCommentThread(String fileDocumentId, String fileAuthorUsersGuid) {
		List<FileComment> fileComments = fileCommentRepository.findByFileDocumentIdOrderByWrittenAtAscIdAsc(
				fileDocumentId);
		UUID currentUsersGuid = null;
		boolean authenticated = currentUsersProvider.isAuthenticated();
		if (authenticated) {
			currentUsersGuid = currentUsersProvider.currentUsersGuid();
		}
		List<FileCommentForClient> commentsForClient = new ArrayList<>();
		Set<UUID> authorUsersGuids = new LinkedHashSet<>();
		for (FileComment fileComment : fileComments) {
			Long id = fileComment.getId();
			UUID authorUsersGuid = fileComment.getAuthorUsersGuid();
			Map<String, String> commentText = fileComment.getCommentText();
			OffsetDateTime writtenAt = fileComment.getWrittenAt();
			boolean deletableByCurrentUsers = isDeletableBy(fileComment, currentUsersGuid, fileAuthorUsersGuid);
			FileCommentForClient commentForClient = new FileCommentForClient(id, authorUsersGuid, commentText, writtenAt,
					deletableByCurrentUsers);
			commentsForClient.add(commentForClient);
			authorUsersGuids.add(authorUsersGuid);
		}
		List<UsersAvatarForClient> authors = new ArrayList<>();
		for (UUID authorUsersGuid : authorUsersGuids) {
			UsersAvatarForClient author = usersService.getUsersAvatarForClient(authorUsersGuid);
			authors.add(author);
		}
		return new FileCommentThread(fileDocumentId, commentsForClient, authors);
	}

	/**
	 * Darf dieser User den Kommentar löschen? Der Autor des Kommentars und der Autor der Datei. Ohne User (Besucher) nie.
	 */
	private static boolean isDeletableBy(FileComment fileComment, UUID usersGuid, String fileAuthorUsersGuid) {
		if (usersGuid == null) {
			return false;
		}
		UUID commentAuthorUsersGuid = fileComment.getAuthorUsersGuid();
		boolean commentAuthor = usersGuid.equals(commentAuthorUsersGuid);
		String usersGuidText = usersGuid.toString();
		boolean fileAuthor = usersGuidText.equals(fileAuthorUsersGuid);
		return commentAuthor || fileAuthor;
	}
}
