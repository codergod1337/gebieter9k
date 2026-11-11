package de.gebiter.achievement.service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import de.gebiter.achievement.dto.OnlinePresence;
import de.gebiter.achievement.dto.OnlineUsersCount;
import de.gebiter.achievement.dto.UsersOnlineStatus;
import de.gebiter.achievement.model.AchievementTracking;
import de.gebiter.achievement.model.AchievementTrackingKey;
import de.gebiter.achievement.repository.AchievementTrackingRepository;
import de.gebiter.security.dto.UsersOnlineCheckInEvent;
import de.gebiter.security.dto.UsersSessionEndedEvent;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;

/**
 * Das Protokoll für Achievements ({@code achievement_tracking}, Nutzer 2026-11-09) und die Anwesenheit der User. Jede
 * neue Zeile ist der einzige Anlass, Achievements zu prüfen ({@link UsersAchievementService}). Bisher eine Art: die
 * Online-Zeit am Stück.
 * <p>
 * <b>Online-Zeit und Anwesenheit, gemessen nur auf dem Server.</b> Ein Check-in ist jeder Login und jede
 * Token-Verlängerung ({@link UsersOnlineCheckInEvent}, Zeit von der Uhr des Servers), je Sitzung gemerkt. Das Frontend
 * verlängert alle {@code gebiter.jwt.renewal-interval} (15 Minuten); was der Browser dabei glaubt, zählt nicht. Je
 * Check-in, für alle Tabs, Browser und Geräte eines Users zusammen:
 * <ul>
 * <li>Ein Login ohne andere aktive Sitzung, oder mehr als {@code max-gap} ohne Spur des Users: neue Serie, Zeile mit 0,
 * „online seit“ ab jetzt.</li>
 * <li>Ist die letzte Buchung jünger als {@code min-interval}, wird nichts gebucht, nur die Spur gemerkt (F5, weitere
 * Tabs und Browser, Skripte): So gibt es höchstens eine Buchung je Viertelstunde.</li>
 * <li>Sonst: Buchung der echten Sekunden seit der letzten Buchung, Kontrollcounter steigt, Achievements prüfen.</li>
 * </ul>
 * Online ist, wer in einer Sitzung einen Check-in in den letzten {@code max-gap} hatte. Abmelden ({@link
 * UsersSessionEndedEvent}) nimmt die Sitzung sofort heraus; war es die letzte, ist er sofort offline. Mehr als die
 * tatsächlich verstrichene Zeit lässt sich so nie buchen. Alles läuft nacheinander (ein Schloss), damit zwei gleichzeitige
 * Verlängerungen zweier Geräte nicht beide buchen. Nach einem Neustart liest der erste Zugriff die Anwesenheit aus den
 * jüngsten Zeilen des Protokolls zurück.
 */
@Service
public class AchievementTrackingService {

	private static final Logger LOGGER = LoggerFactory.getLogger(AchievementTrackingService.class);

	private final AchievementTrackingRepository achievementTrackingRepository;

	private final UsersAchievementService usersAchievementService;

	private final UsersService usersService;

	/** Eigene Transaktion je Buchung: Die Sitzung ist da schon gespeichert und scheitert nie an einem Achievement. */
	private final TransactionTemplate trackingTransactionTemplate;

	/** Früher als das nach der letzten Buchung wird nicht gebucht ({@code gebiter.achievement.online-presence.min-interval}). */
	private final Duration onlinePresenceMinInterval;

	/** Länger ohne Spur heißt weg ({@code gebiter.achievement.online-presence.max-gap}); zugleich die Grenze für „online“. */
	private final Duration onlinePresenceMaxGap;

	/** Die Anwesenheit je User, nur im Speicher: je Sitzung der letzte Check-in und „online seit“. */
	private final Map<UUID, OnlinePresence> onlinePresenceByUsersGuid = new ConcurrentHashMap<>();

	/** Ob die Anwesenheit nach dem Start schon aus dem Protokoll zurückgelesen ist. */
	private volatile boolean onlinePresenceRestored;

	/** Ein Schritt nach dem anderen, samt Commit: Buchen, Abmelden, Zurücklesen. */
	private final ReentrantLock onlinePresenceLock = new ReentrantLock();

	public AchievementTrackingService(AchievementTrackingRepository achievementTrackingRepository,
			UsersAchievementService usersAchievementService, UsersService usersService,
			PlatformTransactionManager transactionManager,
			@Value("${gebiter.achievement.online-presence.min-interval}") Duration onlinePresenceMinInterval,
			@Value("${gebiter.achievement.online-presence.max-gap}") Duration onlinePresenceMaxGap) {
		this.achievementTrackingRepository = achievementTrackingRepository;
		this.usersAchievementService = usersAchievementService;
		this.usersService = usersService;
		TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
		transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
		this.trackingTransactionTemplate = transactionTemplate;
		this.onlinePresenceMinInterval = onlinePresenceMinInterval;
		this.onlinePresenceMaxGap = onlinePresenceMaxGap;
	}

