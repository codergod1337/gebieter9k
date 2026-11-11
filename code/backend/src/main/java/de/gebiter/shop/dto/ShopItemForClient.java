package de.gebiter.shop.dto;

import java.util.List;
import java.util.Map;

import de.gebiter.shop.model.ShopItem;
import de.gebiter.shop.model.ShopOffer;
import de.gebiter.shop.model.UsersShopItem;

/**
 * Ein Artikel des Gebietermarkts für die Anzeige: der Artikel und das Dokument seiner Datei aus dem Solr-Kern FILE, mit
 * den Feldern, die der Betrachter lesen darf (darunter die Vorschau), seine laufenden Angebote und das, was der
 * Betrachter selbst schon davon hat.
 * <p>
 * Doku: {@code docu/entities/ShopItem.md}.
 *
 * @param shopItem der Artikel: id, Datei, Rubrik, Verkäufer
 * @param fileDocument das Dokument der Datei, nie {@code null}: Artikel, deren Datei der Betrachter nicht lesen darf,
 *            kommen gar nicht in die Liste
 * @param runningShopOffers die Angebote, die gerade im Markt stehen (begonnen, Frist nicht vorbei, nicht ausverkauft),
 *            das älteste zuerst; leer, wenn keins läuft
 * @param ownUsersShopItem was der Betrachter von dieser Datei hat (dauerhaft oder restliche Nutzungen); {@code null},
 *            wenn er nichts davon hat
 */
public record ShopItemForClient(ShopItem shopItem, Map<String, Object> fileDocument, List<ShopOffer> runningShopOffers,
		UsersShopItem ownUsersShopItem) {
}
