# Gallery

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Galerie im Profil (Konzept `docu/konzept-galerie.md`): Titel, Beschreibung und Sichtbarkeit legt der Besitzer selbst fest. Sie ist der Einhängepunkt, über den normale User Bilder hochladen; jedes Bild liegt in genau einer Galerie (Feld `galleryIds` im Solr-Dokument). Eine FileClass hat die Galerie nicht, die gehört zu jedem Upload. Lose gekoppelt, ohne JPA-Beziehungen.

- **Tabelle:** `gallery`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/gallery/model/Gallery.java`](../../code/backend/src/main/java/de/gebiter/gallery/model/Gallery.java)
- **Frontend-Typ:** [`code/frontend/src/gallery/Gallery.ts`](../../code/frontend/src/gallery/Gallery.ts)
- **DTOs:** `FileUploadIntoGalleryData`, `GalleryChangeRequest`, `GalleryDeletedEvent`, `GalleryDeleteRequest`, `GalleryFileListingOrder`, `GalleryFileResolveRequest`, `GalleryForClient`, `GalleryListingOrder`, `GalleryResolveRequest`, `GalleryTagCount`, `GalleryTagResolveRequest`, `NewGallery`, `SharedGalleryForClient`, `SharedGalleryPageRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "ownerUsersGuid": "77777777-7777-7777-7777-777777777777",
  "title": "Beispieltext",
  "description": {
    "de": "Beispiel"
  },
  "visibility": "NONE",
  "listingPosition": 0,
  "createdAt": "2026-11-09T14:05:27Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `ownerUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | Wem die Galerie gehört. |