	/**
	 * CREATE: Bucht einen Check-in als Online-Zeit und Anwesenheit, nach dem Commit von Login oder Verlängerung. Ein
	 * Fehler hier landet nur im Log: Die Sitzung ist schon vergeben.
	 */
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void createOnlinePresenceTracking(UsersOnlineCheckInEvent usersOnlineCheckInEvent) {
		UUID usersGuid = usersOnlineCheckInEvent.usersGuid();
		int sessionNumber = usersOnlineCheckInEvent.sessionNumber();
		Instant checkedInAt = usersOnlineCheckInEvent.checkedInAt();
		boolean login = usersOnlineCheckInEvent.login();
		onlinePresenceLock.lock();
		try {
			trackingTransactionTemplate.executeWithoutResult(transactionStatus -> {
				doRestoreOnlinePresenceOnce(checkedInAt);
				doCreateOnlinePresenceTracking(usersGuid, sessionNumber, checkedInAt, login);
			});
		} catch (RuntimeException exception) {
			LOGGER.warn("Online-Zeit von {} nicht gebucht", usersGuid, exception);
		} finally {
			onlinePresenceLock.unlock();
		}
	}

	/**
	 * DELETE: Nimmt eine abgemeldete Sitzung aus der Anwesenheit, nach dem Commit des Logouts. War es die letzte aktive,
	 * ist der User sofort offline; die nächste Anmeldung beginnt eine neue Serie.
	 */
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void deleteOnlinePresenceSession(UsersSessionEndedEvent usersSessionEndedEvent) {
		UUID usersGuid = usersSessionEndedEvent.usersGuid();
		int sessionNumber = usersSessionEndedEvent.sessionNumber();
		onlinePresenceLock.lock();
		try {
			OnlinePresence previousPresence = onlinePresenceByUsersGuid.get(usersGuid);
			if (previousPresence == null) {
				return;
			}
			Map<Integer, Instant> remainingCheckIns = new HashMap<>(previousPresence.lastCheckInAtBySessionNumber());
			remainingCheckIns.remove(sessionNumber);
			// Eine zurückgelesene Sitzung ohne Nummer ist wahrscheinlich genau diese: Sie fällt mit weg
			if (remainingCheckIns.isEmpty()) {
				onlinePresenceByUsersGuid.remove(usersGuid);
				LOGGER.info("{} abgemeldet: offline", usersGuid);
				return;
			}
			OnlinePresence remainingPresence = new OnlinePresence(Map.copyOf(remainingCheckIns), null,
					previousPresence.onlineSince());
			onlinePresenceByUsersGuid.put(usersGuid, remainingPresence);
		} finally {
			onlinePresenceLock.unlock();
		}
	}

	/** READ: Wie viele User gerade online sind (Check-in in einer Sitzung in den letzten {@code max-gap}). Für den Header. */
	public OnlineUsersCount getOnlineUsersCount() {
		Instant now = Instant.now();
		doRestoreOnlinePresenceWithLock(now);
		long onlineUsersCount = 0;
		for (OnlinePresence onlinePresence : onlinePresenceByUsersGuid.values()) {
			if (doIsActive(onlinePresence, now)) {
				onlineUsersCount++;
			}
		}
		return new OnlineUsersCount(onlineUsersCount);
	}

	/**
	 * READ: Ob ein User gerade online ist und seit wann, für sein Profil. Nur wenn der angemeldete User das Profil sehen
	 * darf; sonst „offline“, damit nichts durchsickert. Kein „zuletzt online“ (Nutzer 2026-11-09).
	 */
	public UsersOnlineStatus getVisibleUsersOnlineStatus(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		boolean profileVisible = usersService.isProfileVisibleToCurrentUsers(usersGuid);
		UsersOnlineStatus offlineStatus = new UsersOnlineStatus(false, null);
		if (!profileVisible) {
			return offlineStatus;
		}
		Instant now = Instant.now();
		doRestoreOnlinePresenceWithLock(now);
		OnlinePresence onlinePresence = onlinePresenceByUsersGuid.get(usersGuid);
		if (onlinePresence == null || !doIsActive(onlinePresence, now)) {
			return offlineStatus;
		}
		Instant onlineSince = onlinePresence.onlineSince();
		return new UsersOnlineStatus(true, onlineSince);
	}

