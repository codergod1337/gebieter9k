package de.gebiter.point.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.point.model.PointActivity;
import de.gebiter.point.repository.PointActivityRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Die Tätigkeiten, für die es Punkte gibt (Nutzer 2026-11-09): Pflege durch den Admin (Modul „Achievements &amp;
 * Markt“), Lesen für alle (Stammdaten, Kontoauszug), der Betrag für das Kontobuch. Nutzt nur sein eigenes Repository.
 */
@Service
public class PointActivityService {

	private final PointActivityRepository pointActivityRepository;

	private final String defaultLanguageCode;

	public PointActivityService(PointActivityRepository pointActivityRepository,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.pointActivityRepository = pointActivityRepository;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt eine Tätigkeit am Ende der Liste an.
	 *
	 * @throws IllegalArgumentException wenn Key, Name oder Punkte nicht passen
	 * @throws DuplicateKeyException wenn es den Key schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public PointActivity createPointActivity(String pointActivityKey, Map<String, String> displayName,
			Map<String, String> description, long rewardPoints) {
		Helper.requireValidKey(pointActivityKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		requireValidDescription(description);
		requireValidRewardPoints(rewardPoints);
		boolean pointActivityKeyTaken = pointActivityRepository.existsById(pointActivityKey);
		if (pointActivityKeyTaken) {
			throw new DuplicateKeyException("Die Tätigkeit " + pointActivityKey + " gibt es schon.");
		}
		int newListingPosition = 1;
		Optional<PointActivity> lastPointActivity = pointActivityRepository.findTopByOrderByListingPositionDesc();
		if (lastPointActivity.isPresent()) {
			int lastListingPosition = lastPointActivity.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		PointActivity newPointActivity = new PointActivity(pointActivityKey, displayName, description, rewardPoints,
				newListingPosition);
		return pointActivityRepository.save(newPointActivity);
	}

	/**
	 * CREATE: Legt eine Tätigkeit an, die der Code auslöst, nur wenn sie fehlt (Start-Runner, Werte aus
	 * {@code gebiter.point-activity.*}). Was der Admin danach ändert, bleibt.
	 *
	 * @return {@code true}, wenn sie neu angelegt wurde
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public boolean createMissingPointActivity(String pointActivityKey, String defaultDisplayName, long rewardPoints) {
		boolean pointActivityExists = pointActivityRepository.existsById(pointActivityKey);
		if (pointActivityExists) {
			return false;
		}
		Map<String, String> displayName = Map.of(defaultLanguageCode, defaultDisplayName);
		createPointActivity(pointActivityKey, displayName, null, rewardPoints);
		return true;
	}

	/**
	 * READ: Eine Tätigkeit über ihren Key.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional(readOnly = true)
	public PointActivity getPointActivity(String pointActivityKey) {
		Helper.requireNotNull(pointActivityKey, "pointActivityKey");
		return doGetPointActivity(pointActivityKey);
	}

	/** READ: Alle Tätigkeiten in der Reihenfolge der Anzeige, für jeden angemeldeten User (Stammdaten, Kontoauszug). */
	@Transactional(readOnly = true)
	public List<PointActivity> getAllPointActivity() {
		return pointActivityRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	/**
	 * READ: Wie viele Punkte eine Tätigkeit gerade bringt, für das Kontobuch (dort festgeschrieben, nie rückwirkend).
	 * Eine Tätigkeit, die es nicht gibt, bringt 0.
	 */
	@Transactional(readOnly = true)
	public long getPointActivityRewardPoints(String pointActivityKey) {
		Helper.requireNotNull(pointActivityKey, "pointActivityKey");
		Optional<PointActivity> foundPointActivity = pointActivityRepository.findById(pointActivityKey);
		if (foundPointActivity.isEmpty()) {
			return 0;
		}
		return foundPointActivity.get().getRewardPoints();
	}

	/**
	 * UPDATE: Ändert Name, Beschreibung und Punkte einer Tätigkeit; der Key bestimmt nur, welche. Neue Punkte gelten nur
	 * für künftige Buchungen.
	 *
	 * @throws IllegalArgumentException wenn Name oder Punkte nicht passen
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public PointActivity changePointActivity(PointActivity changedPointActivity) {
		String pointActivityKey = changedPointActivity.getKey();
		Helper.requireNotNull(pointActivityKey, "key");
		Map<String, String> changedDisplayName = changedPointActivity.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);
		Map<String, String> changedDescription = changedPointActivity.getDescription();
		requireValidDescription(changedDescription);
		long changedRewardPoints = changedPointActivity.getRewardPoints();
		requireValidRewardPoints(changedRewardPoints);
		PointActivity existingPointActivity = doGetPointActivity(pointActivityKey);
		existingPointActivity.setDisplayName(changedDisplayName);
		existingPointActivity.setDescription(changedDescription);
		existingPointActivity.setRewardPoints(changedRewardPoints);
		return pointActivityRepository.save(existingPointActivity);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop.
	 *
	 * @throws IllegalArgumentException wenn ein Key fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<PointActivity> changePointActivityListingPositions(List<String> pointActivityKeysInOrder) {
		List<PointActivity> allPointActivities = pointActivityRepository.findAllByOrderByListingPositionAscKeyAsc();
		List<String> existingPointActivityKeys = new ArrayList<>();
		for (PointActivity pointActivity : allPointActivities) {
			String existingPointActivityKey = pointActivity.getKey();
			existingPointActivityKeys.add(existingPointActivityKey);
		}
		Helper.requireCompleteKeyOrder(pointActivityKeysInOrder, existingPointActivityKeys, "keysInOrder");
		for (PointActivity pointActivity : allPointActivities) {
			String pointActivityKey = pointActivity.getKey();
			int newListingPosition = pointActivityKeysInOrder.indexOf(pointActivityKey) + 1;
			pointActivity.setListingPosition(newListingPosition);
		}
		pointActivityRepository.saveAll(allPointActivities);
		return pointActivityRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	/**
	 * DELETE: Löscht eine Tätigkeit. Schon gebuchte Punkte bleiben; eine Tätigkeit, die der Code auslöst, legt der
	 * Start-Runner beim nächsten Start wieder an.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deletePointActivity(String pointActivityKey) {
		Helper.requireNotNull(pointActivityKey, "key");
		PointActivity existingPointActivity = doGetPointActivity(pointActivityKey);
		pointActivityRepository.delete(existingPointActivity);
	}

	private void requireValidDescription(Map<String, String> description) {
		if (description == null) {
			return;
		}
		Helper.requireMultilingualText(description, "description", defaultLanguageCode);
	}

	private void requireValidRewardPoints(long rewardPoints) {
		if (rewardPoints < 0) {
			throw new IllegalArgumentException("Die Punkte einer Tätigkeit dürfen nicht negativ sein.");
		}
	}

	private PointActivity doGetPointActivity(String pointActivityKey) {
		Optional<PointActivity> foundPointActivity = pointActivityRepository.findById(pointActivityKey);
		if (foundPointActivity.isEmpty()) {
			throw new EntityNotFoundException("Die Tätigkeit " + pointActivityKey + " gibt es nicht.");
		}
		return foundPointActivity.get();
	}
}
