# GalleryUploader

> Von Hand geschrieben am 2026-11-22 (Grundgerüst aus `docu/tools/generate_entity_docs.py`, in einer Kopie gelaufen). Das Werkzeug nicht im Projekt laufen lassen: Es überschreibt diese Datei.

Ein Uploadberechtigter einer Galerie (Nutzer 2026-11-22, Konzept `docu/konzept-galerie.md`, Abschnitt 10 „Gemeinsame Galerie“): Der Besitzer trägt einen anderen User ein, der dann Bilder in diese Galerie hochladen darf, z. B. für eine gemeinsame Ablage von Urlaubsbildern. Ein Uploadberechtigter sieht immer die ganze Galerie mit allen Bildern, egal wie sie eingestellt ist, und bearbeitet und löscht seine eigenen Uploads; jedes Bild der Galerie bearbeitet und löscht der Besitzer.

- **Tabelle:** `gallery_uploader` (je Galerie und User höchstens eine Zeile, Constraint `uq_gallery_uploader`)
- **Klasse:** [`code/backend/src/main/java/de/gebiter/gallery/model/GalleryUploader.java`](../../code/backend/src/main/java/de/gebiter/gallery/model/GalleryUploader.java)
- **Frontend-Typ:** [`code/frontend/src/gallery/GalleryUploader.ts`](../../code/frontend/src/gallery/GalleryUploader.ts)
- **DTOs:** `GalleryUploaderDeleteRequest`, `GalleryUploaderResolveRequest`, `NewGalleryUploader`

## Beispiel-JSON

Die Werte sind erfunden. So kommt ein Eintrag vom Backend:

```json
{
  "id": 3,
  "galleryId": 7,
  "uploaderUsersGuid": "019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b"
}
```

Eintragen (`NewGalleryUploader`): `{"galleryId": 7, "uploaderUsersGuid": "019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b"}`. Die Uploadberechtigten einer Galerie auflösen (`GalleryUploaderResolveRequest`): `{"galleryId": 7}`. Austragen (`GalleryUploaderDeleteRequest`): `{"id": 3}`.

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `galleryId` | `Long` | Pflicht, unveränderlich | ja | Die Galerie, in die der User hochladen darf. |
| `uploaderUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, der in die Galerie hochladen darf. Nie der Besitzer der Galerie: Der darf es ohnehin. |

Eine Farbe steht hier nicht: Die Rahmenfarbe seiner Uploads wählt jeder User in seinem Profil (`UsersDetail.uploadFrameColor`, `docu/entities/UsersDetail.md`).

## Wer darf was

Beispiel: Alice hat die Galerie 7 „Urlaub 2026“ auf „Nur ich“ und trägt Bob und Carla ein.

| Was | Alice (Besitzerin) | Bob (Uploadberechtigter) | Dora (weder noch) |
|---|---|---|---|
| Galerie und alle Bilder sehen | ja | ja, auch bei „Nur ich“ und privatem Profil von Alice | nur nach der Sichtbarkeit der Galerie |
| Bilder hochladen | ja | ja; Autor des Bildes ist Bob, es zählt an seiner Grenze, er bekommt die Punkte | nein |
| Angaben eines Bildes bearbeiten (Tags, Beschreibung) | jedes Bild der Galerie | seine eigenen | nein |
| Bild weich löschen | jedes Bild der Galerie | seine eigenen | nein |
| Sichtbarkeit eines einzelnen Bildes, Bearbeiter freigeben | an ihren eigenen Bildern | nein: Die Sichtbarkeit gibt die Galerie vor | nein |
| Bilder sortieren, Galerie ändern oder löschen | ja | nein | nein |
| Uploadberechtigte eintragen und austragen | ja, ohne eigenes Recht | nein | nein |
| Uploadberechtigte der Galerie lesen | ja | ja | wenn sie die Galerie sehen darf |

- Die Sichtbarkeit eines hochgeladenen Bildes ist immer die der Galerie; bei „Freunde“ zählen die Freunde der Besitzerin, auch wenn Bob hochlädt (`GalleryService.prepareGalleryUpload`).
- ADMIN und FILE_MANAGER verwalten wie überall jede Datei.

## Im Hauptspeicher, wie die Freundesliste

Der Lesefilter fragt kein Postgres und schreibt keine GUID-Liste ins Dokument. Zwei Listen je angemeldetem User liegen im Hauptspeicher, geladen bei jedem Login und Token-Refresh (`SessionService.doCreateSession`):

| Liste | hält | zieht sofort nach | liest |
|---|---|---|---|
| eigene Galerien | `GalleryService` (`ownGalleryIdsByUsersGuid`) | Anlegen und Löschen einer Galerie | `CurrentUsersProvider.currentUsersOwnGalleryIds()` |
| fremde Galerien, in die er hochladen darf | `GalleryUploaderService` (`uploaderGalleryIdsByUsersGuid`) | Eintragen, Austragen, Löschen der Galerie | `CurrentUsersProvider.currentUsersUploaderGalleryIds()` |

- Lesefilter (`FileDocumentResolveService.createVisibilityFilterQuery`): zusätzlich „`galleryIds` enthält eine meiner eigenen Galerien oder eine, in die ich hochladen darf“. Bob bekommt so jedes Dokument mit `galleryIds` = 7, Alice auch die Bilder von Bob und Carla.
- Rechte an einer Datei (`FileDocumentAccessService`): „liegt in einer eigenen Galerie“ aus derselben Liste, ohne Postgres.
- Sichtbarkeit der Galerie selbst (`GalleryService.doGetVisibleGallery`): Wer Uploadberechtigter ist, sieht sie.
- Nach einem Neustart des Backends sind die Listen leer. Das schadet nicht: Der Schlüssel der JWTs ist dann neu, jeder User refresht und lädt dabei seine Listen.

## Löschen

- **Austragen** (`deleteOwnGalleryUploader`): Gelöscht wird nur diese eine Zeile in Postgres; in Solr hängt nichts an ihr. Die Bilder, die der User hochgeladen hat, bleiben in der Galerie, er bleibt ihr Autor. Nach dem Commit steht seine Liste neu im Speicher: Er lädt nicht mehr hoch und sieht die Galerie nur noch nach ihrer Sichtbarkeit.
- **Galerie löschen** (`GalleryService.deleteOwnGallery`): Die Meldung `GalleryDeletedEvent` lässt den `GalleryUploaderService` zuerst die Uploadberechtigten der Galerie löschen (`deleteGalleryUploadersOfDeletedGallery`), in derselben Transaktion, bevor die Galerie selbst geht. Die Bilder aller Uploader bleiben, verlieren die Galerie und werden privat: Jedes gehört danach nur noch seinem Autor.

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/gallery-uploader` | [`GalleryUploaderController.createOwnGalleryUploader`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryUploaderController.java) | `NewGalleryUploader`, `GalleryUploader`; nur der Besitzer der Galerie; 400 ohne User oder für sich selbst, 404 bei fremder Galerie, 409 wenn schon eingetragen |
| GET | `/api/gallery-uploader` | [`GalleryUploaderController.getAllOwnGalleryUploader`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryUploaderController.java) | `GalleryUploader` (Liste): alle Einträge, in denen man selbst der Uploadberechtigte ist; für die Liste der Galerien im eigenen Profil, die Galerie holt der Client über `GET /api/gallery/{id}` |
| POST | `/api/gallery-uploader/resolve` | [`GalleryUploaderController.resolveGalleryUploaders`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryUploaderController.java) | `GalleryUploaderResolveRequest`, `GalleryUploader` (Liste): die Uploadberechtigten einer Galerie, die man sehen darf |
| DELETE | `/api/gallery-uploader` | [`GalleryUploaderController.deleteOwnGalleryUploader`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryUploaderController.java) | `GalleryUploaderDeleteRequest`; nur der Besitzer der Galerie |

