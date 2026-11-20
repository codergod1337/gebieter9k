# GalleryShare

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Freigabe einer Galerie über einen Token (Konzept `docu/konzept-galerie-freigabe.md`): Wer den Link mit dem Token hat, sieht die Bilder der Galerie ohne Anmeldung. Eine Galerie kann mehrere Freigaben nebeneinander haben. Jede ist dauerhaft, zeitlich begrenzt (`expiresAt`) oder auf eine Zahl von Aufrufen begrenzt (`maxAccessCount`).

- **Tabelle:** `gallery_share`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/gallery/model/GalleryShare.java`](../../code/backend/src/main/java/de/gebiter/gallery/model/GalleryShare.java)
- **DTOs:** `GalleryShareDeleteRequest`, `GalleryShareForClient`, `GalleryShareResolveRequest`, `NewGalleryShare`, `SharedGalleryForClient`, `SharedGalleryPageRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Der Besitzer der Galerie bekommt die Freigabe als `GalleryShareForClient`: mit `shareToken` (daraus wird der Link `/share/galerie/<shareToken>`, seit 2026-11-20 jederzeit wieder abrufbar) und `sharedFileCount`, ohne `shareTokenHash`.

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
| `shareToken` | `String` | Pflicht, eindeutig, max. 500 Zeichen, unveränderlich | ja | Der Token der Freigabe als Hex-Text (`gebiter.gallery-share.token-bytes` Byte Zufall). Er steht im Link, den der Besitzer weiterschickt: `/share/galerie/<shareToken>`. Nur der Besitzer der Galerie bekommt ihn zu sehen. |
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
| POST | `/api/gallery-share/resolve` | [`GalleryShareController.resolveOwnGalleryShares`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | `GalleryShareForClient`, `GalleryShareResolveRequest` |
| DELETE | `/api/gallery-share` | [`GalleryShareController.deleteOwnGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | `GalleryShareDeleteRequest` |
| GET | `/api/share/token/{shareToken}` | [`GalleryShareShareController.resolveSharedGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `SharedGalleryForClient` |
| POST | `/api/share/token/{shareToken}/resolve` | [`GalleryShareShareController.resolveSharedGalleryPage`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `SharedGalleryForClient`, `SharedGalleryPageRequest` |
| GET | `/api/share/token/{shareToken}/view/{fileDocumentId}` | [`GalleryShareShareController.viewSharedFile`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | die Bytes des Bildes |
| GET | `/api/share/token/{shareToken}/download/{fileDocumentId}` | [`GalleryShareShareController.downloadSharedFile`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | die Bytes des Bildes |
| GET | `/api/share/token/{shareToken}/download/all` | [`GalleryShareShareController.downloadAllSharedFiles`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | ZIP |
| POST | `/api/share/token/{shareToken}/selection` | [`GalleryShareShareController.downloadSelectedSharedFiles`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | Formularfeld `fileIds`, ZIP |

Die Adressen unter `/api/share/token/` gehen ohne Anmeldung (Besucher mit dem Link). Was dabei geprüft wird, steht im Konzept `docu/konzept-galerie-freigabe.md`, Abschnitt 5.2.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/gallery/repository/GalleryShareRepository.java`](../../code/backend/src/main/java/de/gebiter/gallery/repository/GalleryShareRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareService.java): `createOwnGalleryShare`, `resolveOwnGalleryShares`, `prepareGalleryShareUpload`, `getValidGalleryShare`, `deleteOwnGalleryShare`, `deleteGallerySharesOfDeletedGallery`, `doDeleteGalleryShare`, `doGetOwnGalleryShare`, `createGalleryShareForClient`
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareVisitorService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareVisitorService.java): `resolveSharedGallery`, `streamSharedFile`, `streamSharedFilesAsZip`

## Verwendung im Frontend

- [`code/frontend/src/gallery/GalleryShare.ts`](../../code/frontend/src/gallery/GalleryShare.ts): die Typen `GalleryShare` (mit `shareToken`), `NewGalleryShare`, `SharedGallery`
- [`code/frontend/src/gallery/useGalleryShare.ts`](../../code/frontend/src/gallery/useGalleryShare.ts): `createOwnGalleryShare`, `resolveOwnGalleryShares`, `deleteOwnGalleryShare`, `resolveSharedGallery`
- [`code/frontend/src/gallery/GalleryShareBox.tsx`](../../code/frontend/src/gallery/GalleryShareBox.tsx): die Liste der Freigaben der eigenen Galerie, seit 2026-11-20 im Reiter „Freigabe“ ([`GallerySharePage.tsx`](../../code/frontend/src/gallery/GallerySharePage.tsx), `/profile/<guid>/galleries/<id>/share`) statt unter den Bildern, je Zeile der Link zum Weitergeben mit „kopieren“ (`GalleryShareLinkCell`), Löschen
- [`code/frontend/src/gallery/NewGallerySharePopup.tsx`](../../code/frontend/src/gallery/NewGallerySharePopup.tsx): „neue Freigabe“ als geführter Ablauf, zeigt am Ende den Link (er steht danach auch in der Liste)
- [`code/frontend/src/gallery/GalleryShareVisitorPage.tsx`](../../code/frontend/src/gallery/GalleryShareVisitorPage.tsx): die Besucherseite `/share/galerie/<token>`
- [`code/frontend/src/gallery/galleryShareUrls.ts`](../../code/frontend/src/gallery/galleryShareUrls.ts): die Adressen unter dem Token
