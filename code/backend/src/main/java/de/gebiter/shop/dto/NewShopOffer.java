package de.gebiter.shop.dto;

import java.time.Instant;

/**
 * Request Body für ein neues Angebot zu einem eigenen Artikel des Gebietermarkts: {@code POST /api/shop-offer} (Nutzer
 * 2026-11-11: erst die Datei hochladen, dann geführt sagen, was das Angebot ist). Das Angebot gilt ab dem Anlegen.
 * Z. B. {@code {"fileDocumentId": "9f86…0a08", "pricePoints": 80, "permanent": false, "grantedUsageCount": 10,
 * "endsAt": "2026-12-01T00:00:00Z", "maxPurchaseCount": 10}}.
 * <p>
 * Doku: {@code docu/entities/ShopOffer.md}.
 *
 * @param fileDocumentId die Datei des Artikels: ihre id im Solr-Kern FILE (SHA-256 als Hex)
 * @param pricePoints der Preis eines Kaufs in Punkten, ab 0
 * @param permanent der Käufer darf den Artikel unbegrenzt nutzen; fehlt es, gilt nein
 * @param grantedUsageCount so viele Nutzungen bringt ein Kauf, ab 1; bei „unbegrenzt“ zählt es nicht
 * @param endsAt bis wann das Angebot im Markt steht (befristet); fehlt es, steht es dauerhaft
 * @param maxPurchaseCount so oft kann es höchstens gekauft werden (Stückzahl), ab 1; fehlt es, unbegrenzt
 */
public record NewShopOffer(String fileDocumentId, Long pricePoints, Boolean permanent, Integer grantedUsageCount,
		Instant endsAt, Integer maxPurchaseCount) {
}
