package de.gebiter.achievement.service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import de.gebiter.achievement.model.Achievement;
import de.gebiter.achievement.model.AchievementTrackingKey;
import de.gebiter.achievement.repository.AchievementRepository;
import de.gebiter.badge.model.BadgeLook;
import de.gebiter.badge.service.BadgeLookService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link Achievement}. Er nutzt nur sein eigenes {@link AchievementRepository}, das Aussehen prüft
 * der {@link BadgeLookService}. Vorerst verwaltet nur der Admin die Achievements; noch hängt nichts an einem, deshalb
 * lässt es sich ohne Zirkel löschen.
 */
@Service
public class AchievementService {

	private final AchievementRepository achievementRepository;

	private final BadgeLookService badgeLookService;

	/** In dieser Sprache muss jeder Anzeigename Text haben ({@code gebiter.language.default-code}). */
	private final String defaultLanguageCode;

	/** Die Achievements mit Bedingung je Tracking-Art, im Speicher; {@code null}: beim nächsten Bedarf neu laden. */
	private volatile Map<AchievementTrackingKey, List<Achievement>> trackedAchievementsByTrackingKey;

	public AchievementService(AchievementRepository achievementRepository, BadgeLookService badgeLookService,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.achievementRepository = achievementRepository;
		this.badgeLookService = badgeLookService;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt ein Achievement am Ende der Liste an. Beschreibung und Aussehen dürfen fehlen.
	 *
	 * @throws IllegalArgumentException wenn der Key die Key-Regel verletzt, Name oder (falls angegeben) Beschreibung in
	 *         der Pflichtsprache fehlen oder das Aussehen ungültig ist
	 * @throws DuplicateKeyException wenn es den Key schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public Achievement createAchievement(String achievementKey, Map<String, String> displayName,
			Map<String, String> description, BadgeLook badgeLook, AchievementTrackingKey trackingKey,
			Long thresholdValue, boolean repeatable, long rewardPoints) {
		Helper.requireValidKey(achievementKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		requireValidDescription(description);
		BadgeLook validBadgeLook = badgeLookService.requireValidBadgeLook(badgeLook);
		requireValidTracking(trackingKey, thresholdValue, rewardPoints);
		// Ohne diese Prüfung würde save() ein bestehendes Achievement still überschreiben.
		boolean achievementKeyTaken = achievementRepository.existsById(achievementKey);
		if (achievementKeyTaken) {
			throw new DuplicateKeyException("Das Achievement " + achievementKey + " gibt es schon.");
		}
		int newListingPosition = 1;
		Optional<Achievement> lastAchievement = achievementRepository.findTopByOrderByListingPositionDesc();
		if (lastAchievement.isPresent()) {
			int lastListingPosition = lastAchievement.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		Achievement newAchievement = new Achievement(achievementKey, displayName, description, newListingPosition,
				validBadgeLook, trackingKey, thresholdValue, repeatable, rewardPoints);
		Achievement savedAchievement = achievementRepository.save(newAchievement);
		forgetTrackedAchievementsAfterCommit();
		return savedAchievement;
	}

	/**
	 * READ: Ein Achievement über seinen Key.
	 *
	 * @throws EntityNotFoundException wenn es das Achievement nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional(readOnly = true)
	public Achievement getAchievement(String achievementKey) {
		Helper.requireNotNull(achievementKey, "achievementKey");
		return doGetAchievement(achievementKey);
	}

	/**
	 * READ: Alle Achievements in der Reihenfolge der Anzeige, für jeden angemeldeten User (Stammdaten, Box im Profil): Was
	 * man tun muss, steht ohnehin in der Beschreibung.
	 */
	@Transactional(readOnly = true)
	public List<Achievement> getAllAchievement() {
		return achievementRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	/**
	 * UPDATE: Ändert ein Achievement. Der Key bestimmt nur, welches; übernommen werden Name, Beschreibung, Aussehen und
	 * die Bedingung (Tracking-Art, Schwelle, wiederholbar, Punkte). Schon erreichte Abschlüsse bleiben.
	 *
	 * @throws IllegalArgumentException wenn der Key oder der Name in der Pflichtsprache fehlt oder die Beschreibung bzw.
	 *         das Aussehen ungültig ist
	 * @throws EntityNotFoundException wenn es das Achievement nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public Achievement changeAchievement(Achievement changedAchievement) {
		String achievementKey = changedAchievement.getKey();
		Helper.requireNotNull(achievementKey, "key");
		Map<String, String> changedDisplayName = changedAchievement.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);
		Map<String, String> changedDescription = changedAchievement.getDescription();
		requireValidDescription(changedDescription);
		BadgeLook enteredBadgeLook = changedAchievement.getBadgeLook();
		BadgeLook changedBadgeLook = badgeLookService.requireValidBadgeLook(enteredBadgeLook);
		AchievementTrackingKey changedTrackingKey = changedAchievement.getTrackingKey();
		Long changedThresholdValue = changedAchievement.getThresholdValue();
		boolean changedRepeatable = changedAchievement.isRepeatable();
		long changedRewardPoints = changedAchievement.getRewardPoints();
		requireValidTracking(changedTrackingKey, changedThresholdValue, changedRewardPoints);

		Achievement existingAchievement = doGetAchievement(achievementKey);
		existingAchievement.setDisplayName(changedDisplayName);
		existingAchievement.setDescription(changedDescription);
		existingAchievement.setBadgeLook(changedBadgeLook);
		existingAchievement.setTrackingKey(changedTrackingKey);
		existingAchievement.setThresholdValue(changedThresholdValue);
		existingAchievement.setRepeatable(changedRepeatable);
		existingAchievement.setRewardPoints(changedRewardPoints);
		Achievement savedAchievement = achievementRepository.save(existingAchievement);
		forgetTrackedAchievementsAfterCommit();
		return savedAchievement;
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop. Der erste Key bekommt Platz 1, der nächste 2 usw.
	 *
	 * @param achievementKeysInOrder jeder Key genau einmal, von oben nach unten
	 * @return alle Achievements in der neuen Reihenfolge
	 * @throws IllegalArgumentException wenn ein Key fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<Achievement> changeAchievementListingPositions(List<String> achievementKeysInOrder) {
		List<Achievement> allAchievements = achievementRepository.findAllByOrderByListingPositionAscKeyAsc();
		List<String> existingAchievementKeys = new ArrayList<>();
		for (Achievement achievement : allAchievements) {
			String existingAchievementKey = achievement.getKey();
			existingAchievementKeys.add(existingAchievementKey);
		}
		Helper.requireCompleteKeyOrder(achievementKeysInOrder, existingAchievementKeys, "keysInOrder");
		for (Achievement achievement : allAchievements) {
			String achievementKey = achievement.getKey();
			int newListingPosition = achievementKeysInOrder.indexOf(achievementKey) + 1;
			// verwaltet in dieser Transaktion: Hibernate schreibt die Änderung beim Commit (Dirty Checking)
			achievement.setListingPosition(newListingPosition);
		}
		achievementRepository.saveAll(allAchievements);
		return achievementRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	/**
	 * DELETE: Löscht ein Achievement.
	 *
	 * @throws EntityNotFoundException wenn es das Achievement nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteAchievement(String achievementKey) {
		Helper.requireNotNull(achievementKey, "key");
		Achievement existingAchievement = doGetAchievement(achievementKey);
		achievementRepository.delete(existingAchievement);
		forgetTrackedAchievementsAfterCommit();
	}

	/**
	 * READ: Die Achievements, die an einer Tracking-Art hängen, aus dem Speicher; geladen beim ersten Bedarf und nach
	 * jeder Änderung neu. Aufgerufen bei jeder neuen Protokollzeile ({@code UsersAchievementService}), deshalb ohne
	 * Datenbankzugriff, sobald geladen.
	 */
	@Transactional(readOnly = true)
	public List<Achievement> getTrackedAchievements(AchievementTrackingKey trackingKey) {
		Helper.requireNotNull(trackingKey, "trackingKey");
		Map<AchievementTrackingKey, List<Achievement>> currentTrackedAchievements = trackedAchievementsByTrackingKey;
		if (currentTrackedAchievements == null) {
			currentTrackedAchievements = doLoadTrackedAchievements();
			trackedAchievementsByTrackingKey = currentTrackedAchievements;
		}
		List<Achievement> trackedAchievements = currentTrackedAchievements.get(trackingKey);
		if (trackedAchievements == null) {
			return List.of();
		}
		return trackedAchievements;
	}

	/**
	 * Eine Bedingung braucht beides oder nichts: Tracking-Art und Schwelle ab 1. Punkte ab 0.
	 *
	 * @throws IllegalArgumentException wenn nicht
	 */
	private void requireValidTracking(AchievementTrackingKey trackingKey, Long thresholdValue, long rewardPoints) {
		if (rewardPoints < 0) {
			throw new IllegalArgumentException("Die Punkte je Abschluss dürfen nicht negativ sein.");
		}
		if (trackingKey == null) {
			if (thresholdValue != null) {
				throw new IllegalArgumentException("Eine Schwelle braucht eine Tracking-Art.");
			}
			return;
		}
		if (thresholdValue == null || thresholdValue < 1) {
			throw new IllegalArgumentException("Mit Tracking-Art braucht das Achievement eine Schwelle ab 1.");
		}
	}

	/** Nach dem Commit vergessen, damit die nächste Prüfung den gespeicherten Stand lädt (nie einen halben). */
	private void forgetTrackedAchievementsAfterCommit() {
		boolean transactionActive = TransactionSynchronizationManager.isSynchronizationActive();
		if (!transactionActive) {
			trackedAchievementsByTrackingKey = null;
			return;
		}
		TransactionSynchronization forgetAfterCommit = new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				trackedAchievementsByTrackingKey = null;
			}
		};
		TransactionSynchronizationManager.registerSynchronization(forgetAfterCommit);
	}

	private Map<AchievementTrackingKey, List<Achievement>> doLoadTrackedAchievements() {
		List<Achievement> allAchievements = achievementRepository.findAllByOrderByListingPositionAscKeyAsc();
		Map<AchievementTrackingKey, List<Achievement>> loadedTrackedAchievements = new EnumMap<>(
				AchievementTrackingKey.class);
		for (Achievement achievement : allAchievements) {
			AchievementTrackingKey achievementTrackingKey = achievement.getTrackingKey();
			if (achievementTrackingKey == null) {
				continue;
			}
			List<Achievement> achievementsOfTrackingKey = loadedTrackedAchievements.computeIfAbsent(
					achievementTrackingKey, unusedTrackingKey -> new ArrayList<>());
			achievementsOfTrackingKey.add(achievement);
		}
		return loadedTrackedAchievements;
	}

	/** Eine Beschreibung darf fehlen; ist sie da, braucht sie Text in der Pflichtsprache. */
	private void requireValidDescription(Map<String, String> description) {
		if (description == null) {
			return;
		}
		Helper.requireMultilingualText(description, "description", defaultLanguageCode);
	}

	private Achievement doGetAchievement(String achievementKey) {
		Optional<Achievement> foundAchievement = achievementRepository.findById(achievementKey);
		if (foundAchievement.isEmpty()) {
			throw new EntityNotFoundException("Das Achievement " + achievementKey + " gibt es nicht.");
		}
		return foundAchievement.get();
	}
}
