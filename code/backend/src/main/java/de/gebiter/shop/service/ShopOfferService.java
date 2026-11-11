package de.gebiter.shop.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.shop.ShopOrderRejectedException;
import de.gebiter.shop.dto.NewShopOffer;
import de.gebiter.shop.model.ShopOffer;
import de.gebiter.shop.repository.ShopOfferRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Die Angebote des Gebietermarkts (Nutzer 2026-11-10 und 2026-11-11): zu welchem Preis, in welcher Form (dauerhaft oder
 * Anzahl Nutzungen) und wie lange (ohne Ende, bis zu einer Frist, bis eine Stückzahl verkauft ist) ein Artikel zu kaufen
 * ist. Ein Angebot legt der Verkäufer zu seinem Artikel an, im geführten Ablauf „neues Angebot“ nach dem Hochladen
 * ({@code ShopItemService.createShopOfferOfOwnShopItem}; dort wird geprüft, ob er das darf). Er nutzt nur sein eigenes
 * Repository und kennt die Artikel nur über ihre id.
 * <p>
 * Gekauft wird über den {@code ShopOrderService}; hier zählt nur der Kauf am Angebot hoch
 * ({@link #increaseShopOfferPurchaseCount}). Ändern und Beenden gibt es noch nicht.
 * <p>
 * Doku: {@code docu/entities/ShopOffer.md}.
 */
@Service
public class ShopOfferService {

	private final ShopOfferRepository shopOfferRepository;

	public ShopOfferService(ShopOfferRepository shopOfferRepository) {
		this.shopOfferRepository = shopOfferRepository;
	}

	/**
	 * Prüft ein neues Angebot:
	 * <ul>
	 * <li>der Preis ist da und nicht negativ;</li>
	 * <li>entweder unbegrenzt nutzbar oder mindestens eine Nutzung je Kauf;</li>
	 * <li>ein befristetes Angebot endet in der Zukunft;</li>
	 * <li>eine Stückzahl ist mindestens 1;</li>
	 * <li>bei begrenzter Stückzahl gibt es keinen unbegrenzten Kauf, nur Nutzungen (Nutzer 2026-11-10).</li>
	 * </ul>
	 *
	 * @throws IllegalArgumentException wenn etwas davon nicht stimmt
	 */
	public void requireValidNewShopOffer(NewShopOffer newShopOffer) {
		if (newShopOffer == null) {
			throw new IllegalArgumentException("Das Angebot fehlt.");
		}
		Long pricePoints = newShopOffer.pricePoints();
		Helper.requireNotNull(pricePoints, "pricePoints");
		if (pricePoints < 0) {
			throw new IllegalArgumentException("Der Preis eines Angebots darf nicht negativ sein.");
		}
		boolean permanent = isPermanent(newShopOffer);
		Integer grantedUsageCount = newShopOffer.grantedUsageCount();
		if (!permanent) {
			boolean usageCountGiven = grantedUsageCount != null && grantedUsageCount >= 1;
			if (!usageCountGiven) {
				throw new IllegalArgumentException("Ein Angebot ist entweder unbegrenzt nutzbar oder bringt mindestens eine "
						+ "Nutzung je Kauf (grantedUsageCount).");
			}
		}
		Instant endsAt = newShopOffer.endsAt();
		if (endsAt != null) {
			Instant now = Instant.now();
			boolean endsInFuture = endsAt.isAfter(now);
			if (!endsInFuture) {
				throw new IllegalArgumentException("Ein befristetes Angebot muss in der Zukunft enden.");
			}
		}
		Integer maxPurchaseCount = newShopOffer.maxPurchaseCount();
		if (maxPurchaseCount != null) {
			if (maxPurchaseCount < 1) {
				throw new IllegalArgumentException("Die Stückzahl eines Angebots ist mindestens 1.");
			}
			if (permanent) {
				throw new IllegalArgumentException("Ein Angebot mit begrenzter Stückzahl gibt es nur mit einer Anzahl "
						+ "Nutzungen, nicht unbegrenzt nutzbar.");
			}
		}
	}

	/**
	 * CREATE: Legt ein Angebot zu dem Artikel {@code shopItemId} an. Nur der {@code ShopItemService} ruft es, nachdem er
	 * geprüft hat, dass der angemeldete User der Verkäufer des Artikels oder ADMIN ist. Es gilt ab jetzt.
	 *
	 * @throws IllegalArgumentException wenn die id fehlt oder das Angebot nicht passt
	 */
	@Transactional
	public ShopOffer createShopOffer(Long shopItemId, NewShopOffer newShopOffer) {
		Helper.requireNotNull(shopItemId, "shopItemId");
		requireValidNewShopOffer(newShopOffer);
		long pricePoints = newShopOffer.pricePoints();
		boolean permanent = isPermanent(newShopOffer);
		int grantedUsageCount = 0;
		if (!permanent) {
			grantedUsageCount = newShopOffer.grantedUsageCount();
		}
		Instant startsAt = Instant.now();
		Instant endsAt = newShopOffer.endsAt();
		Integer maxPurchaseCount = newShopOffer.maxPurchaseCount();
		ShopOffer newOffer = new ShopOffer(shopItemId, pricePoints, permanent, grantedUsageCount, startsAt, endsAt,
				maxPurchaseCount);
		return shopOfferRepository.save(newOffer);
	}

	/**
	 * READ: Ein Angebot über seine id, ob es gerade läuft oder nicht. Für andere Services, z. B. den Kauf.
	 *
	 * @throws EntityNotFoundException wenn es das Angebot nicht gibt
	 */
	@Transactional(readOnly = true)
	public ShopOffer getShopOffer(Long shopOfferId) {
		Helper.requireNotNull(shopOfferId, "shopOfferId");
		return doGetShopOffer(shopOfferId);
	}

	/**
	 * READ: Die laufenden Angebote dieser Artikel, je Artikel-id eine Liste, das älteste zuerst. Laufend heißt: schon
	 * begonnen, die Frist nicht vorbei, die Stückzahl nicht ausverkauft. Ein Artikel ohne laufendes Angebot fehlt in der
	 * Map.
	 */
	@Transactional(readOnly = true)
	public Map<Long, List<ShopOffer>> getRunningShopOffersByShopItemId(List<Long> shopItemIds) {
		Map<Long, List<ShopOffer>> runningShopOffersByShopItemId = new HashMap<>();
		if (shopItemIds.isEmpty()) {
			return runningShopOffersByShopItemId;
		}
		Instant now = Instant.now();
		List<ShopOffer> shopOffersOfShopItems = shopOfferRepository.findAllByShopItemIdInOrderByIdAsc(shopItemIds);
		for (ShopOffer shopOffer : shopOffersOfShopItems) {
			boolean running = isRunning(shopOffer, now);
			if (!running) {
				continue;
			}
			Long shopItemId = shopOffer.getShopItemId();
			List<ShopOffer> runningShopOffersOfShopItem = runningShopOffersByShopItemId.get(shopItemId);
			if (runningShopOffersOfShopItem == null) {
				runningShopOffersOfShopItem = new ArrayList<>();
				runningShopOffersByShopItemId.put(shopItemId, runningShopOffersOfShopItem);
			}
			runningShopOffersOfShopItem.add(shopOffer);
		}
		return runningShopOffersByShopItemId;
	}

	/**
	 * UPDATE: Zählt einen Kauf am Angebot hoch, in EINER Anweisung in der Datenbank und nur, solange das Angebot läuft
	 * (begonnen, Frist nicht vorbei, Stückzahl nicht ausverkauft). Aufgerufen nur vom {@code ShopOrderService}, in der
	 * Transaktion des Kaufs: Scheitert der Kauf danach, ist auch der Zähler wieder der alte. Beispiel: Vom 10er-Angebot
	 * sind 9 verkauft; zwei User kaufen gleichzeitig, einer bekommt das letzte Stück, der andere wird abgelehnt.
	 *
	 * @return das Angebot mit dem neuen Zähler
	 * @throws EntityNotFoundException wenn es das Angebot nicht gibt
	 * @throws ShopOrderRejectedException wenn das Angebot nicht (mehr) läuft
	 */
	@Transactional
	public ShopOffer increaseShopOfferPurchaseCount(Long shopOfferId) {
		Helper.requireNotNull(shopOfferId, "shopOfferId");
		Instant now = Instant.now();
		int changedRowCount = shopOfferRepository.increasePurchaseCountIfRunning(shopOfferId, now);
		ShopOffer shopOffer = doGetShopOffer(shopOfferId);
		boolean purchaseCounted = changedRowCount == 1;
		if (!purchaseCounted) {
			throw new ShopOrderRejectedException("Dieses Angebot läuft nicht mehr: abgelaufen oder ausverkauft.");
		}
		return shopOffer;
	}

	private ShopOffer doGetShopOffer(Long shopOfferId) {
		Optional<ShopOffer> foundShopOffer = shopOfferRepository.findById(shopOfferId);
		if (foundShopOffer.isEmpty()) {
			throw new EntityNotFoundException("Das Angebot mit der id " + shopOfferId + " gibt es nicht.");
		}
		return foundShopOffer.get();
	}

	private boolean isPermanent(NewShopOffer newShopOffer) {
		Boolean permanent = newShopOffer.permanent();
		return permanent != null && permanent;
	}

	/** Steht das Angebot zum Zeitpunkt {@code now} im Markt? */
	private boolean isRunning(ShopOffer shopOffer, Instant now) {
		Instant startsAt = shopOffer.getStartsAt();
		boolean started = !startsAt.isAfter(now);
		if (!started) {
			return false;
		}
		Instant endsAt = shopOffer.getEndsAt();
		boolean ended = endsAt != null && !endsAt.isAfter(now);
		if (ended) {
			return false;
		}
		Integer maxPurchaseCount = shopOffer.getMaxPurchaseCount();
		int purchaseCount = shopOffer.getPurchaseCount();
		boolean soldOut = maxPurchaseCount != null && purchaseCount >= maxPurchaseCount;
		return !soldOut;
	}
}
