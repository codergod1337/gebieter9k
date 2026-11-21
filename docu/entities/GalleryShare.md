# GalleryShare

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Freigabe einer Galerie über einen Token (Konzept `docu/konzept-galerie-freigabe.md`): Wer den Link mit dem Token hat, sieht die Bilder der Galerie ohne Anmeldung. Eine Galerie kann mehrere Freigaben nebeneinander haben. Jede ist dauerhaft, zeitlich begrenzt (`expiresAt`) oder auf eine Zahl von Aufrufen begrenzt (`maxAccessCount`).

- **Tabelle:** `gallery_share`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/gallery/model/GalleryShare.java`](../../code/backend/src/main/java/de/gebiter/gallery/model/GalleryShare.java)
- **DTOs:** `GalleryShareChangeRequest`, `GalleryShareDeleteRequest`, `GalleryShareForAdmin`, `GalleryShareForClient`, `GalleryShareResolveRequest`, `NewGalleryShare`, `SharedGalleryForClient`, `SharedGalleryPageRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Der Besitzer der Galerie bekommt die Freigabe als `GalleryShareForClient`: mit `shareToken` (daraus wird der Link `/share/galerie/<shareToken>`, seit 2026-11-20 jederzeit wieder abrufbar) und `sharedFileCount`, ohne `shareTokenHash`. Der Admin bekommt in seiner Übersicht über alle Freigaben je Freigabe ein `GalleryShareForAdmin`: `{"galleryShare": {…wie beim Besitzer…}, "galleryTitle": "Urlaub 2026", "ownerUsersGuid": "…"}`; gibt es die Galerie nicht mehr, sind `galleryTitle` und `ownerUsersGuid` `null`. Der Admin ändert eine Freigabe mit einem `GalleryShareChangeRequest` (seit 2026-11-21): `{"id": 15, "label": "Für alle", "expiresAt": null, "maxAccessCount": 500}`; höchstens eine der beiden Grenzen, ohne beide gilt sie dauerhaft. Gelöscht wird mit `{"id": 15}` (`GalleryShareDeleteRequest`, beim Besitzer und beim Admin derselbe Body).

