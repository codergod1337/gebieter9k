# ShopItem

> Von Hand im Format von `docu/tools/generate_entity_docs.py` geschrieben (2026-11-11), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Ein Artikel im Gebietermarkt: eine Datei aus dem Solr-Kern [FILE](../solr-cores/FILE.md), die in einer Rubrik zum Kauf steht (Nutzer 2026-11-11: der Artikel liegt immer im Kern FILE, mit seiner id). Der Artikel sagt nur, DASS die Datei zu kaufen ist. Zu welchem Preis und wie lange, sagt ein [ShopOffer](ShopOffer.md); was ein User davon hat, steht in [UsersShopItem](UsersShopItem.md). Eine Datei ist höchstens ein Artikel, das sichert die Datenbank (`uq_shop_item_file_document_id`). Lose gekoppelt, ohne JPA-Beziehung: Die Datei ist ein Solr-Dokument, die Rubrik nur ihr Key. Zusammenspiel mit Beispiel: [`konzept-shop.md`](../konzept-shop.md), Abschnitt 11.

- **Tabelle:** `shop_item`, eindeutig je `file_document_id`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/shop/model/ShopItem.java`](../../code/backend/src/main/java/de/gebiter/shop/model/ShopItem.java)
- **Frontend-Typ:** [`code/frontend/src/shop/ShopItem.ts`](../../code/frontend/src/shop/ShopItem.ts) (`ShopItem`, `ShopItemForClient`)
- **DTOs:** `ShopItemForClient`, `ShopItemResolveRequest`; beim Hochladen `FileUploadIntoShopCategoryData`, `FileUploadResult`

## Regeln (Nutzer 2026-11-11)

- **Ein Artikel entsteht nur durch das Hochladen in eine Rubrik** (`POST /api/shop-item/upload`), über den gemeinsamen Upload-Kern wie jede Datei: im ersten Schritt des geführten Ablaufs „neues Angebot“ (Knopf oben rechts im Tab der Rubrik). Sein Angebot ([ShopOffer](ShopOffer.md)) legt der Verkäufer in den Schritten danach an (`POST /api/shop-offer`). Bricht er nach dem Hochladen ab, steht der Artikel ohne Angebot da; an seiner Kachel lässt sich das Angebot nachholen. Einen Endpunkt, der eine beliebige vorhandene Datei zum Artikel macht, gibt es nicht.
- **Die FileClass wählt niemand** (Nutzer 2026-11-11): Jede Rubrik hat genau eine ([ShopCategory](ShopCategory.md), `fileClassKey`), der Upload-Weg setzt sie im Backend fest ins Dokument. Der Client schickt keine; schickt er doch eine, zählt sie nicht.
- **Wer hochladen darf:** wer ein Recht mit dem Schalter „Hochladen“ an der FileClass der Rubrik hat ([FileClassAccessRole](FileClassAccessRole.md)). Beispiel: Die Rubrik „Memes“ hat die FileClass `MEME`, und `MEME` hat bei `USER` „LH“; dann lädt jeder User Memes in die Rubrik „Memes“ hoch. Die Rubrik „Profile-Banner“ hat `PROFILE_BANNER`, dort hat `USER` nur „L“: Ein normaler User sieht dort keinen Knopf „neues Angebot“, und das Backend weist seinen Upload mit 403 ab.
- **Verkäufer** (`sellerUsersGuid`) ist der Uploader. Er bekommt später beim Verkauf die Punkte. `null` ist für Artikel vorgesehen, die der Server verkauft; die gibt es noch nicht.
- **Sichtbarkeit:** Die Datei eines Artikels ist für jeden angemeldeten User sichtbar (`visibility` AUTHENTICATED, vom Upload-Weg gesetzt), sonst sähe im Markt niemand, was er kauft. Dazu braucht der Betrachter wie immer ein Recht mit „Lesen“ an der FileClass.
- **Dublette:** Gibt es dieselben Bytes schon (z. B. in einer Galerie), antwortet der Upload mit EXISTS und es entsteht kein Artikel.
- **Scheitert das Anlegen des Artikels** nach dem Einchecken, bleibt die Datei als gewöhnliche Datei des Uploaders stehen und der Upload meldet den Fehler.
- **Anzeige:** Die Artikel einer Rubrik kommen mit dem Dokument ihrer Datei, so wie der Betrachter es lesen darf (Vorschau inklusive), der neueste zuerst. Artikel, deren Datei er nicht lesen darf oder die nicht mehr aktiv ist, fehlen. Noch ohne Blättern.
- **Kaufen** (gebaut 2026-11-11): steht bei [ShopOrder](ShopOrder.md). Die Artikel einer Rubrik kommen dafür mit dem, was der Betrachter selbst schon hat (`ShopItemForClient.ownUsersShopItem`, [UsersShopItem](UsersShopItem.md)).
- **Noch nicht gebaut:** Ändern (andere Rubrik), Löschen eines Artikels, Aufräumen, wenn die Datei endgültig gelöscht wird.

## Beispiel-JSON

Der Artikel selbst; die Werte sind erfunden.

```json
{
  "id": 7,
  "fileDocumentId": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "shopCategoryKey": "MEMES",
  "sellerUsersGuid": "019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b"
}
```

Für die Anzeige (`ShopItemForClient`): `{"shopItem": { …wie oben… }, "fileDocument": {"id": "9f86…0a08", "fileName": "kuh.png", "tags": ["kuh"], "previewBase64Png": "…", …}, "runningShopOffers": [{"id": 22, "pricePoints": 80, "permanent": false, "grantedUsageCount": 10, …}]}`. Hochladen, Teil `data` (`FileUploadIntoShopCategoryData`): `{"shopCategoryKey": "MEMES", "fieldValuesByFieldName": {"fileClassKey": "MEME", "tags": ["kuh"]}}`, danach der Teil `file`. Auflösen (`ShopItemResolveRequest`): `{"shopCategoryKey": "MEMES"}`.

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `fileDocumentId` | `String` | Pflicht, max. 64 Zeichen, Spalte `file_document_id`, unveränderlich, eindeutig | ja | id der Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. |
| `shopCategoryKey` | `String` | Pflicht, max. 100 Zeichen | ja | In welcher Rubrik der Artikel steht: der Key der [ShopCategory](ShopCategory.md). |
| `sellerUsersGuid` | `UUID` | Spalte `seller_users_guid`, unveränderlich | ja | Wer den Artikel eingestellt hat: der Uploader. Er bekommt beim Verkauf die Punkte. `null` ist für Artikel des Servers vorgesehen. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/shop-item/upload` | [`ShopItemController.uploadFileIntoShopCategory`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopItemController.java) | Multipart: `FileUploadIntoShopCategoryData`, dann die Datei; Antwort `FileUploadResult` |
| POST | `/api/shop-item/resolve` | [`ShopItemController.resolveShopItems`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopItemController.java) | `ShopItemResolveRequest`, Liste von `ShopItemForClient` |

