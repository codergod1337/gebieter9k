package de.gebiter.achievement.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.achievement.dto.OnlineUsersCount;
import de.gebiter.achievement.dto.UsersOnlineStatus;
import de.gebiter.achievement.service.AchievementTrackingService;

/**
 * Wer gerade online ist (AR USER oder ADMIN), aus der Anwesenheit des {@link AchievementTrackingService}: die Zahl für
 * den Header und „online seit“ für ein Profil. Kein „zuletzt online“ (Nutzer 2026-11-09).
 * <p>
 * Doku: {@code docu/entities/Users.md}.
 */
@RestController
@RequestMapping("/api/users-online")
public class UsersOnlineController {

	private final AchievementTrackingService achievementTrackingService;

	public UsersOnlineController(AchievementTrackingService achievementTrackingService) {
		this.achievementTrackingService = achievementTrackingService;
	}

	/** READ: Wie viele User gerade online sind. */
	@GetMapping("/count")
	public ResponseEntity<OnlineUsersCount> getOnlineUsersCount() {
		OnlineUsersCount onlineUsersCount = achievementTrackingService.getOnlineUsersCount();
		return ResponseEntity.ok(onlineUsersCount);
	}

	/** READ: Ob ein User gerade online ist und seit wann; nur bei einem Profil, das man sehen darf. */
	@GetMapping("/{usersGuid}")
	public ResponseEntity<UsersOnlineStatus> getVisibleUsersOnlineStatus(@PathVariable UUID usersGuid) {
		UsersOnlineStatus usersOnlineStatus = achievementTrackingService.getVisibleUsersOnlineStatus(usersGuid);
		return ResponseEntity.ok(usersOnlineStatus);
	}
}