```json
{
  "id": 1,
  "galleryId": 1,
  "label": "Beispieltext",
  "shareToken": "Beispieltext",
  "shareTokenHash": "Beispieltext",
  "expiresAt": "2026-11-09T14:05:27Z",
  "maxAccessCount": 0,
  "accessCount": 0,
  "fileCount": 0,
  "createdAt": "2026-11-09T14:05:27Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `galleryId` | `Long` | Pflicht, unveränderlich | ja | Die Galerie, die freigegeben ist. |
| `label` | `String` | Pflicht, max. 500 Zeichen | ja | Die Bezeichnung der Freigabe, z. B. „für Oma“, höchstens `gebiter.gallery-share.label-max-length` Zeichen. An ihr erkennt der Besitzer seine Freigaben wieder; ein Besucher sieht sie nicht. |
| `shareToken` | `String` | Pflicht, eindeutig, max. 500 Zeichen, unveränderlich | ja | Der Token der Freigabe als Hex-Text (`gebiter.gallery-share.token-bytes` Byte Zufall). Er steht im Link, den der Besitzer weiterschickt: `/share/galerie/<shareToken>`. Zu sehen bekommt ihn nur der Besitzer der Galerie, dazu der Admin in seiner Übersicht über alle Freigaben. |
| `shareTokenHash` | `String` | Pflicht, eindeutig, max. 64 Zeichen, unveränderlich | ja | SHA-256 des Tokens als Hex-Text. Derselbe Wert steht in den Solr-Dokumenten der Bilder. |
| `expiresAt` | `Instant` |  | ja | Bis wann die Freigabe gilt, `null` ohne zeitliche Grenze. |
| `maxAccessCount` | `Long` |  | ja | Wie viele Aufrufe die Freigabe höchstens erlaubt, `null` ohne Grenze. |
| `accessCount` | `long` | Pflicht | ja | Wie viele Aufrufe es schon gab. Ein Aufruf: Ein Bild wird heruntergeladen oder der Viewer lädt es. |
| `fileCount` | `long` | Pflicht | ja | In wie vielen Bildern der Hash stehen soll: beim Anlegen die Zahl der beschriebenen Dokumente, danach mitgezählt bei jedem Upload in die Galerie und jedem gelöschten Bild. Die Kontrolle vergleicht sie mit der Zahl in Solr. |
| `createdAt` | `Instant` | Pflicht, unveränderlich | ja | Wann die Freigabe angelegt wurde. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/gallery-share` | [`GalleryShareController.createOwnGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | `GalleryShareForClient`, `NewGalleryShare` |
| GET | `/api/gallery-share` | [`GalleryShareController.getAllOwnGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | `GalleryShareForClient` (alle Freigaben aller eigenen Galerien, für die Liste der Galerien) |
| POST | `/api/gallery-share/resolve` | [`GalleryShareController.resolveOwnGalleryShares`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | `GalleryShareForClient`, `GalleryShareResolveRequest` |
| DELETE | `/api/gallery-share` | [`GalleryShareController.deleteOwnGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | `GalleryShareDeleteRequest` |
| GET | `/api/admin/gallery-share` | [`GalleryShareAdminController.getAllGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareAdminController.java) | `GalleryShareForAdmin` (darin `GalleryShareForClient`) |
| PUT | `/api/admin/gallery-share` | [`GalleryShareAdminController.changeGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareAdminController.java) | `GalleryShareChangeRequest`, `GalleryShareForClient` (Bezeichnung und Laufzeit einer beliebigen Freigabe; der Link bleibt) |
| DELETE | `/api/admin/gallery-share` | [`GalleryShareAdminController.deleteGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareAdminController.java) | `GalleryShareDeleteRequest` (eine beliebige Freigabe; erst Solr, dann Postgres) |
| GET | `/api/share/token/{shareToken}` | [`GalleryShareShareController.resolveSharedGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `SharedGalleryForClient` |
| POST | `/api/share/token/{shareToken}/resolve` | [`GalleryShareShareController.resolveSharedGalleryPage`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `SharedGalleryForClient`, `SharedGalleryPageRequest` |
| GET | `/api/share/token/{shareToken}/comment/{fileDocumentId}` | [`GalleryShareShareController.getSharedFileCommentThread`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `FileCommentThread` (die Kommentare eines Bildes, nur lesen; `docu/entities/FileComment.md`) |
| GET | `/api/share/token/{shareToken}/view/{fileDocumentId}` | [`GalleryShareShareController.viewSharedFile`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | die Bytes des Bildes |
| GET | `/api/share/token/{shareToken}/download/{fileDocumentId}` | [`GalleryShareShareController.downloadSharedFile`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | die Bytes des Bildes |
| GET | `/api/share/token/{shareToken}/download/all` | [`GalleryShareShareController.downloadAllSharedFiles`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | ZIP |
| POST | `/api/share/token/{shareToken}/selection` | [`GalleryShareShareController.downloadSelectedSharedFiles`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | Formularfeld `fileIds`, ZIP |

`GET /api/admin/gallery-share` liefert alle Freigaben aller Galerien, die neueste zuerst, nur für ADMIN (Konzept `docu/konzept-galerie-freigabe.md`, Abschnitt 9). `PUT` und `DELETE` dort (seit 2026-11-21, nur ADMIN) ändern bzw. löschen eine beliebige Freigabe. Das Ändern fasst nur `label`, `expiresAt` und `maxAccessCount` an; Token, Galerie und die Zähler bleiben. Ein neuer Ablauf muss in der Zukunft liegen, ein unveränderter darf vergangen sein (Bezeichnung einer abgelaufenen Freigabe ändern). Die Adressen unter `/api/share/token/` gehen ohne Anmeldung (Besucher mit dem Link). Was dabei geprüft wird, steht im Konzept `docu/konzept-galerie-freigabe.md`, Abschnitt 5.2.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/gallery/repository/GalleryShareRepository.java`](../../code/backend/src/main/java/de/gebiter/gallery/repository/GalleryShareRepository.java): (Import, Felder); `changeLabelAndLimits` (ändert Bezeichnung und Grenzen als eine gezielte Anweisung, ohne die Zähler anzufassen), `increaseAccessCountIfValid`, `changeFileCountByGalleryId`
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareService.java): `createOwnGalleryShare`, `resolveOwnGalleryShares`, `getAllOwnGalleryShare` (alle eigenen, für die Liste der Galerien), `getAllGalleryShare` (Übersicht des Admins), `prepareGalleryShareUpload`, `getValidGalleryShare`, `changeGalleryShare` (nur Admin: Bezeichnung und Laufzeit), `deleteOwnGalleryShare`, `deleteGalleryShare` (nur Admin), `deleteGallerySharesOfDeletedGallery`, `doDeleteGalleryShare`, `doGetGalleryShare`, `doGetOwnGalleryShare`, `requireValidLimits`, `createGalleryShareForClient`
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareVisitorService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareVisitorService.java): `resolveSharedGallery` (seit 2026-11-20 mit der Zahl der Kommentare je Bild), `getSharedFileCommentThread`, `streamSharedFile`, `streamSharedFilesAsZip`

