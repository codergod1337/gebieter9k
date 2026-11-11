# Gallery

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Galerie im Profil (Konzept `docu/konzept-galerie.md`): Titel, Beschreibung und Sichtbarkeit legt der Besitzer selbst fest. Sie ist der Einhängepunkt, über den normale User Bilder hochladen; jedes Bild liegt in genau einer Galerie (Feld `galleryIds` im Solr-Dokument). Eine FileClass hat die Galerie nicht, die gehört zu jedem Upload. Lose gekoppelt, ohne JPA-Beziehungen.

- **Tabelle:** `gallery`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/gallery/model/Gallery.java`](../../code/backend/src/main/java/de/gebiter/gallery/model/Gallery.java)
- **Frontend-Typ:** [`code/frontend/src/gallery/Gallery.ts`](../../code/frontend/src/gallery/Gallery.ts)
- **DTOs:** `FileUploadIntoGalleryData`, `GalleryChangeRequest`, `GalleryDeleteRequest`, `GalleryFileListingOrder`, `GalleryFileResolveRequest`, `GalleryForClient`, `GalleryListingOrder`, `GalleryResolveRequest`, `NewGallery`

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
| POST | `/api/gallery/file/resolve` | [`GalleryController.resolveGalleryFiles`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryFileResolveRequest` |
| PUT | `/api/gallery` | [`GalleryController.changeOwnGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `Gallery`, `GalleryChangeRequest` |
| PUT | `/api/gallery/listing-position` | [`GalleryController.changeOwnGalleryListingPositions`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `Gallery`, `GalleryListingOrder` |
| PUT | `/api/gallery/file/listing-position` | [`GalleryController.changeOwnGalleryFileListingPositions`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryFileListingOrder` |
| DELETE | `/api/gallery` | [`GalleryController.deleteOwnGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) | `GalleryDeleteRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java): `createOwnGallery`, `changeOwnGallery`, `changeOwnGalleryListingPositions`
- [`code/backend/src/main/java/de/gebiter/gallery/repository/GalleryRepository.java`](../../code/backend/src/main/java/de/gebiter/gallery/repository/GalleryRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryService.java): `createOwnGallery`, `getGalleryForClient`, `resolveGalleries`, `resolveGalleryFiles`, `changeOwnGallery`, `changeOwnGalleryListingPositions`, `changeOwnGalleryFileListingPositions`, `prepareOwnGalleryUpload`, `deleteOwnGallery`, `createVisibilityFieldValues`, `doChangeAllGalleryFiles`, `createGalleryForClient`, `doGetVisibleGallery`, `doGetOwnGallery`, `isOwnGallery`, `doGetGallery`, `isGalleryVisibleWithinVisibleProfile`

## Verwendung im Frontend

- [`code/frontend/src/gallery/GalleryEditPopup.tsx`](../../code/frontend/src/gallery/GalleryEditPopup.tsx): (Typ)
- [`code/frontend/src/gallery/GalleryListTab.tsx`](../../code/frontend/src/gallery/GalleryListTab.tsx): `getGalleryKey`, `GalleryListTab`, `loadGalleries`, `createGallery`, `changeGallery`, `confirmDeleteGallery`, `reorderGalleries`
- [`code/frontend/src/gallery/GalleryTile.tsx`](../../code/frontend/src/gallery/GalleryTile.tsx): (Typ)
- [`code/frontend/src/gallery/useGallery.ts`](../../code/frontend/src/gallery/useGallery.ts): `useGallery`, `createOwnGallery`, `uploadFileIntoGallery`, `getGalleryForClient`, `resolveGalleries`, `resolveGalleryFiles`, `changeOwnGallery`, `changeOwnGalleryListingPositions`
