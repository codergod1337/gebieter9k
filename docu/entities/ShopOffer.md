# ShopOffer

> Von Hand im Format von `docu/tools/generate_entity_docs.py` geschrieben (2026-11-11), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Ein Angebot im Gebietermarkt: zu welchem Preis, in welcher Form und wie lange ein Artikel ([ShopItem](ShopItem.md)) zu kaufen ist (Nutzer 2026-11-10 und 2026-11-11). Ein Artikel kann mehrere Angebote haben, z. B. unbegrenzt nutzbar für 500 Punkte und daneben ein 10er-Paket für 80 Punkte.

- **Laufzeit:** dauerhaft im Markt oder befristet bis zu einem Zeitpunkt (`endsAt`).
- **Nutzung:** der Käufer darf den Artikel unbegrenzt nutzen (`permanent`) oder bekommt eine Anzahl Nutzungen (`grantedUsageCount`, z. B. 10 Posts).
- **Stückzahl:** wahlweise höchstens so viele Käufe (`maxPurchaseCount`), nur bei einer Anzahl Nutzungen.

Das Angebot verschwindet irgendwann aus dem Markt. Was ein User gekauft hat, hängt nicht an ihm: Es steht in [UsersShopItem](UsersShopItem.md), der Beleg in [ShopOrder](ShopOrder.md). Lose gekoppelt, ohne JPA-Beziehung. Zusammenspiel mit Beispiel: [`konzept-shop.md`](../konzept-shop.md), Abschnitt 11.

