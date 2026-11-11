package de.gebiter.achievement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.achievement.model.Achievement;
import de.gebiter.achievement.service.AchievementService;

/**
 * Endpunkte der Klasse {@link Achievement} für jeden angemeldeten User: nur die Liste, z. B. für die Stammdaten des
 * Frontends und die Box im Profil. Die Verwaltung steht im {@link AchievementAdminController}.
 * <p>
 * Doku: {@code docu/entities/Achievement.md}.
 */
@RestController
@RequestMapping("/api/achievement")
public class AchievementController {

	private final AchievementService achievementService;

	public AchievementController(AchievementService achievementService) {
		this.achievementService = achievementService;
	}

	/** READ: Alle Achievements in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<Achievement>> getAllAchievement() {
		List<Achievement> allAchievement = achievementService.getAllAchievement();
		return ResponseEntity.ok(allAchievement);
	}
}
