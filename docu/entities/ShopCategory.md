# ShopCategory

> Von Hand im Format von `docu/tools/generate_entity_docs.py` geschrieben (2026-11-11), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Eine Rubrik im Gebietermarkt (Nutzer 2026-11-10: aufgebaut wie die Galerien, ein Shop-Manager, darin Rubriken, in den Rubriken die Bilder zum Kauf), z. B. „Sticker“. Der Admin legt sie an und sortiert sie; jeder Artikel ([ShopItem](ShopItem.md)) steht in genau einer Rubrik. Jede Rubrik hat genau eine FileClass (Nutzer 2026-11-11: „in einer Rubrik für den Markt würde ich immer eine File-Class voraussetzen“): Was in die Rubrik hochgeladen wird, bekommt sie, der Upload wählt sie nicht. Wie die fünf Tabellen des Markts zusammenspielen, steht mit einem Beispiel in [`konzept-shop.md`](../konzept-shop.md), Abschnitt 11.

- **Tabelle:** `shop_category`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/shop/model/ShopCategory.java`](../../code/backend/src/main/java/de/gebiter/shop/model/ShopCategory.java)
- **Frontend-Typ:** [`code/frontend/src/shop/ShopCategory.ts`](../../code/frontend/src/shop/ShopCategory.ts)

## Regeln

- Anlegen, ändern und sortieren darf nur der Admin; die Liste liest jeder angemeldete User.
- Der Key ändert sich nie, geändert werden der Anzeigename und die FileClass. Der Platz ändert sich nur über die Reihenfolge (Drag and Drop), nie über das Ändern einer Rubrik.
- **Die FileClass ist Pflicht** (`fileClassKey`), beim Anlegen und beim Ändern; es muss sie geben. Der Upload in die Rubrik ([ShopItem](ShopItem.md)) setzt sie im Backend fest ins Dokument; schickt der Client eine andere, zählt sie nicht. Ein Angebot einstellen kann in der Rubrik, wer diese FileClass hochladen darf (Schalter „Hochladen“, [FileClassAccessRole](FileClassAccessRole.md)).
- Ändert der Admin die FileClass einer Rubrik, gilt die neue für alles, was danach hochgeladen wird. Dateien, die schon in der Rubrik stehen, behalten ihre.
- Die frühere Zuordnungstabelle `shop_category_file_class` (mehrere FileClasses je Rubrik, Haken im Tab „FileClass-Ziel“) gibt es seit dem 2026-11-11 nicht mehr.
- Eine neue Rubrik landet am Ende der Liste.
- **Löschen gibt es noch nicht.** Was dann mit den Artikeln der Rubrik geschieht, wird vorher mit dem Nutzer besprochen.

Beispiel: Der Admin legt `STICKER` „Sticker“ mit der FileClass `FOTO_ART` an (Platz 1), dann `BANNER` „Banner“ mit `PROFILE_BANNER` (Platz 2). Zieht er „Banner“ nach oben, steht `BANNER` auf Platz 1 und `STICKER` auf Platz 2. Lädt Bob im Markt in „Sticker“ ein Bild hoch, wählt er keine FileClass: Das Dokument bekommt `FOTO_ART`.

Stand der Pi-DB 2026-11-11: `MEMES` → `MEME`, `PROFILE_BANNER` → `PROFILE_BANNER`.

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden.

```json
{
  "key": "STICKER",
  "displayName": {
    "de": "Sticker"
  },
  "fileClassKey": "FOTO_ART",
  "listingPosition": 1
}
```

Anlegen: `{"key": "STICKER", "displayName": {"de": "Sticker"}, "fileClassKey": "FOTO_ART"}`. Ändern: dasselbe Objekt mit neuem Namen oder neuer FileClass. Reihenfolge: `{"keysInOrder": ["BANNER", "STICKER"]}`.

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `shop_category_key`, unveränderlich | ja | Fester technischer Schlüssel, Key-Regel, z. B. `STICKER`. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename, z. B. `{"de": "Sticker"}`. |
| `fileClassKey` | `String` | Pflicht, max. 100 Zeichen, Spalte `file_class_key` | ja | Die FileClass der Rubrik: der Key der [FileClass](FileClass.md), die jede Datei bekommt, die in diese Rubrik hochgeladen wird, z. B. `MEME`. |
| `listingPosition` | `int` | Pflicht | ja | Platz unter den Rubriken, ab 1. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/shop-category` | [`ShopCategoryAdminController.createShopCategory`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryAdminController.java) | `ShopCategory` |
| GET | `/api/admin/shop-category/{shopCategoryKey}` | [`ShopCategoryAdminController.getShopCategory`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryAdminController.java) | `ShopCategory` |
| GET | `/api/shop-category` | [`ShopCategoryController.getAllShopCategory`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryController.java) | Liste von `ShopCategory` |
| PUT | `/api/admin/shop-category` | [`ShopCategoryAdminController.changeShopCategory`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryAdminController.java) | `ShopCategory` |
| PUT | `/api/admin/shop-category/listing-position` | [`ShopCategoryAdminController.changeShopCategoryListingPositions`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryAdminController.java) | `ListingOrder`, Liste von `ShopCategory` |