	private void doCreateOnlinePresenceTracking(UUID usersGuid, int sessionNumber, Instant checkedInAt, boolean login) {
		OnlinePresence previousPresence = onlinePresenceByUsersGuid.get(usersGuid);
		Instant lastActiveCheckInAt = doGetLastActiveCheckInAt(previousPresence, checkedInAt);
		Map<Integer, Instant> activeCheckIns = doGetActiveCheckIns(previousPresence, checkedInAt);
		activeCheckIns.put(sessionNumber, checkedInAt);

		AchievementTrackingKey onlinePresence = AchievementTrackingKey.ONLINE_PRESENCE;
		Optional<AchievementTracking> foundLastBooking = achievementTrackingRepository
				.findFirstByUsersGuidAndTrackingKeyOrderByOccurredAtDescIdDesc(usersGuid, onlinePresence);
		boolean loginWithoutOtherActiveSession = login && lastActiveCheckInAt == null;
		if (foundLastBooking.isEmpty() || loginWithoutOtherActiveSession) {
			doCreateOnlinePresenceSeriesStart(usersGuid, checkedInAt, activeCheckIns);
			return;
		}
		AchievementTracking lastBooking = foundLastBooking.get();
		Instant lastBookedAt = lastBooking.getOccurredAt();
		// Die jüngste Spur: die letzte Buchung oder ein späterer Check-in, der nicht gebucht wurde (anderes Gerät, F5)
		Instant lastTraceAt = lastBookedAt;
		if (lastActiveCheckInAt != null && lastActiveCheckInAt.isAfter(lastBookedAt)) {
			lastTraceAt = lastActiveCheckInAt;
		}
		Duration gapSinceLastTrace = Duration.between(lastTraceAt, checkedInAt);
		if (gapSinceLastTrace.compareTo(onlinePresenceMaxGap) > 0) {
			doCreateOnlinePresenceSeriesStart(usersGuid, checkedInAt, activeCheckIns);
			return;
		}
		Instant onlineSince = doGetOnlineSince(previousPresence, usersGuid, checkedInAt);
		OnlinePresence currentPresence = new OnlinePresence(Map.copyOf(activeCheckIns), null, onlineSince);
		onlinePresenceByUsersGuid.put(usersGuid, currentPresence);

		Duration elapsedSinceLastBooking = Duration.between(lastBookedAt, checkedInAt);
		if (elapsedSinceLastBooking.compareTo(onlinePresenceMinInterval) < 0) {
			return;
		}
		long elapsedSeconds = elapsedSinceLastBooking.toSeconds();
		long lastRunningValue = lastBooking.getRunningValue();
		long newRunningValue = lastRunningValue + elapsedSeconds;
		AchievementTracking newBooking = new AchievementTracking(usersGuid, onlinePresence, elapsedSeconds,
				newRunningValue, checkedInAt);
		AchievementTracking savedBooking = achievementTrackingRepository.save(newBooking);
		usersAchievementService.createReachedUsersAchievements(savedBooking);
	}

	/** Beginn einer Serie: eine Zeile mit 0, ab der die nächste Buchung misst; „online seit“ ab jetzt. */
	private void doCreateOnlinePresenceSeriesStart(UUID usersGuid, Instant checkedInAt,
			Map<Integer, Instant> activeCheckIns) {
		AchievementTracking seriesStart = new AchievementTracking(usersGuid, AchievementTrackingKey.ONLINE_PRESENCE, 0,
				0, checkedInAt);
		achievementTrackingRepository.save(seriesStart);
		OnlinePresence startedPresence = new OnlinePresence(Map.copyOf(activeCheckIns), null, checkedInAt);
		onlinePresenceByUsersGuid.put(usersGuid, startedPresence);
	}

	/** „Online seit“ der laufenden Serie: aus dem Speicher, sonst der jüngste Serienbeginn im Protokoll. */
	private Instant doGetOnlineSince(OnlinePresence previousPresence, UUID usersGuid, Instant checkedInAt) {
		if (previousPresence != null && previousPresence.onlineSince() != null) {
			return previousPresence.onlineSince();
		}
		Optional<AchievementTracking> foundSeriesStart = achievementTrackingRepository
				.findFirstByUsersGuidAndTrackingKeyAndAmountOrderByOccurredAtDescIdDesc(usersGuid,
						AchievementTrackingKey.ONLINE_PRESENCE, 0);
		if (foundSeriesStart.isEmpty()) {
			return checkedInAt;
		}
		return foundSeriesStart.get().getOccurredAt();
	}

