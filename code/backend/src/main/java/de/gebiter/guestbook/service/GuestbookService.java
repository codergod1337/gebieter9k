package de.gebiter.guestbook.service;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.guestbook.GuestbookAccessDeniedException;
import de.gebiter.guestbook.dto.GuestbookAuthor;
import de.gebiter.guestbook.dto.GuestbookCommentForClient;
import de.gebiter.guestbook.dto.GuestbookEntryForClient;
import de.gebiter.guestbook.dto.GuestbookPage;
import de.gebiter.guestbook.dto.GuestbookReactionCount;
import de.gebiter.guestbook.model.Guestbook;
import de.gebiter.guestbook.model.GuestbookComment;
import de.gebiter.guestbook.model.GuestbookReaction;
import de.gebiter.guestbook.repository.GuestbookRepository;
import de.gebiter.richtext.service.RichTextService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.model.Users;
import de.gebiter.users.model.UsersDetail;
import de.gebiter.users.service.UsersDetailService;
import de.gebiter.users.service.UsersPointBookingService;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link Guestbook} und die eine Stelle mit allen Rechten des Gästebuchs (Konzept
 * {@code docu/konzept-gaestebuch.md}). Er nutzt nur sein eigenes {@link GuestbookRepository}; Kommentare und Smileys
 * schreibt er über den {@link GuestbookCommentService} und den {@link GuestbookReactionService}, die selbst keine Rechte
 * prüfen. Wer ein Profil sehen darf, sagt der {@link UsersService}, wer fragt, der {@link CurrentUsersProvider}.
 * <p>
 * Die Regeln (Vorgaben des Nutzers 2026-11-09):
 * <ul>
 * <li>Lesen und Schreiben (Einträge, Kommentare, Smileys) darf, wer das Profil sehen darf, dieselbe Regel wie beim
 * Laden des Profils. Sonst sieht es aus, als gäbe es das Gästebuch nicht.</li>
 * <li>Nichts wird geändert, nur gelöscht. Einen Eintrag löschen sein Autor und der Besitzer des Gästebuchs, einen
 * Kommentar sein Autor und der Besitzer des Gästebuchs; ADMIN löscht alles. Mit einem Eintrag gehen seine Kommentare
 * und alle Smileys, mit einem Kommentar seine Smileys.</li>
 * <li>Smileys gehen nur in eine Richtung: je User und Ziel jedes Emoji einmal, kein Zurücknehmen.</li>
 * </ul>
 */
@Service
public class GuestbookService {

	private final GuestbookRepository guestbookRepository;

	private final GuestbookCommentService guestbookCommentService;

	private final GuestbookReactionService guestbookReactionService;

	private final UsersService usersService;

	private final UsersDetailService usersDetailService;

	private final CurrentUsersProvider currentUsersProvider;

	/** So viele Einträge je Seite ({@code gebiter.guestbook.page-size}). */
	private final int pageSize;

	/** Höchstlänge eines Eintrags in Zeichen ({@code gebiter.guestbook.entry-text-max-length}). */
	private final int entryTextMaxLength;

	/** Höchstlänge eines Kommentars in Zeichen ({@code gebiter.guestbook.comment-text-max-length}). */
	private final int commentTextMaxLength;

	private final RichTextService richTextService;

	private final UsersPointBookingService usersPointBookingService;

	/** Die Tätigkeit „Gästebucheintrag geschrieben“ ({@code gebiter.point-activity.guestbook-entry-written.key}). */
	private final String guestbookEntryWrittenPointActivityKey;

	/** Die Tätigkeit „Kommentar geschrieben“ ({@code gebiter.point-activity.guestbook-comment-written.key}). */
	private final String guestbookCommentWrittenPointActivityKey;