- **Tabelle:** `shop_offer`, Index `shop_offer_shop_item_id`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/shop/model/ShopOffer.java`](../../code/backend/src/main/java/de/gebiter/shop/model/ShopOffer.java)
- **Frontend-Typ:** [`code/frontend/src/shop/ShopOffer.ts`](../../code/frontend/src/shop/ShopOffer.ts) (`ShopOffer`, `NewShopOffer`)
- **DTOs:** `NewShopOffer` (Request Body von `POST /api/shop-offer`); `ShopOffer` steckt in `ShopItemForClient`

## Regeln (Nutzer 2026-11-10 und 2026-11-11)

- **Ein Angebot entsteht im geführten Ablauf „neues Angebot“** (Nutzer 2026-11-11: ein eigener Knopf, Schritt für Schritt, Eingaben nur, wenn die Wahl sie braucht). Der Knopf steht oben rechts im Tab einer Rubrik des Gebietermarkts und öffnet ein Popup:
  1. **Datei hochladen** (der globale Upload-Ablauf). Die Datei wird dabei zum Artikel der Rubrik, noch ohne Angebot. Weiter geht es, sobald mindestens eine Datei oben ist.
  2. **Wie lange steht das Angebot im Markt?** Dauerhaft oder befristet; „Bis wann?“ erscheint nur bei befristet.
  3. **Wie oft darf der Käufer es benutzen?** Der Haken „Unbegrenzt“; ohne Haken erscheint „So oft darf der Käufer es benutzen (je Kauf)“.
  4. **Was kostet es?** Preis in Punkten; ohne „Unbegrenzt“ wahlweise „Nur eine bestimmte Stückzahl verkaufen“ mit „Wie viele Stück gibt es?“. Darunter steht das Angebot in einer Zeile. Dann „Angebot erstellen“.
- Das Angebot gilt für jede Datei, die im ersten Schritt hochgeladen wurde, und ab dem Anlegen (`startsAt`).
- **Abgebrochen nach dem Hochladen:** Der Artikel steht ohne Angebot in der Rubrik („zurzeit kein Angebot“). Sein Verkäufer (und der Admin) hat an der Kachel „Angebot erstellen“; das beginnt den Ablauf bei Schritt 2.
- **Wer darf:** der Verkäufer des Artikels (wer die Datei in den Markt hochgeladen hat) und der ADMIN (`ShopItemService.createShopOfferOfOwnShopItem`), sonst 403.
- **Geprüft wird** (`ShopOfferService.requireValidNewShopOffer`): Preis da und nicht negativ; entweder unbegrenzt nutzbar oder mindestens eine Nutzung je Kauf; ein befristetes Angebot endet in der Zukunft; eine Stückzahl ist mindestens 1; mit Stückzahl gibt es keinen unbegrenzten Kauf, nur Nutzungen. Sonst 400 mit der Meldung.
- **Laufend** ist ein Angebot, wenn es begonnen hat, nicht abgelaufen und nicht ausverkauft ist. Nur laufende Angebote kommen mit den Artikeln einer Rubrik zum Client und stehen an der Kachel, z. B. „80 Punkte · 10 Nutzungen · bis 01.12.2026, 00:00 · noch 7 von 10“ oder „500 Punkte · unbegrenzt nutzbar“.
- **Kaufen** (gebaut 2026-11-11): An der Kachel steht je laufendem Angebot der Knopf „Kaufen“. Der Kauf zählt `purchaseCount` in EINER Anweisung hoch und nur, solange das Angebot läuft (`ShopOfferService.increaseShopOfferPurchaseCount`); alles Weitere steht bei [ShopOrder](ShopOrder.md).
- **Noch nicht gebaut:** ein Angebot ändern oder beenden.

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Ein 10er-Paket, das bis zum 1. Dezember und höchstens 10 Mal zu kaufen ist; 3 sind schon weg.

```json
{
  "id": 22,
  "shopItemId": 7,
  "pricePoints": 80,
  "permanent": false,
  "grantedUsageCount": 10,
  "startsAt": "2026-11-11T13:00:00Z",
  "endsAt": "2026-12-01T00:00:00Z",
  "maxPurchaseCount": 10,
  "purchaseCount": 3
}
```

Anlegen (`NewShopOffer`): `{"fileDocumentId": "9f86…0a08", "pricePoints": 80, "permanent": false, "grantedUsageCount": 10, "endsAt": "2026-12-01T00:00:00Z", "maxPurchaseCount": 10}`. Dauerhaft im Markt und unbegrenzt nutzbar: `{"fileDocumentId": "9f86…0a08", "pricePoints": 500, "permanent": true}`.

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `shopItemId` | `Long` | Pflicht, Spalte `shop_item_id`, unveränderlich | ja | Welcher Artikel angeboten wird: die id des [ShopItem](ShopItem.md). |
| `pricePoints` | `long` | Pflicht | ja | Der Preis eines Kaufs in Punkten. |
| `permanent` | `boolean` | Pflicht, unveränderlich | ja | Der Käufer darf den Artikel unbegrenzt nutzen (in der Oberfläche: „Unbegrenzt“). |
| `grantedUsageCount` | `int` | Pflicht, unveränderlich | ja | So viele Nutzungen bringt ein Kauf, z. B. 10; bei „Unbegrenzt“ 0. |
| `startsAt` | `Instant` | Pflicht | ja | Ab wann das Angebot im Markt steht: der Zeitpunkt des Anlegens. |
| `endsAt` | `Instant` |  | ja | Befristet: bis wann das Angebot im Markt steht; `null`: dauerhaft. |
| `maxPurchaseCount` | `Integer` |  | ja | So oft kann das Angebot höchstens gekauft werden (Stückzahl), z. B. 10; `null`: unbegrenzt. |
| `purchaseCount` | `int` | Pflicht | ja | So oft wurde das Angebot schon gekauft. Ohne Setter: Der Kauf zählt in der Datenbank in einer Anweisung hoch. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/shop-offer` | [`ShopOfferController.createShopOfferOfOwnShopItem`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopOfferController.java) | `NewShopOffer`, Antwort `ShopOffer` |
| POST | `/api/shop-item/resolve` | [`ShopItemController.resolveShopItems`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopItemController.java) | je Artikel `runningShopOffers`: Liste von `ShopOffer` |

