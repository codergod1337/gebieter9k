package de.gebiter.point.controller;

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

import de.gebiter.point.model.PointActivity;
import de.gebiter.point.service.PointActivityService;
import de.gebiter.util.dto.ListingOrder;

/**
 * Pflege der Tätigkeiten mit Punkten, nur ADMIN (Pfad {@code /api/admin/**}), im Modul „Achievements &amp; Markt“.
 * Später ggf. ein Moderator-Modul (Nutzer 2026-11-09). Er nutzt nur den {@link PointActivityService}.
 * <p>
 * Doku: {@code docu/entities/PointActivity.md}.
 */
@RestController
@RequestMapping("/api/admin/point-activity")
public class PointActivityAdminController {

	private final PointActivityService pointActivityService;

	public PointActivityAdminController(PointActivityService pointActivityService) {
		this.pointActivityService = pointActivityService;
	}

	/**
	 * CREATE: Legt eine Tätigkeit an. Body: {@code {"key": "GALLERY_UPLOAD", "displayName": {"de": "Bild hochgeladen"},
	 * "description": null, "rewardPoints": 20}}.
	 */
	@PostMapping
	public ResponseEntity<PointActivity> createPointActivity(@RequestBody PointActivity newPointActivity) {
		String requestedPointActivityKey = newPointActivity.getKey();
		Map<String, String> requestedDisplayName = newPointActivity.getDisplayName();
		Map<String, String> requestedDescription = newPointActivity.getDescription();
		long requestedRewardPoints = newPointActivity.getRewardPoints();
		PointActivity createdPointActivity = pointActivityService.createPointActivity(requestedPointActivityKey,
				requestedDisplayName, requestedDescription, requestedRewardPoints);
		String createdPointActivityKey = createdPointActivity.getKey();
		String createdPointActivityPath = "/api/admin/point-activity/" + createdPointActivityKey;
		URI createdPointActivityLocation = URI.create(createdPointActivityPath);
		return ResponseEntity.created(createdPointActivityLocation).body(createdPointActivity);
	}

	/** READ: Eine Tätigkeit über ihren Key. */
	@GetMapping("/{pointActivityKey}")
	public ResponseEntity<PointActivity> getPointActivity(@PathVariable String pointActivityKey) {
		PointActivity foundPointActivity = pointActivityService.getPointActivity(pointActivityKey);
		return ResponseEntity.ok(foundPointActivity);
	}

	/** READ: Alle Tätigkeiten in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<PointActivity>> getAllPointActivity() {
		List<PointActivity> allPointActivity = pointActivityService.getAllPointActivity();
		return ResponseEntity.ok(allPointActivity);
	}

	/** UPDATE: Ändert Name, Beschreibung und Punkte; maßgeblich ist {@code key}. Neue Punkte gelten nie rückwirkend. */
	@PutMapping
	public ResponseEntity<PointActivity> changePointActivity(@RequestBody PointActivity changedPointActivity) {
		PointActivity savedPointActivity = pointActivityService.changePointActivity(changedPointActivity);
		return ResponseEntity.ok(savedPointActivity);
	}

	/** UPDATE: Die neue Reihenfolge nach Drag and Drop. Body: {@code {"keysInOrder": [...]}}. */
	@PutMapping("/listing-position")
	public ResponseEntity<List<PointActivity>> changePointActivityListingPositions(
			@RequestBody ListingOrder listingOrder) {
		List<String> pointActivityKeysInOrder = listingOrder.keysInOrder();
		List<PointActivity> allPointActivities = pointActivityService
				.changePointActivityListingPositions(pointActivityKeysInOrder);
		return ResponseEntity.ok(allPointActivities);
	}

	/** DELETE: Löscht eine Tätigkeit. Im Body reicht {@code {"key": "…"}}. */
	@DeleteMapping
	public ResponseEntity<Void> deletePointActivity(@RequestBody PointActivity pointActivityToDelete) {
		String pointActivityKey = pointActivityToDelete.getKey();
		pointActivityService.deletePointActivity(pointActivityKey);
		return ResponseEntity.noContent().build();
	}
}