	public GuestbookService(GuestbookRepository guestbookRepository, GuestbookCommentService guestbookCommentService,
			GuestbookReactionService guestbookReactionService, UsersService usersService,
			UsersDetailService usersDetailService, CurrentUsersProvider currentUsersProvider,
			RichTextService richTextService, UsersPointBookingService usersPointBookingService,
			@Value("${gebiter.point-activity.guestbook-entry-written.key}") String guestbookEntryWrittenPointActivityKey,
			@Value("${gebiter.point-activity.guestbook-comment-written.key}") String guestbookCommentWrittenPointActivityKey,
			@Value("${gebiter.guestbook.page-size}") int pageSize,
			@Value("${gebiter.guestbook.entry-text-max-length}") int entryTextMaxLength,
			@Value("${gebiter.guestbook.comment-text-max-length}") int commentTextMaxLength) {
		this.guestbookRepository = guestbookRepository;
		this.guestbookCommentService = guestbookCommentService;
		this.guestbookReactionService = guestbookReactionService;
		this.usersService = usersService;
		this.usersDetailService = usersDetailService;
		this.currentUsersProvider = currentUsersProvider;
		this.pageSize = pageSize;
		this.entryTextMaxLength = entryTextMaxLength;
		this.commentTextMaxLength = commentTextMaxLength;
		this.richTextService = richTextService;
		this.usersPointBookingService = usersPointBookingService;
		this.guestbookEntryWrittenPointActivityKey = guestbookEntryWrittenPointActivityKey;
		this.guestbookCommentWrittenPointActivityKey = guestbookCommentWrittenPointActivityKey;
	}

	/**
	 * CREATE: Der angemeldete User schreibt einen Eintrag ins Gästebuch von {@code profileUsersGuid}; zählt seine
	 * geschriebenen Einträge hoch.
	 *
	 * @throws EntityNotFoundException wenn er das Profil nicht sehen darf (dann gibt es das Gästebuch für ihn nicht)
	 * @throws IllegalArgumentException wenn der Text fehlt oder zu lang ist
	 */
	@Transactional
	public Guestbook createOwnGuestbook(UUID profileUsersGuid, Map<String, String> entryText) {
		requireProfileVisible(profileUsersGuid);
		Map<String, String> checkedEntryText = requireRichText(entryText, "Eintrag", entryTextMaxLength);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Guestbook newGuestbook = new Guestbook(profileUsersGuid, currentUsersGuid, checkedEntryText);
		Guestbook savedGuestbook = guestbookRepository.save(newGuestbook);
		usersDetailService.increaseUsersDetailWrittenGuestbookEntryCount(currentUsersGuid);
		// Punkte für die Tätigkeit, in derselben Transaktion: Eintrag und Buchung gibt es nur zusammen
		Long savedGuestbookId = savedGuestbook.getId();
		String guestbookReferenceId = savedGuestbookId.toString();
		Instant bookedAt = Instant.now();
		usersPointBookingService.createActivityRewardBooking(currentUsersGuid, guestbookEntryWrittenPointActivityKey,
				guestbookReferenceId, bookedAt);
		return savedGuestbook;
	}

