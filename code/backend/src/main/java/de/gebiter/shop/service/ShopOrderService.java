package de.gebiter.shop.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.shop.ShopOrderRejectedException;
import de.gebiter.shop.model.ShopItem;
import de.gebiter.shop.model.ShopOffer;
import de.gebiter.shop.model.ShopOrder;
import de.gebiter.shop.model.UsersShopItem;
import de.gebiter.shop.repository.ShopOrderRepository;
import de.gebiter.users.service.UsersPointBookingService;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Das Kaufen im Gebietermarkt (Nutzer 2026-11-11: Memes hochladen und kaufen können). Ein Kauf ist wie Geld und läuft
 * deshalb ganz in einer Transaktion: Entweder steht danach alles da (Zähler am Angebot, Beleg, Buchungen im Kontobuch,
 * Besitz) oder nichts. Er nutzt nur sein eigenes Repository (die Belege); alles andere geht über die Services, denen es
 * gehört: das Angebot über den {@link ShopOfferService}, der Artikel über den {@link ShopItemService}, die Punkte über
 * den {@link UsersPointBookingService} (die einzige Stelle, die Punkte bewegt), der Besitz über den
 * {@link UsersShopItemService}.
 * <p>
 * Doku: {@code docu/entities/ShopOrder.md}.
 */
@Service
public class ShopOrderService {

	private final ShopOrderRepository shopOrderRepository;

	private final ShopOfferService shopOfferService;

	private final ShopItemService shopItemService;

	private final UsersShopItemService usersShopItemService;

	private final UsersPointBookingService usersPointBookingService;

	private final UsersService usersService;

	private final CurrentUsersProvider currentUsersProvider;

	/** Die Marktgebühr in Prozent des Preises ({@code gebiter.shop.market-fee-percent}). */
	private final int marketFeePercent;

	public ShopOrderService(ShopOrderRepository shopOrderRepository, ShopOfferService shopOfferService,
			ShopItemService shopItemService, UsersShopItemService usersShopItemService,
			UsersPointBookingService usersPointBookingService, UsersService usersService,
			CurrentUsersProvider currentUsersProvider,
			@Value("${gebiter.shop.market-fee-percent}") int marketFeePercent) {
		this.shopOrderRepository = shopOrderRepository;
		this.shopOfferService = shopOfferService;
		this.shopItemService = shopItemService;
		this.usersShopItemService = usersShopItemService;
		this.usersPointBookingService = usersPointBookingService;
		this.usersService = usersService;
		this.currentUsersProvider = currentUsersProvider;
		this.marketFeePercent = marketFeePercent;
	}

