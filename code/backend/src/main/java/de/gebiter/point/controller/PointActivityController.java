package de.gebiter.point.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.point.model.PointActivity;
import de.gebiter.point.service.PointActivityService;

/**
 * Die Tätigkeiten mit Punkten für jeden angemeldeten User: nur die Liste, für die Stammdaten (Namen im Kontoauszug).
 * Die Pflege steht im {@link PointActivityAdminController}.
 * <p>
 * Doku: {@code docu/entities/PointActivity.md}.
 */
@RestController
@RequestMapping("/api/point-activity")
public class PointActivityController {

	private final PointActivityService pointActivityService;

	public PointActivityController(PointActivityService pointActivityService) {
		this.pointActivityService = pointActivityService;
	}

	/** READ: Alle Tätigkeiten in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<PointActivity>> getAllPointActivity() {
		List<PointActivity> allPointActivity = pointActivityService.getAllPointActivity();
		return ResponseEntity.ok(allPointActivity);
	}
}