	/**
	 * READ: Eine Seite des Gästebuchs von {@code profileUsersGuid}, die neuesten Einträge zuerst, mit allem, was die
	 * Darstellung braucht.
	 *
	 * @throws EntityNotFoundException wenn der angemeldete User das Profil nicht sehen darf
	 * @throws IllegalArgumentException wenn die Seite negativ ist
	 */
	@Transactional(readOnly = true)
	public GuestbookPage resolveGuestbookPage(UUID profileUsersGuid, int page) {
		requireProfileVisible(profileUsersGuid);
		if (page < 0) {
			throw new IllegalArgumentException("page darf nicht negativ sein.");
		}
		Pageable pageable = PageRequest.of(page, pageSize);
		Page<Guestbook> guestbookPage = guestbookRepository.findByProfileUsersGuidOrderByWrittenAtDescIdDesc(
				profileUsersGuid, pageable);
		List<Guestbook> guestbooks = guestbookPage.getContent();
		List<Long> guestbookIds = new ArrayList<>();
		for (Guestbook guestbook : guestbooks) {
			Long guestbookId = guestbook.getId();
			guestbookIds.add(guestbookId);
		}
		List<GuestbookComment> guestbookComments = guestbookCommentService.getGuestbookCommentByGuestbookIds(guestbookIds);
		List<GuestbookReaction> guestbookReactions = guestbookReactionService
				.getGuestbookReactionByGuestbookIds(guestbookIds);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		boolean currentUsersOwnsGuestbook = currentUsersGuid.equals(profileUsersGuid);

		Set<UUID> authorUsersGuids = new LinkedHashSet<>();
		List<GuestbookEntryForClient> entries = new ArrayList<>();
		for (Guestbook guestbook : guestbooks) {
			Long guestbookId = guestbook.getId();
			UUID entryAuthorUsersGuid = guestbook.getAuthorUsersGuid();
			authorUsersGuids.add(entryAuthorUsersGuid);
			List<GuestbookCommentForClient> commentsForClient = new ArrayList<>();
			for (GuestbookComment guestbookComment : guestbookComments) {
				Long commentGuestbookId = guestbookComment.getGuestbookId();
				boolean commentOfEntry = commentGuestbookId.equals(guestbookId);
				if (!commentOfEntry) {
					continue;
				}
				UUID commentAuthorUsersGuid = guestbookComment.getAuthorUsersGuid();
				authorUsersGuids.add(commentAuthorUsersGuid);
				Long guestbookCommentId = guestbookComment.getId();
				List<GuestbookReactionCount> commentReactionCounts = countReactions(guestbookReactions, guestbookId,
						guestbookCommentId, currentUsersGuid);
				boolean commentDeletable = currentUsersOwnsGuestbook || currentUsersGuid.equals(commentAuthorUsersGuid);
				Map<String, String> commentText = guestbookComment.getCommentText();
				OffsetDateTime commentWrittenAt = guestbookComment.getWrittenAt();
				GuestbookCommentForClient commentForClient = new GuestbookCommentForClient(guestbookCommentId,
						commentAuthorUsersGuid, commentText, commentWrittenAt, commentReactionCounts, commentDeletable);
				commentsForClient.add(commentForClient);
			}
			List<GuestbookReactionCount> entryReactionCounts = countReactions(guestbookReactions, guestbookId, null,
					currentUsersGuid);
			boolean entryDeletable = currentUsersOwnsGuestbook || currentUsersGuid.equals(entryAuthorUsersGuid);
			Map<String, String> entryText = guestbook.getEntryText();
			OffsetDateTime entryWrittenAt = guestbook.getWrittenAt();
			GuestbookEntryForClient entryForClient = new GuestbookEntryForClient(guestbookId, entryAuthorUsersGuid,
					entryText, entryWrittenAt, entryReactionCounts, commentsForClient, entryDeletable);
			entries.add(entryForClient);
		}
		Map<UUID, GuestbookAuthor> authorsByUsersGuid = new LinkedHashMap<>();
		for (UUID authorUsersGuid : authorUsersGuids) {
			GuestbookAuthor guestbookAuthor = createGuestbookAuthor(authorUsersGuid);
			authorsByUsersGuid.put(authorUsersGuid, guestbookAuthor);
		}
		long totalCount = guestbookPage.getTotalElements();
		return new GuestbookPage(profileUsersGuid, entries, authorsByUsersGuid, totalCount, page, pageSize);
	}

	/**
	 * DELETE: Der angemeldete User löscht einen Eintrag, als sein Autor oder als Besitzer des Gästebuchs; mit ihm gehen
	 * seine Kommentare und alle Smileys.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 * @throws GuestbookAccessDeniedException wenn er weder Autor noch Besitzer ist
	 */
	@Transactional
	public void deleteOwnGuestbook(Long id) {
		Guestbook existingGuestbook = doGetGuestbook(id);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		UUID authorUsersGuid = existingGuestbook.getAuthorUsersGuid();
		UUID profileUsersGuid = existingGuestbook.getProfileUsersGuid();
		boolean author = currentUsersGuid.equals(authorUsersGuid);
		boolean owner = currentUsersGuid.equals(profileUsersGuid);
		if (!author && !owner) {
			throw new GuestbookAccessDeniedException("Löschen darf nur, wer den Eintrag geschrieben hat oder wem das "
					+ "Gästebuch gehört.");
		}
		doDeleteGuestbook(existingGuestbook);
	}

