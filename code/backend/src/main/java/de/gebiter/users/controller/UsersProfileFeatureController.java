package de.gebiter.users.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.users.model.UsersProfileFeature;
import de.gebiter.users.service.UsersProfileFeatureService;

/**
 * Endpunkte der Klasse {@link UsersProfileFeature} für jeden angemeldeten User (AR USER oder ADMIN). Er nutzt nur den
 * {@link UsersProfileFeatureService}, nie ein Repository. Hier wird nur gelesen.
 * <p>
 * Kein UPDATE: Ein Eintrag besteht nur aus User und Feature. Freischalten und Entziehen steht im
 * {@link UsersProfileFeatureAdminController}.
 * <p>
 * Doku: {@code docu/entities/UsersProfileFeature.md}.
 */
@RestController
@RequestMapping("/api/users-profile-feature")
public class UsersProfileFeatureController {

	private final UsersProfileFeatureService usersProfileFeatureService;

	public UsersProfileFeatureController(UsersProfileFeatureService usersProfileFeatureService) {
		this.usersProfileFeatureService = usersProfileFeatureService;
	}

	/** READ: Ein Eintrag über seine {@code id}. */
	@GetMapping("/{id}")
	public ResponseEntity<UsersProfileFeature> getUsersProfileFeature(@PathVariable Long id) {
		UsersProfileFeature foundUsersProfileFeature = usersProfileFeatureService.getUsersProfileFeature(id);
		return ResponseEntity.ok(foundUsersProfileFeature);
	}

	/** READ: Alle freigeschalteten Features eines Users. */
	@GetMapping("/users/{usersGuid}")
	public ResponseEntity<List<UsersProfileFeature>> getUsersProfileFeatureByUsersGuid(
			@PathVariable UUID usersGuid) {
		List<UsersProfileFeature> foundUsersProfileFeature = usersProfileFeatureService
				.getUsersProfileFeatureByUsersGuid(usersGuid);
		return ResponseEntity.ok(foundUsersProfileFeature);
	}

	/** READ: Alle freigeschalteten Features aller User. */
	@GetMapping
	public ResponseEntity<List<UsersProfileFeature>> getAllUsersProfileFeature() {
		List<UsersProfileFeature> allUsersProfileFeature = usersProfileFeatureService.getAllUsersProfileFeature();
		return ResponseEntity.ok(allUsersProfileFeature);
	}
}
