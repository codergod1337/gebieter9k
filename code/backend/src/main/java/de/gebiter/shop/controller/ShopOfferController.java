package de.gebiter.shop.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.shop.dto.NewShopOffer;
import de.gebiter.shop.model.ShopOffer;
import de.gebiter.shop.service.ShopItemService;

/**
 * Die Angebote des Gebietermarkts für jeden angemeldeten User: ein Angebot zu einem eigenen Artikel anlegen (der zweite
 * Teil von „neues Angebot“, nachdem die Datei hochgeladen ist). Ob der User das darf (Verkäufer des Artikels oder
 * ADMIN), prüft der {@link ShopItemService}; er legt das Angebot über den {@code ShopOfferService} an. Die laufenden
 * Angebote kommen mit den Artikeln einer Rubrik ({@link ShopItemController}).
 * <p>
 * Doku: {@code docu/entities/ShopOffer.md}.
 */
@RestController
@RequestMapping("/api/shop-offer")
public class ShopOfferController {

	private final ShopItemService shopItemService;

	public ShopOfferController(ShopItemService shopItemService) {
		this.shopItemService = shopItemService;
	}

	/**
	 * CREATE: Legt ein Angebot zu einem eigenen Artikel an und liefert es. Body: {@code {"fileDocumentId": "9f86…0a08",
	 * "pricePoints": 80, "permanent": false, "grantedUsageCount": 10, "endsAt": "2026-12-01T00:00:00Z",
	 * "maxPurchaseCount": 10}}; {@code endsAt} und {@code maxPurchaseCount} dürfen fehlen.
	 */
	@PostMapping
	public ResponseEntity<ShopOffer> createShopOfferOfOwnShopItem(@RequestBody NewShopOffer newShopOffer) {
		ShopOffer createdShopOffer = shopItemService.createShopOfferOfOwnShopItem(newShopOffer);
		return ResponseEntity.ok(createdShopOffer);
	}
}