	/**
	 * DELETE (ADMIN): Löscht einen Eintrag in jedem Gästebuch, samt Kommentaren und Smileys.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteGuestbook(Long id) {
		Guestbook existingGuestbook = doGetGuestbook(id);
		doDeleteGuestbook(existingGuestbook);
	}

	/**
	 * CREATE: Der angemeldete User schreibt einen Kommentar unter einen Eintrag.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt oder er das Profil nicht sehen darf
	 * @throws IllegalArgumentException wenn der Text fehlt oder zu lang ist
	 */
	@Transactional
	public GuestbookComment createOwnGuestbookComment(Long guestbookId, Map<String, String> commentText) {
		Guestbook existingGuestbook = doGetVisibleGuestbook(guestbookId);
		Map<String, String> checkedCommentText = requireRichText(commentText, "Kommentar", commentTextMaxLength);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Long existingGuestbookId = existingGuestbook.getId();
		GuestbookComment createdGuestbookComment = guestbookCommentService.createGuestbookComment(existingGuestbookId,
				currentUsersGuid, checkedCommentText);
		// Punkte für die Tätigkeit, in derselben Transaktion: Kommentar und Buchung gibt es nur zusammen
		Long createdGuestbookCommentId = createdGuestbookComment.getId();
		String guestbookCommentReferenceId = createdGuestbookCommentId.toString();
		Instant bookedAt = Instant.now();
		usersPointBookingService.createActivityRewardBooking(currentUsersGuid, guestbookCommentWrittenPointActivityKey,
				guestbookCommentReferenceId, bookedAt);
		return createdGuestbookComment;
	}

	/**
	 * DELETE: Der angemeldete User löscht einen Kommentar, als sein Autor oder als Besitzer des Gästebuchs; mit ihm
	 * gehen seine Smileys.
	 *
	 * @throws EntityNotFoundException wenn es den Kommentar nicht gibt
	 * @throws GuestbookAccessDeniedException wenn er weder Autor noch Besitzer ist
	 */
	@Transactional
	public void deleteOwnGuestbookComment(Long id) {
		Helper.requireNotNull(id, "id");
		GuestbookComment existingGuestbookComment = guestbookCommentService.getGuestbookComment(id);
		Long commentGuestbookId = existingGuestbookComment.getGuestbookId();
		Guestbook existingGuestbook = doGetGuestbook(commentGuestbookId);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		UUID commentAuthorUsersGuid = existingGuestbookComment.getAuthorUsersGuid();
		UUID profileUsersGuid = existingGuestbook.getProfileUsersGuid();
		boolean author = currentUsersGuid.equals(commentAuthorUsersGuid);
		boolean owner = currentUsersGuid.equals(profileUsersGuid);
		if (!author && !owner) {
			throw new GuestbookAccessDeniedException("Löschen darf nur, wer den Kommentar geschrieben hat oder wem das "
					+ "Gästebuch gehört.");
		}
		doDeleteGuestbookComment(id);
	}