	/**
	 * CREATE: Der angemeldete User kauft das Angebot {@code shopOfferId}. Preis, Form des Kaufs und Datei kommen aus dem
	 * Angebot, nie vom Client. In einer Transaktion:
	 * <ol>
	 * <li>Abgelehnt wird der eigene Artikel und ein Artikel, den der User schon dauerhaft hat.</li>
	 * <li>Die Punkte müssen reichen.</li>
	 * <li>Das Angebot zählt den Kauf hoch, in einer Anweisung und nur, solange es läuft.</li>
	 * <li>Der Beleg entsteht, mit Preis und Form des Kaufs festgeschrieben.</li>
	 * <li>Der Preis geht beim Käufer ab; der Verkäufer bekommt den Preis abzüglich der Marktgebühr, die Gebühr
	 * verschwindet. Bei Preis 0 wird nichts gebucht.</li>
	 * <li>Der Käufer bekommt den Besitz: dauerhaft oder die Nutzungen dazu.</li>
	 * </ol>
	 * Beispiel: Das 10er-Paket der Kuh kostet 80 Punkte, Gebühr 10 %. Bob (120 Punkte) kauft: Bob hat 40 Punkte, die
	 * Verkäuferin Carla bekommt 72, 8 verschwinden, Bob hat 10 Nutzungen der Kuh.
	 *
	 * @return der Beleg
	 * @throws EntityNotFoundException wenn es das Angebot nicht gibt
	 * @throws ShopOrderRejectedException wenn der Kauf nicht zustande kommt (eigener Artikel, schon dauerhaft im Besitz,
	 *             Punkte reichen nicht, Angebot läuft nicht mehr); gebucht ist dann nichts
	 */
	@Transactional
	public ShopOrder createShopOrder(Long shopOfferId) {
		Helper.requireNotNull(shopOfferId, "shopOfferId");
		UUID buyerUsersGuid = currentUsersProvider.currentUsersGuid();
		ShopOffer shopOffer = shopOfferService.getShopOffer(shopOfferId);
		Long shopItemId = shopOffer.getShopItemId();
		ShopItem shopItem = shopItemService.getShopItem(shopItemId);
		String fileDocumentId = shopItem.getFileDocumentId();
		UUID sellerUsersGuid = shopItem.getSellerUsersGuid();
		long pricePoints = shopOffer.getPricePoints();
		boolean permanent = shopOffer.isPermanent();
		int grantedUsageCount = shopOffer.getGrantedUsageCount();

		// 1. Der eigene Artikel und das, was man schon dauerhaft hat, lassen sich nicht kaufen
		boolean buyerIsSeller = buyerUsersGuid.equals(sellerUsersGuid);
		if (buyerIsSeller) {
			throw new ShopOrderRejectedException("Deinen eigenen Artikel kannst du nicht kaufen.");
		}
		UsersShopItem ownedUsersShopItem = usersShopItemService.getUsersShopItemOrNull(buyerUsersGuid, fileDocumentId);
		boolean alreadyOwnedPermanently = ownedUsersShopItem != null && ownedUsersShopItem.isPermanent();
		if (alreadyOwnedPermanently) {
			throw new ShopOrderRejectedException("Diesen Artikel hast du schon dauerhaft.");
		}

		// 2. Reichen die Punkte? Die Buchung unten prüft es noch einmal atomar; hier steht nur die klare Meldung.
		long buyerPointBalance = usersService.getUsersPoints(buyerUsersGuid);
		if (buyerPointBalance < pricePoints) {
			throw new ShopOrderRejectedException("Deine Punkte reichen nicht: Das Angebot kostet " + pricePoints
					+ " Punkte, du hast " + buyerPointBalance + ".");
		}

		// 3. Das Angebot zählt hoch, nur solange es läuft; sonst wird hier abgelehnt
		shopOfferService.increaseShopOfferPurchaseCount(shopOfferId);

		// 4. Der Beleg
		Instant orderedAt = Instant.now();
		ShopOrder newShopOrder = new ShopOrder(buyerUsersGuid, shopOfferId, fileDocumentId, pricePoints, permanent,
				grantedUsageCount, orderedAt);
		ShopOrder savedShopOrder = shopOrderRepository.saveAndFlush(newShopOrder);
		Long shopOrderId = savedShopOrder.getId();

		// 5. Die Punkte: beim Käufer ab, der Anteil an den Verkäufer, die Gebühr verschwindet
		if (pricePoints > 0) {
			doBookShopOrderPoints(buyerUsersGuid, sellerUsersGuid, pricePoints, fileDocumentId, shopOrderId, orderedAt);
		}

		// 6. Der Besitz
		usersShopItemService.grantUsersShopItem(buyerUsersGuid, fileDocumentId, permanent, grantedUsageCount);
		return savedShopOrder;
	}

	/**
	 * Bucht einen Kauf im Kontobuch: Der Preis geht beim Käufer ab. Der Verkäufer bekommt den Preis abzüglich der
	 * Marktgebühr (abgerundet auf ganze Punkte); hat der Artikel keinen Verkäufer, verschwindet der ganze Preis.
	 */
	private void doBookShopOrderPoints(UUID buyerUsersGuid, UUID sellerUsersGuid, long pricePoints,
			String fileDocumentId, Long shopOrderId, Instant orderedAt) {
		try {
			usersPointBookingService.createShopPurchaseBooking(buyerUsersGuid, pricePoints, fileDocumentId, shopOrderId,
					orderedAt);
		} catch (IllegalStateException notEnoughPointsException) {
			// Zwischen der Prüfung oben und der Buchung hat ein anderer Kauf desselben Users die Punkte verbraucht
			throw new ShopOrderRejectedException("Deine Punkte reichen nicht für dieses Angebot.");
		}
		if (sellerUsersGuid == null) {
			return;
		}
		long marketFeePoints = pricePoints * marketFeePercent / 100;
		long sellerPoints = pricePoints - marketFeePoints;
		if (sellerPoints > 0) {
			usersPointBookingService.createShopSaleBooking(sellerUsersGuid, sellerPoints, fileDocumentId, shopOrderId,
					buyerUsersGuid, orderedAt);
		}
	}
}
