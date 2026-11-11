package de.gebiter.shop.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.shop.model.ShopOffer;

/** Die Angebote des Gebietermarkts; nur der {@link de.gebiter.shop.service.ShopOfferService} nutzt es. */
public interface ShopOfferRepository extends JpaRepository<ShopOffer, Long> {

	/** Alle Angebote dieser Artikel, das älteste zuerst. */
	List<ShopOffer> findAllByShopItemIdInOrderByIdAsc(Collection<Long> shopItemIds);

	/**
	 * Zählt einen Kauf am Angebot hoch, atomar in der Datenbank und nur, solange es läuft: schon begonnen, die Frist nicht
	 * vorbei, die Stückzahl nicht ausverkauft. Die Zeile bleibt bis zum Commit gesperrt, zwei gleichzeitige Käufe können
	 * also nicht beide das letzte Stück bekommen.
	 *
	 * @return die Zahl der geänderten Zeilen: 1 gezählt, 0 kein solches Angebot oder es läuft nicht (mehr)
	 */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update ShopOffer shopOffer set shopOffer.purchaseCount = shopOffer.purchaseCount + 1 "
			+ "where shopOffer.id = :shopOfferId and shopOffer.startsAt <= :now "
			+ "and (shopOffer.endsAt is null or shopOffer.endsAt > :now) "
			+ "and (shopOffer.maxPurchaseCount is null or shopOffer.purchaseCount < shopOffer.maxPurchaseCount)")
	int increasePurchaseCountIfRunning(@Param("shopOfferId") Long shopOfferId, @Param("now") Instant now);
}
