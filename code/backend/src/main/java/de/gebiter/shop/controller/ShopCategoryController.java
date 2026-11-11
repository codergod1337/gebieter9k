package de.gebiter.shop.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.shop.model.ShopCategory;
import de.gebiter.shop.service.ShopCategoryService;

/**
 * Die Rubriken des Gebietermarkts für jeden angemeldeten User: nur die Liste. Die Pflege steht im
 * {@link ShopCategoryAdminController}.
 * <p>
 * Doku: {@code docu/entities/ShopCategory.md}.
 */
@RestController
@RequestMapping("/api/shop-category")
public class ShopCategoryController {

	private final ShopCategoryService shopCategoryService;

	public ShopCategoryController(ShopCategoryService shopCategoryService) {
		this.shopCategoryService = shopCategoryService;
	}

	/** READ: Alle Rubriken in der Reihenfolge der Anzeige. */
	@GetMapping
	public ResponseEntity<List<ShopCategory>> getAllShopCategory() {
		List<ShopCategory> allShopCategory = shopCategoryService.getAllShopCategory();
		return ResponseEntity.ok(allShopCategory);
	}
}
