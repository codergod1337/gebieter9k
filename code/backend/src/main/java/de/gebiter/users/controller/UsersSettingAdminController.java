package de.gebiter.users.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.model.UsersSetting;
import de.gebiter.users.service.UsersSettingService;
import de.gebiter.users.service.UsersService;

/**
 * Admin-Endpunkte der Klasse {@link UsersSetting}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt den
 * {@link UsersSettingService} und für die Prüfung, ob es den User gibt, den {@link UsersService}. Ein Repository nutzt
 * er nie. Hier stehen auch alle Lesewege zu fremden Einstellungen; die eigenen pflegt jeder über den
 * {@link UsersSettingController}.
 * <p>
 * Doku: {@code docu/entities/UsersSetting.md}.
 */
@RestController
@RequestMapping("/api/admin/users-setting")
public class UsersSettingAdminController {

	private final UsersSettingService usersSettingService;

	private final UsersService usersService;

	public UsersSettingAdminController(UsersSettingService usersSettingService, UsersService usersService) {
		this.usersSettingService = usersSettingService;
		this.usersService = usersService;
	}

	/**
	 * CREATE: Legt eine Einstellung an. Body:
	 * {@code {"usersGuid": "…", "settingKey": "THEME", "settingValue": "dark"}}.
	 */
	@PostMapping
	public ResponseEntity<UsersSetting> createUsersSetting(@RequestBody UsersSetting newUsersSetting) {
		UUID requestedUsersGuid = newUsersSetting.getUsersGuid();
		String requestedSettingKey = newUsersSetting.getSettingKey();
		String requestedSettingValue = newUsersSetting.getSettingValue();
		usersService.checkUsersExists(requestedUsersGuid, "usersGuid");

		UsersSetting createdUsersSetting = usersSettingService.createUsersSetting(requestedUsersGuid,
				requestedSettingKey, requestedSettingValue);

		Long createdUsersSettingId = createdUsersSetting.getId();
		String createdUsersSettingPath = "/api/users-setting/" + createdUsersSettingId;
		URI createdUsersSettingLocation = URI.create(createdUsersSettingPath);
		return ResponseEntity.created(createdUsersSettingLocation).body(createdUsersSetting);
	}

	/** READ: Ein Eintrag über seine {@code id}. */
	@GetMapping("/{id}")
	public ResponseEntity<UsersSetting> getUsersSetting(@PathVariable Long id) {
		UsersSetting foundUsersSetting = usersSettingService.getUsersSetting(id);
		return ResponseEntity.ok(foundUsersSetting);
	}

	/** READ: Alle Einstellungen eines Users. */
	@GetMapping("/users/{usersGuid}")
	public ResponseEntity<List<UsersSetting>> getUsersSettingByUsersGuid(@PathVariable UUID usersGuid) {
		List<UsersSetting> foundUsersSetting = usersSettingService.getUsersSettingByUsersGuid(usersGuid);
		return ResponseEntity.ok(foundUsersSetting);
	}

	/** READ: Alle Einstellungen aller User. */
	@GetMapping
	public ResponseEntity<List<UsersSetting>> getAllUsersSetting() {
		List<UsersSetting> allUsersSetting = usersSettingService.getAllUsersSetting();
		return ResponseEntity.ok(allUsersSetting);
	}

	/**
	 * UPDATE: Ändert den Wert einer Einstellung. Body: das volle Objekt samt {@code id}. Übernommen
	 * wird nur {@code settingValue}.
	 */
	@PutMapping
	public ResponseEntity<UsersSetting> changeUsersSetting(@RequestBody UsersSetting changedUsersSetting) {
		UsersSetting savedUsersSetting = usersSettingService.changeUsersSetting(changedUsersSetting);
		return ResponseEntity.ok(savedUsersSetting);
	}

	/** DELETE: Löscht einen Eintrag. Im Body reicht {@code {"id": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteUsersSetting(@RequestBody UsersSetting usersSettingToDelete) {
		Long id = usersSettingToDelete.getId();
		usersSettingService.deleteUsersSetting(id);
		return ResponseEntity.noContent().build();
	}
}