Dazu gehört `POST /api/gallery/upload` (`docu/entities/Gallery.md`): Dort lädt ein Uploadberechtigter hoch.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/gallery/controller/GalleryUploaderController.java`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryUploaderController.java): `createOwnGalleryUploader`, `getAllOwnGalleryUploader`, `resolveGalleryUploaders`, `deleteOwnGalleryUploader`
- [`code/backend/src/main/java/de/gebiter/gallery/repository/GalleryUploaderRepository.java`](../../code/backend/src/main/java/de/gebiter/gallery/repository/GalleryUploaderRepository.java): `findByGalleryIdOrderByIdAsc`, `findByUploaderUsersGuidOrderByIdAsc`, `existsByGalleryIdAndUploaderUsersGuid`
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryUploaderService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryUploaderService.java): `createOwnGalleryUploader`, `getAllOwnGalleryUploader`, `resolveGalleryUploaders`, `loadUploaderGalleryIdsIntoMemory`, `getUploaderGalleryIdsFromMemory`, `deleteOwnGalleryUploader`, `deleteGalleryUploadersOfDeletedGallery`, `doGetOwnGalleryUploader`, `doLoadUploaderGalleryIdsIntoMemory`, `reloadUploaderGalleryIdsAfterCommit`, `doLoadUploaderGalleryIdsOfAllIntoMemory`
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryService.java): `isCurrentUsersGalleryUploader`, `doGetVisibleGallery`, `doGetUploadableGallery`, `prepareGalleryUpload`, `resolveGalleries`, `checkVisibleGalleryExists`, `deleteOwnGallery` (schickt `GalleryDeletedEvent`)
- [`code/backend/src/main/java/de/gebiter/security/CurrentUsersProvider.java`](../../code/backend/src/main/java/de/gebiter/security/CurrentUsersProvider.java), [`SecurityContextCurrentUsersProvider.java`](../../code/backend/src/main/java/de/gebiter/security/SecurityContextCurrentUsersProvider.java): `currentUsersUploaderGalleryIds`, `currentUsersOwnGalleryIds`
- [`code/backend/src/main/java/de/gebiter/security/service/SessionService.java`](../../code/backend/src/main/java/de/gebiter/security/service/SessionService.java): `doCreateSession` (lädt beide Listen in den Hauptspeicher)
- [`code/backend/src/main/java/de/gebiter/file/service/FileDocumentResolveService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileDocumentResolveService.java): `createVisibilityFilterQuery` (Lesefilter)
- [`code/backend/src/main/java/de/gebiter/file/service/FileDocumentAccessService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileDocumentAccessService.java): `isFileInCurrentUsersOwnGallery`, `isFileInForeignGallery`, `isCurrentUsersOwnFileOutsideForeignGallery`, `isCurrentUsersOwnFileOrOwnGalleryFile`, `isCurrentUsersMetadataEditor`, `isChangeableByCurrentUsers`, `isManageableByCurrentUsers`, `isDeletableByCurrentUsers`, `requireCurrentUsersMetadataEditor`, `requireCurrentUsersOwnFileOutsideForeignGallery`, `requireCurrentUsersOwnFileOrOwnGalleryFile`
- [`code/backend/src/main/java/de/gebiter/file/service/FileDocumentWriteService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileDocumentWriteService.java): `changeOwnFileDocument`, `changeOwnFileDocumentVisibility`, `changeFileDocumentEditors`, `deleteOwnFileDocument` (prüfen die Rechte oben)
- [`code/backend/src/main/java/de/gebiter/file/service/FileUploadService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileUploadService.java): `uploadFileIntoGallery` (ruft `GalleryService.prepareGalleryUpload`)

## Verwendung im Frontend

- [`code/frontend/src/gallery/useGalleryUploader.ts`](../../code/frontend/src/gallery/useGalleryUploader.ts): `useGalleryUploader`, `createOwnGalleryUploader`, `getAllOwnGalleryUploader`, `resolveGalleryUploaders`, `deleteOwnGalleryUploader`
- [`code/frontend/src/gallery/GalleryUploaderBox.tsx`](../../code/frontend/src/gallery/GalleryUploaderBox.tsx): `GalleryUploaderBox`, `loadGalleryUploaders`, `deleteGalleryUploader`; die Box „Uploadberechtigte“ im Reiter „Freigabe“ der eigenen Galerie
- [`code/frontend/src/gallery/NewGalleryUploaderPopup.tsx`](../../code/frontend/src/gallery/NewGalleryUploaderPopup.tsx): `NewGalleryUploaderPopup`, `handleSave`; „neuer Uploadberechtigter“ mit der globalen Vervollständigung von Usern (`components/UsersSearchInput.tsx`, `docu/entities/Users.md`)
- [`code/frontend/src/gallery/galleryUploaderColumns.tsx`](../../code/frontend/src/gallery/galleryUploaderColumns.tsx): `createGalleryUploaderColumns`; die Spalten User und Rahmen für die zentrale `Table` (Kennung `GALLERY_UPLOADER`)
- [`code/frontend/src/gallery/galleryUploaderTexts.ts`](../../code/frontend/src/gallery/galleryUploaderTexts.ts): die Texte dazu
- [`code/frontend/src/gallery/GallerySharePage.tsx`](../../code/frontend/src/gallery/GallerySharePage.tsx): zeigt die Box unter den Freigaben über einen Link
- [`code/frontend/src/gallery/GalleryPage.tsx`](../../code/frontend/src/gallery/GalleryPage.tsx): `collectInvolvedUsersGuids`, `getAuthorUsersGuid`; lädt die Uploadberechtigten der Galerie: Knopf „neue Bilder“ auch für sie, Rahmen je Bild in der Farbe des Uploaders, Legende (`components/UsersUploadFrameLegend.tsx`)
- [`code/frontend/src/gallery/GalleryListTab.tsx`](../../code/frontend/src/gallery/GalleryListTab.tsx): `loadSharedGalleries`, `isSharedGallery`; im eigenen Profil die gemeinsamen Galerien hinter den eigenen
- [`code/frontend/src/gallery/GalleryTile.tsx`](../../code/frontend/src/gallery/GalleryTile.tsx), [`galleryColumns.tsx`](../../code/frontend/src/gallery/galleryColumns.tsx), [`GallerySharedMark.tsx`](../../code/frontend/src/gallery/GallerySharedMark.tsx): die gemeinsame Galerie als Kachel und als Zeile, kursiv mit der Marke „gemeinsam“ und ihrem Besitzer
- [`code/frontend/src/gallery/GalleryImageTile.tsx`](../../code/frontend/src/gallery/GalleryImageTile.tsx): `frameColor`, der Rahmen der Bildkachel
