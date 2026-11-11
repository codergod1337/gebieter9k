package de.gebiter.shop.dto;

/**
 * Ein Kauf im Gebietermarkt, wie der Client ihn schickt: nur das Angebot. Preis, Form des Kaufs und Datei bestimmt das
 * Backend aus dem Angebot. Z. B. {@code {"shopOfferId": 22}}.
 * <p>
 * Doku: {@code docu/entities/ShopOrder.md}.
 */
public record NewShopOrder(Long shopOfferId) {
}