## Verwendung im Frontend

- [`code/frontend/src/gallery/GalleryShare.ts`](../../code/frontend/src/gallery/GalleryShare.ts): die Typen `GalleryShare` (mit `shareToken`), `GalleryShareForAdmin`, `GalleryShareChange` (Body des Änderns durch den Admin), `NewGalleryShare`, `SharedGallery`
- [`code/frontend/src/gallery/useGalleryShare.ts`](../../code/frontend/src/gallery/useGalleryShare.ts): `createOwnGalleryShare`, `resolveOwnGalleryShares`, `getAllOwnGalleryShare`, `getAllGalleryShare`, `changeGalleryShare` (Admin), `deleteOwnGalleryShare`, `deleteGalleryShare` (Admin), `resolveSharedGallery`, `getSharedFileCommentThread`, `useGalleryShare`
- [`code/frontend/src/gallery/GalleryShareBox.tsx`](../../code/frontend/src/gallery/GalleryShareBox.tsx): `getGalleryShareOfRow`, `GalleryShareBox`, `loadGalleryShares`, `confirmDeleteGalleryShare`; die Liste der Freigaben der eigenen Galerie, seit 2026-11-20 im Reiter „Freigabe“ ([`GallerySharePage.tsx`](../../code/frontend/src/gallery/GallerySharePage.tsx), `/profile/<guid>/galleries/<id>/share`) statt unter den Bildern, je Zeile der Link zum Weitergeben mit „kopieren“ und QR-Code, Löschen; die Spalten kommen aus `galleryShareColumns.tsx`
- [`code/frontend/src/gallery/galleryShareColumns.tsx`](../../code/frontend/src/gallery/galleryShareColumns.tsx): `createGalleryShareColumns`, `GalleryShareColumnsEditing`, `getGalleryShareDurationText`, `getGalleryShareFileCountText`; die Spalten einer Freigabe (Bezeichnung, Link, gilt, Aufrufe, Bilder, angelegt), dieselben in der Liste des Besitzers und in der Übersicht des Admins; mit `GalleryShareColumnsEditing` sind Bezeichnung und „Gilt“ anklickbar (`EditableCellButton`), so nutzt es die Übersicht des Admins
- [`code/frontend/src/components/CopyableLink.tsx`](../../code/frontend/src/components/CopyableLink.tsx): `CopyableLink`, `CopyableLinkQrCode`; globaler Baustein, der Link einer Freigabe zum Anklicken mit „kopieren“ und, mit der Angabe `qrCode`, dem Knopf für den QR-Code (Listen und letzter Schritt von „neue Freigabe“)
- [`code/frontend/src/components/QrCodeButton.tsx`](../../code/frontend/src/components/QrCodeButton.tsx), [`QrCode.tsx`](../../code/frontend/src/components/QrCode.tsx): globale Bausteine seit 2026-11-21, für jeden Link nutzbar: der Knopf mit dem QR-Symbol samt Popup (Code groß, Hinweis, die Adresse als Text) und der gezeichnete QR-Code selbst (im Browser, npm `qrcode`; derselbe Baustein zeichnet den Code der Authenticator-App)
- [`code/frontend/src/components/EditTextPopup.tsx`](../../code/frontend/src/components/EditTextPopup.tsx): globaler Baustein seit 2026-11-21, ein einzeiliger Pflicht-Text im kleinen Popup; hier die Bezeichnung einer Freigabe
- [`code/frontend/src/gallery/galleryShareDurationInput.ts`](../../code/frontend/src/gallery/galleryShareDurationInput.ts): `GalleryShareDurationInput`, `GalleryShareLimits`, `createGalleryShareDurationInput`, `createGalleryShareLimitsOfInput`; Eingabe und Prüfung der Laufzeit, beim Anlegen und beim Ändern dieselbe
- [`code/frontend/src/gallery/GalleryShareDurationFields.tsx`](../../code/frontend/src/gallery/GalleryShareDurationFields.tsx): `GalleryShareDurationFields`; die Eingaben zur Laufzeit (dauerhaft, bis zu einem Zeitpunkt, für eine Zahl von Aufrufen)
- [`code/frontend/src/gallery/EditGalleryShareDurationPopup.tsx`](../../code/frontend/src/gallery/EditGalleryShareDurationPopup.tsx): `EditGalleryShareDurationPopup`; das kleine Popup, in dem die Laufzeit einer Freigabe aus der Tabellenzeile geändert wird
- [`code/frontend/src/admin/galleryshare/GalleryShareTab.tsx`](../../code/frontend/src/admin/galleryshare/GalleryShareTab.tsx): `GalleryShareTab`, `getGalleryShareOfRow`, `saveGalleryShareChange`, `handleSaveLabel`, `handleSaveDuration`, `confirmDeleteGalleryShare`, `renderRowActions`; der Reiter „Freigaben“ der Administration (`/admin/gallery-share`, Pfad in [`gallerySharePaths.ts`](../../code/frontend/src/admin/galleryshare/gallerySharePaths.ts)): alle Freigaben aller Galerien; seit 2026-11-21 ändert der Admin dort Bezeichnung (`EditTextPopup`) und Laufzeit (`EditGalleryShareDurationPopup`) per Klick in der Zeile und löscht nach der Sicherheitsabfrage (`DeleteButton`, `ConfirmDeletePopup`); sonst nur globale Bausteine (`Table`, `UsersGuidName`, `StatusMark`, `ContentBox`)
- [`code/frontend/src/gallery/NewGallerySharePopup.tsx`](../../code/frontend/src/gallery/NewGallerySharePopup.tsx): `NewGallerySharePopup`, `handleLabelChange`, `handleDurationInputChange`, `handleBack`, `handleNext`, `handleCreate`; „neue Freigabe“ als geführter Ablauf (Schritt 2 über `GalleryShareDurationFields`), zeigt am Ende den Link mit „kopieren“ und QR-Code (er steht danach auch in der Liste)
- [`code/frontend/src/gallery/GalleryShareVisitorPage.tsx`](../../code/frontend/src/gallery/GalleryShareVisitorPage.tsx): die Besucherseite `/share/galerie/<token>`
- [`code/frontend/src/gallery/galleryShareUrls.ts`](../../code/frontend/src/gallery/galleryShareUrls.ts): die Adressen unter dem Token
- [`code/frontend/src/gallery/galleryColumns.tsx`](../../code/frontend/src/gallery/galleryColumns.tsx): die Spalte „Freigaben“ der Liste der eigenen Galerien auf dem Handy (Zahl und Bezeichnungen, Link zum Reiter „Freigabe“); geladen in [`GalleryListTab.tsx`](../../code/frontend/src/gallery/GalleryListTab.tsx) (`groupGallerySharesByGalleryId`)
