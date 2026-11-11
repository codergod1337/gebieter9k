package de.gebiter.achievement.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.achievement.dto.UsersAchievementSummary;
import de.gebiter.achievement.model.Achievement;
import de.gebiter.achievement.model.AchievementTracking;
import de.gebiter.achievement.model.AchievementTrackingKey;
import de.gebiter.achievement.model.UsersAchievement;
import de.gebiter.achievement.repository.UsersAchievementRepository;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.service.UsersPointBookingService;
import de.gebiter.util.Helper;

/**
 * Die erreichten Achievements der User (Nutzer 2026-11-09): wer, welches, wann. Prüft jede neue Zeile im Protokoll gegen
 * die Achievements ihrer Art, trägt Abschlüsse ein und bucht ihre Punkte ins Kontobuch, je Abschluss eine Buchung mit
 * Bezug auf ihn. Nutzt nur sein eigenes Repository, die Achievements und das Kontobuch über deren Services.
 */
@Service
public class UsersAchievementService {

	private static final Logger LOGGER = LoggerFactory.getLogger(UsersAchievementService.class);

	private final UsersAchievementRepository usersAchievementRepository;

	private final AchievementService achievementService;

	private final UsersPointBookingService usersPointBookingService;

	private final CurrentUsersProvider currentUsersProvider;

	public UsersAchievementService(UsersAchievementRepository usersAchievementRepository,
			AchievementService achievementService, UsersPointBookingService usersPointBookingService,
			CurrentUsersProvider currentUsersProvider) {
		this.usersAchievementRepository = usersAchievementRepository;
		this.achievementService = achievementService;
		this.usersPointBookingService = usersPointBookingService;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE: Prüft eine neue Protokollzeile gegen die Achievements ihrer Art, aus dem Speicher, ohne Zählen über das
	 * Protokoll. Erreicht ist eine Schwelle, wenn der Kontrollcounter sie mit dieser Zeile überschreitet: von
	 * {@code runningValue - amount} auf {@code runningValue}. Wiederholbare: jedes neu erreichte Vielfache ist ein
	 * Abschluss; einmalige: nur, wenn der User es noch nicht hat. Je Abschluss eine Zeile und die Punkte aufs Konto.
	 * Aufgerufen nur vom Backend, in der Transaktion der Buchung.
	 */
	@Transactional
	public void createReachedUsersAchievements(AchievementTracking newAchievementTracking) {
		Helper.requireNotNull(newAchievementTracking, "newAchievementTracking");
		AchievementTrackingKey trackingKey = newAchievementTracking.getTrackingKey();
		long newRunningValue = newAchievementTracking.getRunningValue();
		long amount = newAchievementTracking.getAmount();
		long previousRunningValue = newRunningValue - amount;
		List<Achievement> trackedAchievements = achievementService.getTrackedAchievements(trackingKey);
		for (Achievement trackedAchievement : trackedAchievements) {
			long reachedCount = doCountReachedCompletions(trackedAchievement, newAchievementTracking,
					previousRunningValue, newRunningValue);
			if (reachedCount > 0) {
				doCreateUsersAchievements(trackedAchievement, newAchievementTracking, reachedCount);
			}
		}
	}

	/** READ: Die eigenen erreichten Achievements je Achievement zusammengefasst (wie oft, erster und letzter Abschluss). */
	@Transactional(readOnly = true)
	public List<UsersAchievementSummary> getOwnUsersAchievementSummaries() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		return usersAchievementRepository.findUsersAchievementSummariesByUsersGuid(currentUsersGuid);
	}

	/** Wie viele Abschlüsse diese Zeile bringt: wiederholbar jedes neue Vielfache, einmalig höchstens einen. */
	private long doCountReachedCompletions(Achievement trackedAchievement, AchievementTracking newAchievementTracking,
			long previousRunningValue, long newRunningValue) {
		long thresholdValue = trackedAchievement.getThresholdValue();
		if (trackedAchievement.isRepeatable()) {
			long previousCompletions = Math.floorDiv(previousRunningValue, thresholdValue);
			long newCompletions = Math.floorDiv(newRunningValue, thresholdValue);
			return Math.max(0, newCompletions - previousCompletions);
		}
		boolean thresholdCrossed = previousRunningValue < thresholdValue && newRunningValue >= thresholdValue;
		if (!thresholdCrossed) {
			return 0;
		}
		UUID usersGuid = newAchievementTracking.getUsersGuid();
		String achievementKey = trackedAchievement.getKey();
		boolean alreadyAchieved = usersAchievementRepository.existsByUsersGuidAndAchievementKey(usersGuid,
				achievementKey);
		if (alreadyAchieved) {
			return 0;
		}
		return 1;
	}

	private void doCreateUsersAchievements(Achievement trackedAchievement, AchievementTracking newAchievementTracking,
			long reachedCount) {
		UUID usersGuid = newAchievementTracking.getUsersGuid();
		String achievementKey = trackedAchievement.getKey();
		Instant achievedAt = newAchievementTracking.getOccurredAt();
		Long achievementTrackingId = newAchievementTracking.getId();
		long rewardPoints = trackedAchievement.getRewardPoints();
		for (long completionNumber = 1; completionNumber <= reachedCount; completionNumber++) {
			UsersAchievement newUsersAchievement = new UsersAchievement(usersGuid, achievementKey, achievedAt,
					achievementTrackingId);
			UsersAchievement savedUsersAchievement = usersAchievementRepository.save(newUsersAchievement);
			if (rewardPoints > 0) {
				Long usersAchievementId = savedUsersAchievement.getId();
				usersPointBookingService.createAchievementRewardBooking(usersGuid, rewardPoints, achievementKey,
						usersAchievementId, achievedAt);
			}
		}
		LOGGER.info("Achievement {} erreicht von {}: {}× je {} Punkte", achievementKey, usersGuid, reachedCount,
				rewardPoints);
	}
}