	/**
	 * DELETE (ADMIN): Löscht einen Kommentar in jedem Gästebuch, samt Smileys.
	 *
	 * @throws EntityNotFoundException wenn es den Kommentar nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteGuestbookComment(Long id) {
		Helper.requireNotNull(id, "id");
		guestbookCommentService.getGuestbookComment(id);
		doDeleteGuestbookComment(id);
	}

	/**
	 * CREATE: Der angemeldete User hängt einen Smiley an einen Eintrag ({@code guestbookCommentId} {@code null}) oder an
	 * einen seiner Kommentare. Dasselbe Emoji noch einmal an dasselbe Ziel ändert nichts.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag oder Kommentar nicht gibt oder er das Profil nicht sehen darf
	 * @throws IllegalArgumentException wenn es nicht genau ein Emoji ist
	 */
	@Transactional
	public void createOwnGuestbookReaction(Long guestbookId, Long guestbookCommentId, String reactionEmoji) {
		Guestbook existingGuestbook = doGetVisibleGuestbook(guestbookId);
		Long existingGuestbookId = existingGuestbook.getId();
		if (guestbookCommentId != null) {
			GuestbookComment existingGuestbookComment = guestbookCommentService.getGuestbookComment(guestbookCommentId);
			Long commentGuestbookId = existingGuestbookComment.getGuestbookId();
			boolean commentOfEntry = commentGuestbookId.equals(existingGuestbookId);
			if (!commentOfEntry) {
				throw new EntityNotFoundException("Den Kommentar gibt es unter diesem Eintrag nicht.");
			}
		}
		String checkedReactionEmoji = Helper.requireSingleEmoji(reactionEmoji, "reactionEmoji");
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		guestbookReactionService.createGuestbookReaction(existingGuestbookId, guestbookCommentId, currentUsersGuid,
				checkedReactionEmoji);
	}

	/** Der Eintrag mit dieser id, sonst die Absage. */
	private Guestbook doGetGuestbook(Long id) {
		Helper.requireNotNull(id, "id");
		Optional<Guestbook> foundGuestbook = guestbookRepository.findById(id);
		if (foundGuestbook.isEmpty()) {
			throw new EntityNotFoundException("Den Eintrag gibt es nicht.");
		}
		return foundGuestbook.get();
	}

	/** Der Eintrag mit dieser id, nur wenn der angemeldete User das Profil sehen darf; sonst sieht es aus wie „gibt es nicht“. */
	private Guestbook doGetVisibleGuestbook(Long id) {
		Guestbook existingGuestbook = doGetGuestbook(id);
		UUID profileUsersGuid = existingGuestbook.getProfileUsersGuid();
		boolean profileVisible = usersService.isProfileVisibleToCurrentUsers(profileUsersGuid);
		if (!profileVisible) {
			throw new EntityNotFoundException("Den Eintrag gibt es nicht.");
		}
		return existingGuestbook;
	}

	/** Darf der angemeldete User das Profil sehen? Sonst gibt es das Gästebuch für ihn nicht. */
	private void requireProfileVisible(UUID profileUsersGuid) {
		Helper.requireNotNull(profileUsersGuid, "profileUsersGuid");
		boolean profileVisible = usersService.isProfileVisibleToCurrentUsers(profileUsersGuid);
		if (!profileVisible) {
			throw new EntityNotFoundException("Das Gästebuch gibt es nicht.");
		}
	}

	/**
	 * Der Text als bereinigter mehrsprachiger Rich-Text ({@link RichTextService#sanitizeMultilingualRichText}); er muss
	 * Inhalt haben und darf je Sprache höchstens {@code maxPlainTextLength} Zeichen sichtbaren Text haben.
	 */
	private Map<String, String> requireRichText(Map<String, String> richText, String fieldLabel, int maxPlainTextLength) {
		Map<String, String> sanitizedRichText = richTextService.sanitizeMultilingualRichText(richText, fieldLabel,
				maxPlainTextLength);
		if (sanitizedRichText == null) {
			throw new IllegalArgumentException("„" + fieldLabel + "“ darf nicht leer sein.");
		}
		return sanitizedRichText;
	}

	/** Löscht erst alle Smileys, dann die Kommentare, dann den Eintrag. */
	private void doDeleteGuestbook(Guestbook existingGuestbook) {
		Long guestbookId = existingGuestbook.getId();
		guestbookReactionService.deleteGuestbookReactionByGuestbookId(guestbookId);
		guestbookCommentService.deleteGuestbookCommentByGuestbookId(guestbookId);
		guestbookRepository.delete(existingGuestbook);
	}

	/** Löscht erst die Smileys des Kommentars, dann ihn selbst. */
	private void doDeleteGuestbookComment(Long guestbookCommentId) {
		guestbookReactionService.deleteGuestbookReactionByGuestbookCommentId(guestbookCommentId);
		guestbookCommentService.deleteGuestbookComment(guestbookCommentId);
	}