| `title` | `String` | Pflicht, max. 500 Zeichen | ja | Der Titel der Galerie, höchstens `gebiter.gallery.title-max-length` Zeichen. |
| `description` | `Map<String, String>` | jsonb | ja | Die Beschreibung als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML aus dem Rich-Text-Editor (Nutzer 2026-11-09; vorerst nur Deutsch), `null` ohne. |
| `visibility` | `Visibility` | Enum als Text, Pflicht, max. 30 Zeichen | ja | Wer die Galerie und ihre Bilder sieht; die Bilder tragen sie in ihrem Solr-Dokument. |
| `listingPosition` | `int` | Pflicht | ja | Platz unter den Galerien des Besitzers, per Drag and Drop. |
| `createdAt` | `OffsetDateTime` | Pflicht, unveränderlich | ja | Wann die Galerie angelegt wurde. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/gallery` | [`GalleryController.createOwnGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `Gallery`, `NewGallery` |
| POST | `/api/gallery/upload` | [`GalleryController.uploadFileIntoGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | (eigener Controller) |
| GET | `/api/gallery/{id}` | [`GalleryController.getGalleryForClient`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryForClient` |
| POST | `/api/gallery/resolve` | [`GalleryController.resolveGalleries`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryForClient`, `GalleryResolveRequest` |
| POST | `/api/gallery/file/resolve` | [`GalleryController.resolveGalleryFiles`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryFileResolveRequest` (seit 2026-11-20 mit `tags`: nur Bilder mit mindestens einem dieser Hashtags) |
| POST | `/api/gallery/tag/resolve` | [`GalleryController.resolveGalleryTags`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryTagResolveRequest`, `GalleryTagCount` (die Hashtags der Galerie mit der Zahl ihrer Bilder, häufigste zuerst) |
| PUT | `/api/gallery` | [`GalleryController.changeOwnGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `Gallery`, `GalleryChangeRequest` |
| PUT | `/api/gallery/listing-position` | [`GalleryController.changeOwnGalleryListingPositions`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `Gallery`, `GalleryListingOrder` |
| PUT | `/api/gallery/file/listing-position` | [`GalleryController.changeOwnGalleryFileListingPositions`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryFileListingOrder` |
| DELETE | `/api/gallery` | [`GalleryController.deleteOwnGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryDeleteRequest` |
| POST | `/api/gallery-share` | [`GalleryShareController.createOwnGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | (eigener Controller) |
| POST | `/api/gallery-share/resolve` | [`GalleryShareController.resolveOwnGalleryShares`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | (eigener Controller) |
| DELETE | `/api/gallery-share` | [`GalleryShareController.deleteOwnGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | (eigener Controller) |
| GET | `/api/gallery-share` | [`GalleryShareController.getAllOwnGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareController.java) | (eigener Controller; die Freigaben aller eigenen Galerien für ihre Liste) |
| GET | `/api/admin/gallery-share` | [`GalleryShareAdminController.getAllGalleryShare`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareAdminController.java) | `GalleryShareForAdmin` (Titel und Besitzer der Galerie je Freigabe) |
| GET | `/api/share/token/{shareToken}` | [`GalleryShareShareController.resolveSharedGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `SharedGalleryForClient` |
| POST | `/api/share/token/{shareToken}/resolve` | [`GalleryShareShareController.resolveSharedGalleryPage`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `SharedGalleryForClient`, `SharedGalleryPageRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java): `createOwnGallery`, `changeOwnGallery`, `changeOwnGalleryListingPositions`
- [`code/backend/src/main/java/de/gebiter/gallery/repository/GalleryRepository.java`](../../code/backend/src/main/java/de/gebiter/gallery/repository/GalleryRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryService.java): `createOwnGallery`, `getGalleryForClient`, `resolveGalleries`, `resolveGalleryFiles`, `resolveGalleryTags`, `createFilterTags`, `changeOwnGallery`, `changeOwnGalleryListingPositions`, `changeOwnGalleryFileListingPositions`, `prepareOwnGalleryUpload`, `checkOwnGalleryExists`, `resolveOwnGalleryIds` (für alle Freigaben der eigenen Galerien), `getGalleryForGalleryShare`, `resolveGalleriesForGalleryShares` (für die Übersicht des Admins über alle Freigaben), `deleteOwnGallery` (schickt zuerst `GalleryDeletedEvent`, der `GalleryShareService` löscht daraufhin die Freigaben der Galerie), `createVisibilityFieldValues`, `doChangeAllGalleryFiles`, `createGalleryForClient`, `doGetVisibleGallery`, `doGetOwnGallery`, `isOwnGallery`, `doGetGallery`, `isGalleryVisibleWithinVisibleProfile`
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareService.java): `getAllGalleryShare` (Titel und Besitzer der Galerie je Freigabe), `getAllOwnGalleryShare`
- [`code/backend/src/main/java/de/gebiter/file/service/FileDocumentResolveService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileDocumentResolveService.java): `resolveLastUploadedAtOfGallery` (für `GalleryForClient.lastUploadedAt`, seit 2026-11-20)
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareVisitorService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareVisitorService.java): `resolveSharedGallery`, `streamSharedFilesAsZip`

## Verwendung im Frontend

Von Hand ergänzt am 2026-11-20 (Upload hinter dem Knopf, Reiter „Freigabe“, Filter nach Hashtags):

- [`code/frontend/src/gallery/GalleryPage.tsx`](../../code/frontend/src/gallery/GalleryPage.tsx): der Reiter „Bilder“ einer Galerie: Kacheln, Hashtag-Schalter, Knopf „neue Bilder“; Adresse `?tags=…&page=…&image=…`
- [`code/frontend/src/gallery/GalleryTagFilter.tsx`](../../code/frontend/src/gallery/GalleryTagFilter.tsx): je Hashtag der Galerie ein Schalter mit der Zahl seiner Bilder (`GalleryTagCount`)
- [`code/frontend/src/gallery/galleryTagUrlParam.ts`](../../code/frontend/src/gallery/galleryTagUrlParam.ts): `parseUrlTags`, `formatUrlTags` (die gewählten Hashtags in der Adresse)
- [`code/frontend/src/gallery/GalleryUploadPopup.tsx`](../../code/frontend/src/gallery/GalleryUploadPopup.tsx): „neue Bilder“ als Popup mit dem globalen Upload-Ablauf (`GalleryUploadBox`)
- [`code/frontend/src/gallery/GallerySharePage.tsx`](../../code/frontend/src/gallery/GallerySharePage.tsx): der Reiter „Freigabe“ der eigenen Galerie (`/profile/<guid>/galleries/<id>/share`)
- [`code/frontend/src/profile/Profile.tsx`](../../code/frontend/src/profile/Profile.tsx): die Reiter „Bilder“ und „Freigabe“ im Subheader, solange eine Galerie offen ist
- [`code/frontend/src/gallery/galleryTexts.ts`](../../code/frontend/src/gallery/galleryTexts.ts): die Texte dazu

- [`code/frontend/src/gallery/GalleryEditPopup.tsx`](../../code/frontend/src/gallery/GalleryEditPopup.tsx): (Typ)
- [`code/frontend/src/gallery/GalleryListTab.tsx`](../../code/frontend/src/gallery/GalleryListTab.tsx): `getGalleryKey`, `GalleryListTab`, `loadGalleries`, `createGallery`, `changeGallery`, `confirmDeleteGallery`, `reorderGalleries`
- [`code/frontend/src/gallery/GalleryTile.tsx`](../../code/frontend/src/gallery/GalleryTile.tsx): (Typ)
- [`code/frontend/src/gallery/useGallery.ts`](../../code/frontend/src/gallery/useGallery.ts): `useGallery`, `createOwnGallery`, `uploadFileIntoGallery`, `getGalleryForClient`, `resolveGalleries`, `resolveGalleryFiles`, `changeOwnGallery`, `changeOwnGalleryListingPositions`, `resolveGalleryTags`
- [`code/frontend/src/gallery/galleryColumns.tsx`](../../code/frontend/src/gallery/galleryColumns.tsx): `createGalleryColumns`; die Spalten einer Galerie für die zentrale `Table` (seit 2026-11-20 steht die Liste der Galerien auf dem Handy als Tabelle da: Titel mit Beschreibung hinter dem „i“, Bilder, letztes Bild, sichtbar für, Freigaben, erstellt)
- [`code/frontend/src/gallery/GalleryListTab.tsx`](../../code/frontend/src/gallery/GalleryListTab.tsx): `groupGallerySharesByGalleryId`, `loadOwnGalleryShares`; am Desktop Kacheln (`GalleryTile`), auf dem Handy die Tabelle; im Fuß die Zahl der Galerien

`GalleryForClient` trägt seit 2026-11-20 `lastUploadedAt` (wann zuletzt ein Bild hochgeladen wurde, `null` ohne Bild), mit dem Lesefilter des Betrachters aus Solr.
