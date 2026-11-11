# ShopOrder

> Von Hand im Format von `docu/tools/generate_entity_docs.py` geschrieben (2026-11-11), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Der Beleg eines Kaufs im Gebietermarkt (Nutzer 2026-11-09: nachweisen, wer welches Item wann gekauft hat): wer, welches Angebot, welche Datei, zu welchem Preis, wann. Wird nur angelegt, nie geändert. Preis und Form des Kaufs sind hier festgeschrieben, weil das Angebot ([ShopOffer](ShopOffer.md)) später geändert wird oder verschwindet. Die Buchung im Kontobuch ([UsersPointBooking](UsersPointBooking.md)) bezieht sich auf die id dieses Belegs; so kann ein User dasselbe Angebot mehrmals kaufen. Lose gekoppelt, ohne JPA-Beziehung. Zusammenspiel mit Beispiel: [`konzept-shop.md`](../konzept-shop.md), Abschnitt 11.

- **Tabelle:** `shop_order`, Index `shop_order_users_guid`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/shop/model/ShopOrder.java`](../../code/backend/src/main/java/de/gebiter/shop/model/ShopOrder.java)
- **Frontend-Typ:** [`code/frontend/src/shop/ShopOrder.ts`](../../code/frontend/src/shop/ShopOrder.ts)
- **DTOs:** `NewShopOrder`

## Regeln: Kaufen (gebaut 2026-11-11, Nutzer: „Memes hochladen können. Und auch kaufen können“)

- **Ein Kauf** ist `POST /api/shop-order` mit `{"shopOfferId": 22}`. Der Client schickt nur das Angebot; Preis, Form des Kaufs und Datei bestimmt das Backend aus dem Angebot.
- **Alles oder nichts:** Der Kauf läuft in einer Transaktion (`ShopOrderService.createShopOrder`). Danach steht alles da oder nichts:
  1. Abgelehnt werden der eigene Artikel und ein Artikel, den der User schon dauerhaft hat.
  2. Die Punkte müssen reichen.
  3. Das Angebot zählt den Kauf hoch, in EINER Anweisung in der Datenbank und nur, solange es läuft (begonnen, Frist nicht vorbei, Stückzahl nicht ausverkauft). Zwei gleichzeitige Käufe können nicht beide das letzte Stück bekommen.
  4. Der Beleg entsteht (diese Tabelle), Preis und Form festgeschrieben.
  5. Punkte, nur über das Kontobuch ([UsersPointBooking](UsersPointBooking.md)): Der Preis geht beim Käufer ab (`SHOP_PURCHASE`). Der Verkäufer bekommt den Preis abzüglich der Marktgebühr (`SHOP_SALE`); die Gebühr verschwindet aus dem Umlauf. Bei Preis 0 wird nichts gebucht.
  6. Der Käufer bekommt den Besitz ([UsersShopItem](UsersShopItem.md)): dauerhaft oder die Nutzungen dazu.
- **Marktgebühr:** `gebiter.shop.market-fee-percent` in der `application.yaml`, zurzeit 10 (Nutzer 2026-11-10). Die Gebühr wird auf ganze Punkte abgerundet, der Verkäufer bekommt den Rest. Beispiel: Preis 85 → Gebühr 8, Verkäufer 77. Preis 5 → Gebühr 0, Verkäufer 5.
- **Abgelehnt mit 409** (`ShopOrderRejectedException`), gebucht ist dann nichts: „Deinen eigenen Artikel kannst du nicht kaufen.“, „Diesen Artikel hast du schon dauerhaft.“, „Deine Punkte reichen nicht: Das Angebot kostet 80 Punkte, du hast 30.“, „Dieses Angebot läuft nicht mehr: abgelaufen oder ausverkauft.“
- **Ein Kauf läuft nie ab** (Nutzer 2026-11-11). Dasselbe Angebot kann ein User mehrmals kaufen (Nutzungen addieren sich).
- **Oberfläche:** An der Kachel eines Artikels steht je laufendem Angebot der Knopf „Kaufen“ (nicht am eigenen Artikel, nicht bei dauerhaftem Besitz). Er öffnet die Bestätigung: Vorschau und Überschrift, was man bekommt, Preis, Punktestand jetzt und danach. Erst „Für 80 Punkte kaufen“ kauft. Reichen die Punkte nicht, ist der Knopf gesperrt.
- **Noch nicht gebaut:** die Liste der eigenen Belege, Rückgabe, Schutz gegen doppeltes Absenden über eine Kauf-GUID (der Knopf ist während des Kaufs gesperrt), das Nutzen (Zähler herunter). Wird ein Angebot später änderbar, muss der Kauf den Preis mitschicken, den der User gesehen hat.

Beispiel: Das 10er-Paket der Kuh (Angebot 22) kostet 80 Punkte. Bob hat 120 Punkte und klickt „Kaufen“, dann „Für 80 Punkte kaufen“. Danach: Bob hat 40 Punkte und 10 Nutzungen der Kuh, die Verkäuferin Carla hat 72 Punkte mehr, 8 Punkte sind weg, Beleg 41 steht in `shop_order`, das Angebot steht auf 1 von 10 verkauft. Im Kontoauszug von Bob steht „Kauf im Gebietermarkt −80“, bei Carla „Verkauf im Gebietermarkt +72“.

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Bob hat das 10er-Paket (Angebot 22) für 80 Punkte gekauft.

```json
{
  "id": 41,
  "usersGuid": "019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b",
  "shopOfferId": 22,
  "fileDocumentId": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "pricePoints": 80,
  "permanent": false,
  "grantedUsageCount": 10,
  "orderedAt": "2026-11-11T13:30:00Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, Spalte `users_guid`, unveränderlich | ja | Wer gekauft hat. |
| `shopOfferId` | `Long` | Pflicht, unveränderlich | ja | Welches Angebot gekauft wurde: die id des [ShopOffer](ShopOffer.md); das Angebot selbst kann inzwischen weg sein. |
| `fileDocumentId` | `String` | Pflicht, max. 64 Zeichen, unveränderlich | ja | id der gekauften Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. |
| `pricePoints` | `long` | Pflicht, unveränderlich | ja | Der bezahlte Preis in Punkten, beim Kauf festgeschrieben. |
| `permanent` | `boolean` | Pflicht, unveränderlich | ja | Der Kauf galt dauerhaft, beim Kauf festgeschrieben. |
| `grantedUsageCount` | `int` | Pflicht, unveränderlich | ja | So viele Nutzungen brachte der Kauf, beim Kauf festgeschrieben; bei einem dauerhaften Kauf 0. |
| `orderedAt` | `Instant` | Pflicht, unveränderlich | ja | Wann gekauft wurde. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/shop-order` | [`ShopOrderController.createShopOrder`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopOrderController.java) | `NewShopOrder`, Antwort `ShopOrder` |

Für jeden angemeldeten User. Antworten bei Fehlern: `shopOfferId` fehlt 400, unbekanntes Angebot 404, Kauf kommt nicht zustande 409 (Gründe oben).

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/shop/repository/ShopOrderRepository.java`](../../code/backend/src/main/java/de/gebiter/shop/repository/ShopOrderRepository.java): nur die Standardmethoden
- [`code/backend/src/main/java/de/gebiter/shop/service/ShopOrderService.java`](../../code/backend/src/main/java/de/gebiter/shop/service/ShopOrderService.java): `createShopOrder`, `doBookShopOrderPoints`; nutzt `ShopOfferService.getShopOffer` und `increaseShopOfferPurchaseCount`, `ShopItemService.getShopItem`, `UsersShopItemService.getUsersShopItemOrNull` und `grantUsersShopItem`, `UsersService.getUsersPoints`, `UsersPointBookingService.createShopPurchaseBooking` und `createShopSaleBooking`
- [`code/backend/src/main/java/de/gebiter/shop/controller/ShopOrderController.java`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopOrderController.java): `createShopOrder`
- [`code/backend/src/main/java/de/gebiter/shop/dto/NewShopOrder.java`](../../code/backend/src/main/java/de/gebiter/shop/dto/NewShopOrder.java): `(Record-Komponenten)`
- [`code/backend/src/main/java/de/gebiter/shop/ShopOrderRejectedException.java`](../../code/backend/src/main/java/de/gebiter/shop/ShopOrderRejectedException.java): wird im `GlobalExceptionHandler` zu 409
- `application.yaml`: `gebiter.shop.market-fee-percent`

