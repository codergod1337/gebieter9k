package de.gebiter.users.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.dto.OwnUsersDetailAvatarColorsRequest;
import de.gebiter.users.dto.OwnUsersDetailBannerDriftSpeedRequest;
import de.gebiter.users.dto.OwnUsersDetailProfileImageRequest;
import de.gebiter.users.dto.OwnUsersDetailAboutTextRequest;
import de.gebiter.users.dto.OwnUsersDetailStatusTextRequest;
import de.gebiter.users.model.UsersDetail;
import de.gebiter.users.service.UsersDetailService;
import de.gebiter.users.service.UsersService;

/**
 * Endpunkte der Klasse {@link UsersDetail} für jeden angemeldeten User (AR USER oder ADMIN). Er nutzt nur Services, nie
 * ein Repository. Lesen geht nur, wenn man das Profil des Users sehen darf (die eine Regel im {@link UsersService});
 * alles lesen kann nur der Admin über den {@link UsersDetailAdminController}.
 * <p>
 * Kein CREATE und kein DELETE: Der Eintrag entsteht mit dem User und wird nie gelöscht. Ändern fremder Einträge steht
 * im {@link UsersDetailAdminController}. Vom eigenen Eintrag setzt der User hier sein Profilbild, die GUID kommt aus dem
 * Token.
 * <p>
 * Doku: {@code docu/entities/UsersDetail.md}.
 */
@RestController
@RequestMapping("/api/users-detail")
public class UsersDetailController {

	private final UsersDetailService usersDetailService;

	private final UsersService usersService;

	public UsersDetailController(UsersDetailService usersDetailService, UsersService usersService) {
		this.usersDetailService = usersDetailService;
		this.usersService = usersService;
	}

	/** READ: Der Eintrag eines Users über dessen GUID, nur wenn man sein Profil sehen darf; sonst 404. */
	@GetMapping("/{usersGuid}")
	public ResponseEntity<UsersDetail> getVisibleUsersDetail(@PathVariable UUID usersGuid) {
		UsersDetail foundUsersDetail = usersService.getVisibleUsersDetail(usersGuid);
		return ResponseEntity.ok(foundUsersDetail);
	}

	/**
	 * UPDATE: Das eigene Profilbild setzen, wie in der Vorlage. Body: {@code {"profileImageBase64Png": "…",
	 * "profileImageSmallBase64Png": "…"}}, das im Browser zugeschnittene PNG groß und klein; beide {@code null} oder leer
	 * entfernen es. 400, wenn nur eins kommt oder eins kein PNG in seinen Maßen ist.
	 */
	@PutMapping("/profile-image")
	public ResponseEntity<UsersDetail> changeOwnUsersDetailProfileImage(
			@RequestBody OwnUsersDetailProfileImageRequest profileImageRequest) {
		String profileImageBase64Png = profileImageRequest.profileImageBase64Png();
		String profileImageSmallBase64Png = profileImageRequest.profileImageSmallBase64Png();
		UsersDetail savedUsersDetail = usersDetailService.changeOwnUsersDetailProfileImage(profileImageBase64Png,
				profileImageSmallBase64Png);
		return ResponseEntity.ok(savedUsersDetail);
	}

	/**
	 * UPDATE: Den eigenen Status-Text im Profilkopf setzen. Body: {@code {"statusText": "…"}}; leer oder {@code null}
	 * entfernt ihn. 400, wenn er zu lang ist.
	 */
	@PutMapping("/status-text")
	public ResponseEntity<UsersDetail> changeOwnUsersDetailStatusText(
			@RequestBody OwnUsersDetailStatusTextRequest statusTextRequest) {
		String statusText = statusTextRequest.statusText();
		UsersDetail savedUsersDetail = usersDetailService.changeOwnUsersDetailStatusText(statusText);
		return ResponseEntity.ok(savedUsersDetail);
	}

	/**
	 * UPDATE: Den eigenen Text „Über mich“ setzen, mehrsprachiger Rich-Text. Body:
	 * {@code {"aboutText": {"de": "<p>…</p>"}}}; das Backend bereinigt ihn. Ohne Inhalt oder {@code null} entfernt ihn.
	 * 400, wenn er zu lang ist.
	 */
	@PutMapping("/about-text")
	public ResponseEntity<UsersDetail> changeOwnUsersDetailAboutText(
			@RequestBody OwnUsersDetailAboutTextRequest aboutTextRequest) {
		Map<String, String> aboutText = aboutTextRequest.aboutText();
		UsersDetail savedUsersDetail = usersDetailService.changeOwnUsersDetailAboutText(aboutText);
		return ResponseEntity.ok(savedUsersDetail);
	}

	/**
	 * UPDATE: Einstellen, wie schnell das Standard-Banner des eigenen Profils driftet. Body:
	 * {@code {"bannerDriftSpeedPercent": 60}}, 0 steht still. 400 außerhalb des Bereichs.
	 */
	@PutMapping("/banner-drift-speed")
	public ResponseEntity<UsersDetail> changeOwnUsersDetailBannerDriftSpeed(
			@RequestBody OwnUsersDetailBannerDriftSpeedRequest bannerDriftSpeedRequest) {
		Integer bannerDriftSpeedPercent = bannerDriftSpeedRequest.bannerDriftSpeedPercent();
		UsersDetail savedUsersDetail = usersDetailService.changeOwnUsersDetailBannerDriftSpeed(bannerDriftSpeedPercent);
		return ResponseEntity.ok(savedUsersDetail);
	}

	/**
	 * UPDATE: Die Farben des eigenen Avatars ohne Profilbild. Body: {@code {"avatarTextColor": "#e9ff3b",
	 * "avatarBackgroundColor": "#330716"}}; leer setzt die Farbe auf den Standard zurück. 400 bei falscher Form.
	 */
	@PutMapping("/avatar-colors")
	public ResponseEntity<UsersDetail> changeOwnUsersDetailAvatarColors(
			@RequestBody OwnUsersDetailAvatarColorsRequest avatarColorsRequest) {
		String avatarTextColor = avatarColorsRequest.avatarTextColor();
		String avatarBackgroundColor = avatarColorsRequest.avatarBackgroundColor();
		UsersDetail savedUsersDetail = usersDetailService.changeOwnUsersDetailAvatarColors(avatarTextColor,
				avatarBackgroundColor);
		return ResponseEntity.ok(savedUsersDetail);
	}
}
