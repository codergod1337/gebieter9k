package de.gebiter.achievement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.achievement.dto.UsersAchievementSummary;
import de.gebiter.achievement.service.UsersAchievementService;

/**
 * Die eigenen erreichten Achievements (AR USER oder ADMIN). Die eigene GUID kommt aus dem Token. Angelegt werden sie nie
 * über einen Endpunkt, nur vom Backend beim Prüfen des Protokolls.
 * <p>
 * Doku: {@code docu/entities/UsersAchievement.md}.
 */
@RestController
@RequestMapping("/api/users-achievement")
public class UsersAchievementController {

	private final UsersAchievementService usersAchievementService;

	public UsersAchievementController(UsersAchievementService usersAchievementService) {
		this.usersAchievementService = usersAchievementService;
	}

	/** READ: Die eigenen erreichten Achievements je Achievement: wie oft, erster und letzter Abschluss. */
	@GetMapping
	public ResponseEntity<List<UsersAchievementSummary>> getOwnUsersAchievementSummaries() {
		List<UsersAchievementSummary> ownUsersAchievementSummaries = usersAchievementService
				.getOwnUsersAchievementSummaries();
		return ResponseEntity.ok(ownUsersAchievementSummaries);
	}
}