Beide für jeden angemeldeten User. Antworten des Uploads bei Fehlern, alle vor dem ersten Byte der Datei: unbekannte Rubrik 404, Endung für die FileClass der Rubrik nicht freigeschaltet 400, kein Recht zum Hochladen an der FileClass der Rubrik 403. Der Pfad `/api/shop-item/upload` steht in der Liste der Upload-Wege der nginx-`default.conf` (sonst gälten 20 MB).

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/shop/repository/ShopItemRepository.java`](../../code/backend/src/main/java/de/gebiter/shop/repository/ShopItemRepository.java): `findAllByShopCategoryKeyOrderByIdDesc`, `existsByFileDocumentId`
- [`code/backend/src/main/java/de/gebiter/shop/service/ShopItemService.java`](../../code/backend/src/main/java/de/gebiter/shop/service/ShopItemService.java): `prepareShopCategoryUpload` (Rubrik prüfen, Sichtbarkeit fürs Dokument), `createShopItemOfUploadedFile`, `getShopItem` (für den Kauf: Datei und Verkäufer), `resolveShopItems` (mit laufenden Angeboten und dem Besitz des Betrachters), `requireExistingShopCategory`
- [`code/backend/src/main/java/de/gebiter/file/service/FileUploadService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileUploadService.java): `uploadFileIntoShopCategory` (der Upload-Weg des Markts: setzt die FileClass der Rubrik über `ShopCategoryService.getFileClassKeyOfShopCategory` in die Felder), `doUploadFromMultipart` (der gemeinsame Kern: Recht „Hochladen“, Endung, Grenze), `doCheckInFile` (legt nach dem Einchecken den Artikel an)
- [`code/backend/src/main/java/de/gebiter/shop/controller/ShopItemController.java`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopItemController.java): `uploadFileIntoShopCategory`, `resolveShopItems`
- [`ShopOffer.shopItemId`](../../code/backend/src/main/java/de/gebiter/shop/model/ShopOffer.java) verweist auf die id.