	/**
	 * Die Smileys eines Ziels (Eintrag, wenn {@code guestbookCommentId} {@code null}, sonst der Kommentar) je Emoji
	 * gezählt, in der Reihenfolge ihres ersten Auftretens, dazu ob der angemeldete User das Emoji selbst vergeben hat.
	 */
	private static List<GuestbookReactionCount> countReactions(List<GuestbookReaction> guestbookReactions,
			Long guestbookId, Long guestbookCommentId, UUID currentUsersGuid) {
		Map<String, Long> countByEmoji = new LinkedHashMap<>();
		Set<String> ownEmojis = new LinkedHashSet<>();
		for (GuestbookReaction guestbookReaction : guestbookReactions) {
			Long reactionGuestbookId = guestbookReaction.getGuestbookId();
			boolean sameEntry = reactionGuestbookId.equals(guestbookId);
			Long reactionCommentId = guestbookReaction.getGuestbookCommentId();
			boolean sameTarget;
			if (guestbookCommentId == null) {
				sameTarget = sameEntry && reactionCommentId == null;
			} else {
				sameTarget = guestbookCommentId.equals(reactionCommentId);
			}
			if (!sameTarget) {
				continue;
			}
			String reactionEmoji = guestbookReaction.getReactionEmoji();
			long currentCount = countByEmoji.getOrDefault(reactionEmoji, 0L);
			countByEmoji.put(reactionEmoji, currentCount + 1);
			UUID reactionUsersGuid = guestbookReaction.getUsersGuid();
			boolean ownReaction = currentUsersGuid.equals(reactionUsersGuid);
			if (ownReaction) {
				ownEmojis.add(reactionEmoji);
			}
		}
		List<GuestbookReactionCount> reactionCounts = new ArrayList<>();
		for (Map.Entry<String, Long> countEntry : countByEmoji.entrySet()) {
			String reactionEmoji = countEntry.getKey();
			long emojiCount = countEntry.getValue();
			boolean reactedByCurrentUsers = ownEmojis.contains(reactionEmoji);
			GuestbookReactionCount reactionCount = new GuestbookReactionCount(reactionEmoji, emojiCount,
					reactedByCurrentUsers);
			reactionCounts.add(reactionCount);
		}
		return reactionCounts;
	}

	/**
	 * Username und kleines Profilbild eines Autors; ein gelöschter oder unbekannter User ohne beides. Es gilt die
	 * Sichtbarkeit des Gästebuchs, nicht die des Autors (Nutzer 2026-11-09): Wer in ein Gästebuch schreibt, schreibt dort
	 * öffentlich nach den Regeln dieses Profils und muss damit leben, dass man seine Personalien lesen kann.
	 */
	private GuestbookAuthor createGuestbookAuthor(UUID authorUsersGuid) {
		boolean usersExists = usersService.existsUsers(authorUsersGuid);
		boolean usersDeleted = usersService.isUsersDeleted(authorUsersGuid);
		if (!usersExists || usersDeleted) {
			return new GuestbookAuthor(authorUsersGuid, null, null, null, null);
		}
		Users authorUsers = usersService.getUsers(authorUsersGuid);
		UsersDetail authorUsersDetail = usersDetailService.getUsersDetail(authorUsersGuid);
		// Das kleine Profilbild: Eine Seite trägt jeden Autor einmal, große Bilder würden sie schwer machen
		String profileImageSmallBase64Png = authorUsersDetail.getProfileImageSmallBase64Png();
		String avatarTextColor = authorUsersDetail.getAvatarTextColor();
		String avatarBackgroundColor = authorUsersDetail.getAvatarBackgroundColor();
		String authorUsername = authorUsers.getUsername();
		return new GuestbookAuthor(authorUsersGuid, authorUsername, profileImageSmallBase64Png, avatarTextColor,
				avatarBackgroundColor);
	}
}