`/api/admin/**` nur für ADMIN, `/api/shop-category` für jeden angemeldeten User. Antworten bei Fehlern: Key gegen die Key-Regel, fehlender Name, fehlende oder unbekannte FileClass 400, unbekannte Rubrik 404, Key schon vergeben 409.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/shop/repository/ShopCategoryRepository.java`](../../code/backend/src/main/java/de/gebiter/shop/repository/ShopCategoryRepository.java): `findAllByOrderByListingPositionAscKeyAsc`, `findTopByOrderByListingPositionDesc`
- [`code/backend/src/main/java/de/gebiter/shop/service/ShopCategoryService.java`](../../code/backend/src/main/java/de/gebiter/shop/service/ShopCategoryService.java): `createShopCategory`, `existsShopCategory`, `getShopCategory`, `getFileClassKeyOfShopCategory` (für den Upload in die Rubrik, jeder angemeldete User), `getAllShopCategory`, `changeShopCategory`, `changeShopCategoryListingPositions`, `requireExistingFileClass`, `doGetShopCategory`; ob es die FileClass gibt, prüft er über `FileClassService.existsFileClass`
- [`code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryAdminController.java`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryAdminController.java): `createShopCategory`, `getShopCategory`, `changeShopCategory`, `changeShopCategoryListingPositions`
- [`code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryController.java`](../../code/backend/src/main/java/de/gebiter/shop/controller/ShopCategoryController.java): `getAllShopCategory`
- [`code/backend/src/main/java/de/gebiter/file/service/FileUploadService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileUploadService.java): `uploadFileIntoShopCategory` holt die FileClass der Rubrik (`getFileClassKeyOfShopCategory`) und setzt sie in die Felder der Datei
- [`ShopItem.shopCategoryKey`](../../code/backend/src/main/java/de/gebiter/shop/model/ShopItem.java) verweist auf den Key.

## Verwendung im Frontend

