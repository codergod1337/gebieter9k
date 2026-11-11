package de.gebiter.shop.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.shop.model.ShopCategory;
import de.gebiter.shop.service.ShopCategoryService;
import de.gebiter.util.dto.ListingOrder;

/**
 * Pflege der Rubriken des Gebietermarkts, nur ADMIN (Pfad {@code /api/admin/**}), im Modul „Achievements &amp; Markt“,
 * Tab „Rubriken“. Er nutzt nur den {@link ShopCategoryService}. Ein DELETE gibt es noch nicht.
 * <p>
 * Doku: {@code docu/entities/ShopCategory.md}.
 */
@RestController
@RequestMapping("/api/admin/shop-category")
public class ShopCategoryAdminController {

	private final ShopCategoryService shopCategoryService;

	public ShopCategoryAdminController(ShopCategoryService shopCategoryService) {
		this.shopCategoryService = shopCategoryService;
	}

	/**
	 * CREATE: Legt eine Rubrik am Ende der Liste an. Body:
	 * {@code {"key": "STICKER", "displayName": {"de": "Sticker"}, "fileClassKey": "FOTO_ART"}}.
	 */
	@PostMapping
	public ResponseEntity<ShopCategory> createShopCategory(@RequestBody ShopCategory newShopCategory) {
		String requestedShopCategoryKey = newShopCategory.getKey();
		Map<String, String> requestedDisplayName = newShopCategory.getDisplayName();
		String requestedFileClassKey = newShopCategory.getFileClassKey();
		ShopCategory createdShopCategory = shopCategoryService.createShopCategory(requestedShopCategoryKey,
				requestedDisplayName, requestedFileClassKey);
		String createdShopCategoryKey = createdShopCategory.getKey();
		String createdShopCategoryPath = "/api/admin/shop-category/" + createdShopCategoryKey;
		URI createdShopCategoryLocation = URI.create(createdShopCategoryPath);
		return ResponseEntity.created(createdShopCategoryLocation).body(createdShopCategory);
	}

	/** READ: Eine Rubrik über ihren Key; der Service prüft die Form des Keys vor allem anderen. */
	@GetMapping("/{shopCategoryKey}")
	public ResponseEntity<ShopCategory> getShopCategory(@PathVariable String shopCategoryKey) {
		ShopCategory foundShopCategory = shopCategoryService.getShopCategory(shopCategoryKey);
		return ResponseEntity.ok(foundShopCategory);
	}

	/** UPDATE: Ändert den Anzeigenamen und die FileClass; maßgeblich ist {@code key}, der Platz bleibt. */
	@PutMapping
	public ResponseEntity<ShopCategory> changeShopCategory(@RequestBody ShopCategory changedShopCategory) {
		ShopCategory savedShopCategory = shopCategoryService.changeShopCategory(changedShopCategory);
		return ResponseEntity.ok(savedShopCategory);
	}

	/** UPDATE: Die neue Reihenfolge nach Drag and Drop. Body: {@code {"keysInOrder": [...]}}. */
	@PutMapping("/listing-position")
	public ResponseEntity<List<ShopCategory>> changeShopCategoryListingPositions(
			@RequestBody ListingOrder listingOrder) {
		List<String> shopCategoryKeysInOrder = listingOrder.keysInOrder();
		List<ShopCategory> allShopCategories = shopCategoryService
				.changeShopCategoryListingPositions(shopCategoryKeysInOrder);
		return ResponseEntity.ok(allShopCategories);
	}
}