Für jeden angemeldeten User. Antworten des Anlegens bei Fehlern: Angabe fehlt oder passt nicht 400, die Datei ist kein Artikel im Markt 404, fremder Artikel 403.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/shop/repository/ShopOfferRepository.java`](../../code/backend/src/main/java/de/gebiter/shop/repository/ShopOfferRepository.java): `findAllByShopItemIdInOrderByIdAsc`, `increasePurchaseCountIfRunning` (atomar, nur solange das Angebot läuft)
- [`code/backend/src/main/java/de/gebiter/shop/service/ShopOfferService.java`](../../code/backend/src/main/java/de/gebiter/shop/service/ShopOfferService.java): `requireValidNewShopOffer`, `createShopOffer` (nur vom `ShopItemService` gerufen), `getShopOffer`, `getRunningShopOffersByShopItemId`, `increaseShopOfferPurchaseCount` (nur vom `ShopOrderService` gerufen, in der Transaktion des Kaufs), `doGetShopOffer`, `isPermanent`, `isRunning`
- [`code/backend/src/main/java/de/gebiter/shop/service/ShopItemService.java`](../../code/backend/src/main/java/de/gebiter/shop/service/ShopItemService.java): `createShopOfferOfOwnShopItem` (prüft Verkäufer oder ADMIN, dann anlegen; steht dort, damit `ShopOfferService` und `ShopItemService` nicht aneinander hängen), `requireCurrentUsersSellerOrAdmin`, `resolveShopItems` (hängt die laufenden Angebote an)
- [`code/backend/src/main/java/de/gebiter/shop/controller/ShopOfferController.java`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopOfferController.java): `createShopOfferOfOwnShopItem`
- [`code/backend/src/main/java/de/gebiter/shop/ShopAccessDeniedException.java`](../../code/backend/src/main/java/de/gebiter/shop/ShopAccessDeniedException.java): wird im `GlobalExceptionHandler` zu 403
- [`ShopOrder.shopOfferId`](../../code/backend/src/main/java/de/gebiter/shop/model/ShopOrder.java) verweist auf die id.

## Verwendung im Frontend

- [`code/frontend/src/market/NewShopOfferPopup.tsx`](../../code/frontend/src/market/NewShopOfferPopup.tsx): der geführte Ablauf „neues Angebot“ (Schritte Hochladen, Laufzeit, Nutzung, Preis), `handleUploaded`, `handleNext`, `handleBack`, `handleCreate`
- [`code/frontend/src/market/shopOfferInput.ts`](../../code/frontend/src/market/shopOfferInput.ts): `ShopOfferInput`, `getDurationStepError`, `getUsageStepError`, `getPriceStepError`, `createNewShopOfferOfInput` (dieselben Regeln wie im Backend; was eine Wahl ausblendet, zählt nicht)
- [`code/frontend/src/market/shopOfferSummary.ts`](../../code/frontend/src/market/shopOfferSummary.ts): `getShopOfferSummary`, ein Angebot in einer Zeile
- [`code/frontend/src/market/MarketCategoryTab.tsx`](../../code/frontend/src/market/MarketCategoryTab.tsx): der Knopf „neues Angebot“, `renderShopOffers` (das laufende Angebot im Fuß jeder Kachel, sonst „Angebot erstellen“ für den Verkäufer)
- [`code/frontend/src/shop/useShopOffer.ts`](../../code/frontend/src/shop/useShopOffer.ts): `useShopOffer`, `createShopOfferOfOwnShopItem`; leert danach den Bereich `SHOP_ITEM` im Zwischenspeicher der Ansichten
- Texte: [`code/frontend/src/market/marketTexts.ts`](../../code/frontend/src/market/marketTexts.ts)

## Getestet (2026-11-11, Wegwerf-Test gegen die Pi-DB mit Rollback, danach gelöscht)

Ein Artikel wie nach dem Einchecken, ohne Angebot (kein laufendes Angebot). Der Verkäufer (normaler User) legt ein befristetes 10er-Paket mit Stückzahl an (200) und ein zweites Angebot, dauerhaft und unbegrenzt nutzbar (200). Ohne Preis 400, unbegrenzt mit Stückzahl 400, eine Datei, die kein Artikel ist, 404, eine id, die keine Prüfsumme ist, 400. Ein anderer normaler User 403, ein Admin mit anderer GUID 200. Danach laufen drei Angebote zum Artikel. **Nicht getestet:** die Oberfläche und ein ganzer Upload mit echter Datei.