- [`code/frontend/src/shop/useShopCategory.ts`](../../code/frontend/src/shop/useShopCategory.ts): `useShopCategory`, `createShopCategory`, `getShopCategory`, `getAllShopCategory`, `changeShopCategory`, `changeShopCategoryListingPositions`
- [`code/frontend/src/achievementmanager/shopcategory/ShopCategoryTab.tsx`](../../code/frontend/src/achievementmanager/shopcategory/ShopCategoryTab.tsx): Tab „Rubriken“ im Modul „Achievements & Markt“ (`/achievement-manager/shop-category`, nur ADMIN). Zentrale Tabelle (`TABLE_SHOP_CATEGORY`) mit den Spalten Rubrik, FileClass, Key. Klick auf den Namen öffnet das kleine Popup (`EditDisplayNamePopup`), Klick auf die FileClass das Popup mit der Auswahl ([`EditShopCategoryFileClassPopup.tsx`](../../code/frontend/src/achievementmanager/shopcategory/EditShopCategoryFileClassPopup.tsx), `FileClassPicker`), „neue Rubrik“ das Popup zum Anlegen (`NewKeyDisplayNamePopup` mit der FileClass als Pflichtfeld über `extraFields`), die Reihenfolge ändert sich am Griff links.
- [`code/frontend/src/achievementmanager/shopcategory/shopCategoryTexts.ts`](../../code/frontend/src/achievementmanager/shopcategory/shopCategoryTexts.ts): alle Texte des Tabs, mehrsprachig angelegt
- [`code/frontend/src/achievementmanager/shopcategory/shopCategoryPaths.ts`](../../code/frontend/src/achievementmanager/shopcategory/shopCategoryPaths.ts): `SHOP_CATEGORY_TAB_PATH`
- [`code/frontend/src/market/Market.tsx`](../../code/frontend/src/market/Market.tsx): das Modul „Gebietermarkt“ (Kachel der Startseite, für jeden angemeldeten User, `/market`): je Rubrik ein Tab im Subheader; [`MarketStartTab.tsx`](../../code/frontend/src/market/MarketStartTab.tsx) springt zur ersten Rubrik, [`MarketCategoryTab.tsx`](../../code/frontend/src/market/MarketCategoryTab.tsx) zeigt die Rubrik (`/market/category/<Key>`), im Fuß ihre FileClass; den Knopf „neues Angebot“ bekommt, wer diese FileClass hochladen darf
- [`code/frontend/src/market/MarketUploadBox.tsx`](../../code/frontend/src/market/MarketUploadBox.tsx): gibt die FileClass der Rubrik fest an den Upload-Ablauf (`FileUploadForm`, `fixedFileClass`): keine Auswahl, sie wird nur gezeigt
- [`code/frontend/src/achievementmanager/AchievementManager.tsx`](../../code/frontend/src/achievementmanager/AchievementManager.tsx): der Tab im Subheader; Route in [`App.tsx`](../../code/frontend/src/App.tsx)

## Getestet (2026-11-11, Wegwerf-Test gegen die Pi-DB mit Rollback, danach gelöscht)

Zwei Rubriken anlegen (201, Platz 1 und 2), denselben Key noch einmal (409), `sticker klein` als Key (400), leerer Name (400), eine über den Key lesen (200), unbekannter Key (404), klein geschriebener Key im Pfad (400), umbenennen (der Platz bleibt, auch wenn der Body einen anderen nennt), Reihenfolge umdrehen, unvollständige Reihenfolge (400), Liste lesen. Ein normaler User liest die Liste; Anlegen, Ändern und Lesen über den Admin-Weg werden abgewiesen. Danach ist die Tabelle wieder leer.

**FileClass der Rubrik (2026-11-11, Wegwerf-Test gegen die Pi-DB mit Rollback, danach gelöscht):** anlegen ohne FileClass 400, mit unbekannter FileClass 400, mit `MEME` 201 (`fileClassKey` im JSON), lesen, FileClass auf `PROFILE_BANNER` ändern 200, ändern ohne FileClass 400, Liste als User mit `fileClassKey`, User legt an → abgewiesen. Upload in `MEMES` mit `x.docx`, ohne FileClass vom Client: 400 „Die Endung docx ist für die FileClass MEME nicht freigeschaltet“ (die FileClass kam aus der Rubrik); dasselbe, wenn der Client `DOKUMENT` schickt (zählt nicht); User lädt in `PROFILE_BANNER` (darf dort nur lesen) 403; unbekannte Rubrik 404; ohne Rubrik 400. Nicht geprüft: ein ganzer Upload mit echter Datei und die Oberfläche im Browser.
