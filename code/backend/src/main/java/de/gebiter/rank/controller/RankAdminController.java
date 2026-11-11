package de.gebiter.rank.controller;

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

import de.gebiter.badge.model.BadgeLook;
import de.gebiter.rank.model.Rank;
import de.gebiter.rank.service.RankService;
import de.gebiter.util.dto.ListingOrder;

/**
 * Admin-Endpunkte der Klasse {@link Rank}, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den
 * {@link RankService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/Rank.md}.
 */
@RestController
@RequestMapping("/api/admin/rank")
public class RankAdminController {

	private final RankService rankService;

	public RankAdminController(RankService rankService) {
		this.rankService = rankService;
	}

	/**
	 * CREATE: Legt einen Rang oben auf der Leiter an. Body: {@code {"key": "RAUBRITTER", "displayName": {"de":
	 * "Raubritter"}, "minimumPoints": 5000, "badgeLook": {…}}}. Eine mitgeschickte Stufe zählt nicht.
	 */
	@PostMapping
	public ResponseEntity<Rank> createRank(@RequestBody Rank newRank) {
		String requestedRankKey = newRank.getKey();
		Map<String, String> requestedDisplayName = newRank.getDisplayName();
		long requestedMinimumPoints = newRank.getMinimumPoints();
		BadgeLook requestedBadgeLook = newRank.getBadgeLook();
		Rank createdRank = rankService.createRank(requestedRankKey, requestedDisplayName, requestedMinimumPoints,
				requestedBadgeLook);

		String createdRankKey = createdRank.getKey();
		String createdRankPath = "/api/admin/rank/" + createdRankKey;
		URI createdRankLocation = URI.create(createdRankPath);
		return ResponseEntity.created(createdRankLocation).body(createdRank);
	}

	/** READ: Ein Rang über seinen Key. */
	@GetMapping("/{rankKey}")
	public ResponseEntity<Rank> getRank(@PathVariable String rankKey) {
		Rank foundRank = rankService.getRank(rankKey);
		return ResponseEntity.ok(foundRank);
	}

	/** READ: Alle Ränge, von Stufe 1 aufwärts. */
	@GetMapping
	public ResponseEntity<List<Rank>> getAllRank() {
		List<Rank> allRank = rankService.getAllRank();
		return ResponseEntity.ok(allRank);
	}

	/**
	 * UPDATE: Ändert einen Rang. Body: das volle Objekt, maßgeblich ist {@code key}, geändert werden Name, Mindestpunkte
	 * und Aussehen. Die Stufe ändert nur {@code PUT /level}.
	 */
	@PutMapping
	public ResponseEntity<Rank> changeRank(@RequestBody Rank changedRank) {
		Rank savedRank = rankService.changeRank(changedRank);
		return ResponseEntity.ok(savedRank);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop. Body: {@code {"keysInOrder": ["LEIBEIGENER", …]}}, jeder Key genau
	 * einmal, von Stufe 1 aufwärts. Zurück kommen alle Ränge in neuer Reihenfolge.
	 */
	@PutMapping("/level")
	public ResponseEntity<List<Rank>> changeRankLevels(@RequestBody ListingOrder listingOrder) {
		List<String> rankKeysInOrder = listingOrder.keysInOrder();
		List<Rank> allRanks = rankService.changeRankLevels(rankKeysInOrder);
		return ResponseEntity.ok(allRanks);
	}

	/** DELETE: Löscht einen Rang, die darüber rücken nach. Im Body reicht {@code {"key": "…"}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteRank(@RequestBody Rank rankToDelete) {
		String rankKey = rankToDelete.getKey();
		rankService.deleteRank(rankKey);
		return ResponseEntity.noContent().build();
	}
}
