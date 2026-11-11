package de.gebiter.achievement.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.achievement.model.Achievement;
import de.gebiter.achievement.model.AchievementTrackingKey;
import de.gebiter.achievement.service.AchievementService;
import de.gebiter.badge.model.BadgeLook;
import de.gebiter.util.dto.ListingOrder;

/**
 * Admin-Endpunkte der Klasse {@link Achievement}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den
 * {@link AchievementService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/Achievement.md}.
 */
@RestController
@RequestMapping("/api/admin/achievement")
public class AchievementAdminController {

	private final AchievementService achievementService;

	public AchievementAdminController(AchievementService achievementService) {
		this.achievementService = achievementService;
	}

	/**
	 * CREATE: Legt ein Achievement an. Body: {@code {"key": "ONLINE_STUNDE", "displayName": {"de": "Eine Stunde online"},
	 * "description": {…}, "badgeLook": {…}, "trackingKey": "ONLINE_PRESENCE", "thresholdValue": 3600, "repeatable":
	 * true, "rewardPoints": 10}}.
	 */
	@PostMapping
	public ResponseEntity<Achievement> createAchievement(@RequestBody Achievement newAchievement) {
		String requestedAchievementKey = newAchievement.getKey();
		Map<String, String> requestedDisplayName = newAchievement.getDisplayName();
		Map<String, String> requestedDescription = newAchievement.getDescription();
		BadgeLook requestedBadgeLook = newAchievement.getBadgeLook();
		AchievementTrackingKey requestedTrackingKey = newAchievement.getTrackingKey();
		Long requestedThresholdValue = newAchievement.getThresholdValue();
		boolean requestedRepeatable = newAchievement.isRepeatable();
		long requestedRewardPoints = newAchievement.getRewardPoints();
		Achievement createdAchievement = achievementService.createAchievement(requestedAchievementKey,
				requestedDisplayName, requestedDescription, requestedBadgeLook, requestedTrackingKey,
				requestedThresholdValue, requestedRepeatable, requestedRewardPoints);

		String createdAchievementKey = createdAchievement.getKey();
		String createdAchievementPath = "/api/admin/achievement/" + createdAchievementKey;
		URI createdAchievementLocation = URI.create(createdAchievementPath);
		return ResponseEntity.created(createdAchievementLocation).body(createdAchievement);
	}

	/** READ: Ein Achievement über seinen Key. */
	@GetMapping("/{achievementKey}")
	public ResponseEntity<Achievement> getAchievement(@PathVariable String achievementKey) {
		Achievement foundAchievement = achievementService.getAchievement(achievementKey);
		return ResponseEntity.ok(foundAchievement);
	}

	/** READ: Alle Achievements in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<Achievement>> getAllAchievement() {
		List<Achievement> allAchievement = achievementService.getAllAchievement();
		return ResponseEntity.ok(allAchievement);
	}

	/**
	 * UPDATE: Ändert ein Achievement. Body: das volle Objekt, maßgeblich ist {@code key}, geändert werden Name,
	 * Beschreibung und Aussehen.
	 */
	@PutMapping
	public ResponseEntity<Achievement> changeAchievement(@RequestBody Achievement changedAchievement) {
		Achievement savedAchievement = achievementService.changeAchievement(changedAchievement);
		return ResponseEntity.ok(savedAchievement);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop. Body: {@code {"keysInOrder": ["KNIPSER", "KNIPSGOTT"]}}, jeder
	 * Key genau einmal. Zurück kommen alle Achievements in neuer Reihenfolge.
	 */
	@PutMapping("/listing-position")
	public ResponseEntity<List<Achievement>> changeAchievementListingPositions(@RequestBody ListingOrder listingOrder) {
		List<String> achievementKeysInOrder = listingOrder.keysInOrder();
		List<Achievement> allAchievements = achievementService.changeAchievementListingPositions(achievementKeysInOrder);
		return ResponseEntity.ok(allAchievements);
	}

	/** DELETE: Löscht ein Achievement. Im Body reicht {@code {"key": "…"}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteAchievement(@RequestBody Achievement achievementToDelete) {
		String achievementKey = achievementToDelete.getKey();
		achievementService.deleteAchievement(achievementKey);
		return ResponseEntity.noContent().build();
	}
}
