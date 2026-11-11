package de.gebiter.users.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.model.UsersProfileFeature;
import de.gebiter.users.service.UsersProfileFeatureService;
import de.gebiter.users.service.UsersService;

/**
 * Admin-Endpunkte der Klasse {@link UsersProfileFeature}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt
 * den {@link UsersProfileFeatureService} und für die Prüfung, ob es den User gibt, den {@link UsersService}. Ein
 * Repository nutzt er nie. Gelesen wird über den {@link UsersProfileFeatureController}.
 * <p>
 * Doku: {@code docu/entities/UsersProfileFeature.md}.
 */
@RestController
@RequestMapping("/api/admin/users-profile-feature")
public class UsersProfileFeatureAdminController {

	private final UsersProfileFeatureService usersProfileFeatureService;

	private final UsersService usersService;

	public UsersProfileFeatureAdminController(UsersProfileFeatureService usersProfileFeatureService, UsersService usersService) {
		this.usersProfileFeatureService = usersProfileFeatureService;
		this.usersService = usersService;
	}

	/** CREATE: Schaltet ein Feature frei. Body: {@code {"usersGuid": "…", "featureKey": "…"}}. */
	@PostMapping
	public ResponseEntity<UsersProfileFeature> createUsersProfileFeature(
			@RequestBody UsersProfileFeature newUsersProfileFeature) {
		UUID requestedUsersGuid = newUsersProfileFeature.getUsersGuid();
		String requestedFeatureKey = newUsersProfileFeature.getFeatureKey();
		usersService.checkUsersExists(requestedUsersGuid, "usersGuid");

		UsersProfileFeature createdUsersProfileFeature = usersProfileFeatureService
				.createUsersProfileFeature(requestedUsersGuid, requestedFeatureKey);

		Long createdUsersProfileFeatureId = createdUsersProfileFeature.getId();
		String createdUsersProfileFeaturePath = "/api/users-profile-feature/" + createdUsersProfileFeatureId;
		URI createdUsersProfileFeatureLocation = URI.create(createdUsersProfileFeaturePath);
		return ResponseEntity.created(createdUsersProfileFeatureLocation).body(createdUsersProfileFeature);
	}

	/** DELETE: Löscht einen Eintrag, das Feature ist danach gesperrt. Im Body reicht {@code {"id": …}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteUsersProfileFeature(
			@RequestBody UsersProfileFeature usersProfileFeatureToDelete) {
		Long id = usersProfileFeatureToDelete.getId();
		usersProfileFeatureService.deleteUsersProfileFeature(id);
		return ResponseEntity.noContent().build();
	}
}