## Verwendung im Frontend

- [`code/frontend/src/shop/useShopItem.ts`](../../code/frontend/src/shop/useShopItem.ts): `useShopItem`, `uploadFileIntoShopCategory`, `resolveShopItems`; leert nach dem Hochladen die Bereiche `FILE_DOCUMENT` und `SHOP_ITEM` im Zwischenspeicher der Ansichten ([`shopItemViewCacheScope.ts`](../../code/frontend/src/shop/shopItemViewCacheScope.ts))
- [`code/frontend/src/market/MarketUploadBox.tsx`](../../code/frontend/src/market/MarketUploadBox.tsx): der Upload-Schritt von „neues Angebot“, über den globalen Upload-Ablauf (`FileUploadForm` mit `fixedFileClass`: die FileClass der Rubrik wird nur gezeigt, nicht gewählt und nicht mitgeschickt), je Datei Beschreibung und Tags
- [`code/frontend/src/market/NewShopOfferPopup.tsx`](../../code/frontend/src/market/NewShopOfferPopup.tsx): der geführte Ablauf, Schritt 1 ist das Hochladen
- [`code/frontend/src/market/MarketCategoryTab.tsx`](../../code/frontend/src/market/MarketCategoryTab.tsx): oben rechts „neues Angebot“ (nur wer die FileClass der Rubrik hochladen darf), darunter die Artikel als Bildkacheln (`GalleryImageTile`: Vorschau, Stimmen, Info, Download, im Fuß das Angebot); ein Klick auf das Bild öffnet die Seite der Datei mit „Zurück zu <Rubrik>“

## Getestet (2026-11-11, Wegwerf-Test gegen die Pi-DB, danach gelöscht)

Ohne echte Datei, alles vor dem ersten Byte oder mit Rollback: unbekannte Rubrik 404, `MEME` in einer Rubrik ohne Haken 400, ohne Rubrik 400, als normaler User `DOKUMENT` (nur lesen) 403; die Felder des Upload-Wegs sind `visibility` AUTHENTICATED; Artikel anlegen wie nach dem Einchecken (Verkäufer = angemeldeter User), doppelt abgewiesen, Auflösen einer Rubrik (200), einer unbekannten (404). **Nicht getestet:** ein ganzer Upload mit echter Datei bis zur Kachel; das prüft der Nutzer in der Oberfläche.

Seit dem Umbau „eine FileClass je Rubrik“ (2026-11-11) gibt es den Fall „Rubrik ohne Haken“ nicht mehr; die neuen Fälle des Upload-Wegs stehen bei [ShopCategory](ShopCategory.md), „Getestet“.