## Verwendung im Frontend

- [`code/frontend/src/shop/useShopOrder.ts`](../../code/frontend/src/shop/useShopOrder.ts): `useShopOrder`, `createShopOrder`; leert danach den Bereich `SHOP_ITEM` im Zwischenspeicher der Ansichten
- [`code/frontend/src/market/BuyShopOfferPopup.tsx`](../../code/frontend/src/market/BuyShopOfferPopup.tsx): die Bestätigung eines Kaufs, `handleBuy`; der Punktestand kommt frisch aus `useUsersPointBooking`
- [`code/frontend/src/market/MarketCategoryTab.tsx`](../../code/frontend/src/market/MarketCategoryTab.tsx): `renderShopOffers` (Knopf „Kaufen“ je Angebot, Zeile „Du hast …“)
- Texte: [`code/frontend/src/market/marketTexts.ts`](../../code/frontend/src/market/marketTexts.ts)

## Getestet (2026-11-11, Wegwerf-Test gegen die Pi-DB mit Rollback, danach gelöscht)

Zwei Wegwerf-User (Verkäufer 0 Punkte, Käufer 1000), zwei Artikel, vier Angebote. Paket für 85 (10 Nutzungen, 2 Stück): Käufer 915, Verkäufer 77, Besitz 10 Nutzungen, 1 von 2 verkauft. Noch einmal: 830, 154, 20 Nutzungen, 2 von 2. Zum dritten Mal: 409 „läuft nicht mehr“, alles unverändert. Dauerhaft für 500: 330, 604, Besitz dauerhaft. Noch einmal dauerhaft: 409. Angebot für 1 000 000: 409 mit Preis und Stand. Kostenlos (0 Punkte, 1 Nutzung): 200, keine Buchung, Besitz 1 Nutzung. Unbekanntes Angebot 404, ohne `shopOfferId` 400, Verkäufer kauft eigenen Artikel 409. Im Kontobuch je bezahltem Kauf zwei Zeilen (`SHOP_PURCHASE` −, `SHOP_SALE` +) mit der id des Belegs. Dazu das echte Angebot aus der Pi-DB (50 Punkte, dauerhaft) von einem Wegwerf-User gekauft: 200, die Anzeige der Rubrik liefert danach `ownUsersShopItem` dauerhaft. Alles zurückgerollt; die Zähler der ids (`shop_order`, `shop_offer`, `shop_item`) sind dabei weitergelaufen. **Nicht getestet:** die Oberfläche im Browser und zwei wirklich gleichzeitige Käufe.
