# UsersShopItem

> Von Hand im Format von `docu/tools/generate_entity_docs.py` geschrieben (2026-11-11), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Was ein User von einem Artikel des Gebietermarkts zur Verfügung hat (Nutzer 2026-11-11: eine Entity für die gekauften bzw. überhaupt die Artikel eines Users): dauerhaft oder noch eine Anzahl Nutzungen. Je User und Datei gibt es höchstens eine Zeile (`uq_users_shop_item`); jeder weitere Kauf ändert sie.

Die Zeile zeigt auf die Datei im Solr-Kern [FILE](../solr-cores/FILE.md), nicht auf das Angebot und nicht auf den Artikel im Markt: Verschwindet das Angebot ([ShopOffer](ShopOffer.md)), bleibt sie mit ihren restlichen Nutzungen stehen. Lose gekoppelt, ohne JPA-Beziehung. Zusammenspiel mit Beispiel: [`konzept-shop.md`](../konzept-shop.md), Abschnitt 11.

- **Tabelle:** `users_shop_item`, eindeutig je `users_guid` und `file_document_id`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/shop/model/UsersShopItem.java`](../../code/backend/src/main/java/de/gebiter/shop/model/UsersShopItem.java)
- **Frontend-Typ:** [`code/frontend/src/shop/UsersShopItem.ts`](../../code/frontend/src/shop/UsersShopItem.ts)

## Regeln (gebaut 2026-11-11 mit dem Kaufen)

- **Besitz entsteht nur durch einen Kauf** ([ShopOrder](ShopOrder.md)), in dessen Transaktion (`UsersShopItemService.grantUsersShopItem`). Einen Endpunkt, der Besitz anlegt oder ändert, gibt es nicht.
- **Aufstocken:** Hat der User von der Datei schon etwas, ändert der Kauf seine Zeile in einer Anweisung: Nutzungen kommen dazu, ein dauerhafter Kauf setzt `permanent`. Sonst entsteht die Zeile.
- **Dauerhaft bleibt dauerhaft:** Wer einen Artikel dauerhaft hat, kann ihn nicht noch einmal kaufen (409). Restliche Nutzungen bleiben in der Zeile stehen, zählen aber nicht mehr.
- **Ein Kauf läuft nie ab** (Nutzer 2026-11-11: „Was man hat, hat man, bis man es benutzt hat“).
- **Anzeige:** Die Artikel einer Rubrik kommen mit dem, was der Betrachter selbst davon hat (`ShopItemForClient.ownUsersShopItem`); an der Kachel steht „Du hast es dauerhaft.“ oder „Du hast noch 7 Nutzungen.“
- **Noch nicht gebaut:** das Nutzen (Zähler herunter, z. B. beim Posten im Gästebuch), eine eigene Übersicht „Was ich habe“.

Beispiel: Bob hat von der Kuh noch 7 Nutzungen. Kauft er ein 10er-Paket, stehen 17 da. Kauft er sie danach dauerhaft, steht `permanent` true und die 17 zählen nicht mehr.

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Bob hat von einem 10er-Paket noch 7 Nutzungen.

```json
{
  "id": 3,
  "usersGuid": "019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b",
  "fileDocumentId": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "permanent": false,
  "remainingUsageCount": 7
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, Spalte `users_guid`, unveränderlich | ja | Wem es gehört. |
| `fileDocumentId` | `String` | Pflicht, max. 64 Zeichen, Spalte `file_document_id`, unveränderlich | ja | id der Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. |
| `permanent` | `boolean` | Pflicht | ja | Der User hat den Artikel dauerhaft und darf ihn beliebig oft nutzen; die restlichen Nutzungen zählen dann nicht. |
| `remainingUsageCount` | `int` | Pflicht | ja | So viele Nutzungen hat der User noch, z. B. 7 von einem 10er-Paket. Ohne Setter: Kauf und Nutzung zählen in der Datenbank in einer Anweisung, damit zwei gleichzeitige Posts nicht dieselbe Nutzung verbrauchen. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/shop-item/resolve` | [`ShopItemController.resolveShopItems`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopItemController.java) | je Artikel `ownUsersShopItem`: `UsersShopItem` des Betrachters oder `null` |

Einen eigenen Endpunkt hat die Entity noch nicht.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/shop/repository/UsersShopItemRepository.java`](../../code/backend/src/main/java/de/gebiter/shop/repository/UsersShopItemRepository.java): `findByUsersGuidAndFileDocumentId`, `findAllByUsersGuidAndFileDocumentIdIn`, `markPermanent`, `increaseRemainingUsageCount` (beide ändern in einer Anweisung)
- [`code/backend/src/main/java/de/gebiter/shop/service/UsersShopItemService.java`](../../code/backend/src/main/java/de/gebiter/shop/service/UsersShopItemService.java): `grantUsersShopItem` (nur vom `ShopOrderService` gerufen), `getUsersShopItemOrNull`, `getOwnUsersShopItemsByFileDocumentId`
- [`code/backend/src/main/java/de/gebiter/shop/service/ShopOrderService.java`](../../code/backend/src/main/java/de/gebiter/shop/service/ShopOrderService.java): `createShopOrder` prüft „schon dauerhaft“ und gibt den Besitz
- [`code/backend/src/main/java/de/gebiter/shop/service/ShopItemService.java`](../../code/backend/src/main/java/de/gebiter/shop/service/ShopItemService.java): `resolveShopItems` hängt den Besitz des Betrachters an jeden Artikel
- [`code/backend/src/main/java/de/gebiter/shop/dto/ShopItemForClient.java`](../../code/backend/src/main/java/de/gebiter/shop/dto/ShopItemForClient.java): `ownUsersShopItem`

## Verwendung im Frontend

- [`code/frontend/src/shop/ShopItem.ts`](../../code/frontend/src/shop/ShopItem.ts): `ShopItemForClient.ownUsersShopItem`
- [`code/frontend/src/market/MarketCategoryTab.tsx`](../../code/frontend/src/market/MarketCategoryTab.tsx): `renderShopOffers` zeigt „Du hast …“ und blendet „Kaufen“ bei dauerhaftem Besitz aus
- [`code/frontend/src/market/BuyShopOfferPopup.tsx`](../../code/frontend/src/market/BuyShopOfferPopup.tsx): „Du hast schon 7 Nutzungen, danach sind es 17.“

## Getestet

Mit dem Kaufen, siehe [ShopOrder](ShopOrder.md), „Getestet“.
