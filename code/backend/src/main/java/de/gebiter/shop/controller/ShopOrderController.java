package de.gebiter.shop.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.shop.dto.NewShopOrder;
import de.gebiter.shop.model.ShopOrder;
import de.gebiter.shop.service.ShopOrderService;

/**
 * Das Kaufen im Gebietermarkt für jeden angemeldeten User. Er nutzt nur den {@link ShopOrderService}.
 * <p>
 * Doku: {@code docu/entities/ShopOrder.md}.
 */
@RestController
@RequestMapping("/api/shop-order")
public class ShopOrderController {

	private final ShopOrderService shopOrderService;

	public ShopOrderController(ShopOrderService shopOrderService) {
		this.shopOrderService = shopOrderService;
	}

	/**
	 * CREATE: Der angemeldete User kauft ein Angebot und bekommt den Beleg. Body: {@code {"shopOfferId": 22}}. Preis und
	 * Form des Kaufs bestimmt das Angebot. Kommt der Kauf nicht zustande (Angebot läuft nicht mehr, Punkte reichen nicht,
	 * eigener Artikel, schon dauerhaft im Besitz), antwortet er mit 409 und es ist nichts gebucht.
	 */
	@PostMapping
	public ResponseEntity<ShopOrder> createShopOrder(@RequestBody NewShopOrder newShopOrder) {
		Long shopOfferId = newShopOrder.shopOfferId();
		ShopOrder createdShopOrder = shopOrderService.createShopOrder(shopOfferId);
		return ResponseEntity.ok(createdShopOrder);
	}
}