	/**
	 * Die Check-ins der Sitzungen, die noch als aktiv gelten (höchstens {@code max-gap} alt); veraltete fallen weg. Ohne
	 * die zurückgelesene Spur: Die zählt {@link #doGetLastActiveCheckInAt} extra.
	 */
	private Map<Integer, Instant> doGetActiveCheckIns(OnlinePresence onlinePresence, Instant now) {
		Map<Integer, Instant> activeCheckIns = new HashMap<>();
		if (onlinePresence == null) {
			return activeCheckIns;
		}
		for (Map.Entry<Integer, Instant> checkIn : onlinePresence.lastCheckInAtBySessionNumber().entrySet()) {
			Duration checkInAge = Duration.between(checkIn.getValue(), now);
			if (checkInAge.compareTo(onlinePresenceMaxGap) <= 0) {
				activeCheckIns.put(checkIn.getKey(), checkIn.getValue());
			}
		}
		return activeCheckIns;
	}

	/** Der jüngste Check-in einer noch aktiven Sitzung oder die zurückgelesene Spur, {@code null} wenn nichts aktiv ist. */
	private Instant doGetLastActiveCheckInAt(OnlinePresence onlinePresence, Instant now) {
		Map<Integer, Instant> activeCheckIns = doGetActiveCheckIns(onlinePresence, now);
		Instant lastActiveCheckInAt = null;
		if (onlinePresence != null && onlinePresence.restoredCheckInAt() != null) {
			Duration restoredCheckInAge = Duration.between(onlinePresence.restoredCheckInAt(), now);
			if (restoredCheckInAge.compareTo(onlinePresenceMaxGap) <= 0) {
				lastActiveCheckInAt = onlinePresence.restoredCheckInAt();
			}
		}
		for (Instant checkInAt : activeCheckIns.values()) {
			if (lastActiveCheckInAt == null || checkInAt.isAfter(lastActiveCheckInAt)) {
				lastActiveCheckInAt = checkInAt;
			}
		}
		return lastActiveCheckInAt;
	}

	private boolean doIsActive(OnlinePresence onlinePresence, Instant now) {
		Instant lastActiveCheckInAt = doGetLastActiveCheckInAt(onlinePresence, now);
		return lastActiveCheckInAt != null;
	}

	/** Zurücklesen für Lesezugriffe: mit Schloss und eigener Transaktion, nur beim ersten Mal. */
	private void doRestoreOnlinePresenceWithLock(Instant now) {
		if (onlinePresenceRestored) {
			return;
		}
		onlinePresenceLock.lock();
		try {
			trackingTransactionTemplate.executeWithoutResult(transactionStatus -> doRestoreOnlinePresenceOnce(now));
		} finally {
			onlinePresenceLock.unlock();
		}
	}

	/**
	 * Nach einem Neustart: Wer in den letzten {@code max-gap} eine Zeile im Protokoll hat, gilt als da, mit dem letzten
	 * Zeitpunkt als Check-in einer unbekannten Sitzung und dem jüngsten Serienbeginn als „online seit“. Nur einmal.
	 */
	private void doRestoreOnlinePresenceOnce(Instant now) {
		if (onlinePresenceRestored) {
			return;
		}
		Instant restoreFrom = now.minus(onlinePresenceMaxGap);
		AchievementTrackingKey onlinePresence = AchievementTrackingKey.ONLINE_PRESENCE;
		List<AchievementTracking> recentRows = achievementTrackingRepository
				.findByTrackingKeyAndOccurredAtAfter(onlinePresence, restoreFrom);
		Set<UUID> recentUsersGuids = new LinkedHashSet<>();
		for (AchievementTracking recentRow : recentRows) {
			UUID recentUsersGuid = recentRow.getUsersGuid();
			recentUsersGuids.add(recentUsersGuid);
		}
		for (UUID recentUsersGuid : recentUsersGuids) {
			if (onlinePresenceByUsersGuid.containsKey(recentUsersGuid)) {
				continue;
			}
			Optional<AchievementTracking> foundLastRow = achievementTrackingRepository
					.findFirstByUsersGuidAndTrackingKeyOrderByOccurredAtDescIdDesc(recentUsersGuid, onlinePresence);
			if (foundLastRow.isEmpty()) {
				continue;
			}
			Instant lastRowAt = foundLastRow.get().getOccurredAt();
			Instant onlineSince = doGetOnlineSince(null, recentUsersGuid, lastRowAt);
			OnlinePresence restoredPresence = new OnlinePresence(Map.of(), lastRowAt, onlineSince);
			onlinePresenceByUsersGuid.put(recentUsersGuid, restoredPresence);
		}
		onlinePresenceRestored = true;
		LOGGER.info("Anwesenheit zurückgelesen: {} User", recentUsersGuids.size());
	}
}
