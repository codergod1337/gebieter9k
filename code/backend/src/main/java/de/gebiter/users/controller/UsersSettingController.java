package de.gebiter.users.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.dto.OwnUsersSettingDeleteRequest;
import de.gebiter.users.dto.OwnUsersSettingSaveRequest;
import de.gebiter.users.model.UsersSetting;
import de.gebiter.users.service.UsersSettingService;

/**
 * Die eigenen Einstellungen jedes angemeldeten Users (AR USER oder ADMIN), wie der UsersSettingsController der Vorlage:
 * Keiner dieser Endpunkte nimmt eine GUID entgegen, sie kommt aus dem Token. An fremde Einstellungen kommt man hier also
 * nicht heran, die liest und schreibt nur der {@link UsersSettingAdminController}. Er nutzt nur den
 * {@link UsersSettingService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/UsersSetting.md}.
 */
@RestController
@RequestMapping("/api/users-setting")
public class UsersSettingController {

	private final UsersSettingService usersSettingService;

	public UsersSettingController(UsersSettingService usersSettingService) {
		this.usersSettingService = usersSettingService;
	}

	/** READ: Die eigenen Einstellungen, ohne Einträge eine leere Liste. */
	@GetMapping
	public ResponseEntity<List<UsersSetting>> getOwnUsersSetting() {
		List<UsersSetting> ownUsersSetting = usersSettingService.getOwnUsersSetting();
		return ResponseEntity.ok(ownUsersSetting);
	}

	/**
	 * UPDATE: Setzt eine eigene Einstellung, der Eintrag entsteht beim ersten Setzen. Body:
	 * {@code {"settingKey": "TABLE_SOLR_FIELD", "settingValue": "…"}}.
	 */
	@PutMapping
	public ResponseEntity<UsersSetting> saveOwnUsersSetting(@RequestBody OwnUsersSettingSaveRequest saveRequest) {
		String settingKey = saveRequest.settingKey();
		String settingValue = saveRequest.settingValue();
		UsersSetting savedUsersSetting = usersSettingService.saveOwnUsersSetting(settingKey, settingValue);
		return ResponseEntity.ok(savedUsersSetting);
	}

	/** DELETE: Löscht eine eigene Einstellung, danach gilt wieder der Standard des Frontends. Body: {@code {"settingKey": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnUsersSetting(@RequestBody OwnUsersSettingDeleteRequest deleteRequest) {
		String settingKey = deleteRequest.settingKey();
		usersSettingService.deleteOwnUsersSetting(settingKey);
		return ResponseEntity.noContent().build();
	}
}
