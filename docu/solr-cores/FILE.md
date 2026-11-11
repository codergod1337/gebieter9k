# Solr-Kern FILE

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Export vom 2026-11-09T20:23:30.316344Z (23 Dokumente). Die Felder stehen in Postgres (`solr_field`, Solr-Manager).

| Pos. | Feld | Typ | indexiert | gespeichert | mehrwertig | docValues | Pflicht | Suggest | NGram | vom Client | Suchgewicht | lesen ab | Anzeigename | Beschreibung |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | STRING | ja | ja |  | ja | ja |  |  |  | -1 | USER | ID (SHA-256) | SHA-256-Hex der Bytes, zugleich der Schlüssel des Dokuments. |
| 2 | `wtf` | STRING | ja | ja | ja | ja |  | ja |  | ja | 2 | USER | WTF | Beliebige Markierungen an einem Dokument, an denen Code und Masken es wiederfinden, z. B. PROFILE_BANNER. |
| 3 | `sftpPath` | STRING |  | ja |  |  | ja |  |  |  | -1 | (nur Backend) | SFTP-Pfad | Pfad der Bytes auf dem SFTP, relativ zur Wurzel. Nur fürs Backend. |
| 4 | `authorUsersGuid` | STRING | ja | ja |  | ja | ja |  |  |  | -1 | USER | Autor | GUID des Users, der die Datei hochgeladen hat: der Autor, nicht der Besitzer. Zu ändern erlaubt ihm die Datei seine Schreibrolle an der FileClass. |
| 5 | `fileClassKey` | STRING | ja | ja |  | ja | ja |  |  | ja | -1 | USER | FileClass | Key der FileClass. Aus ihr kommen die Rollenlisten; ein Wechsel läuft über einen eigenen Vorgang. |
| 6 | `readerAccessRoleKeys` | STRING | ja | ja | ja | ja |  |  |  |  | -1 | USER | Leserollen | Rollen, die die Datei lesen dürfen, aus der FileClass. Enthält jede Schreibrolle. Pflichtfilter jeder Abfrage. |
| 7 | `writerAccessRoleKeys` | STRING | ja | ja | ja | ja |  |  |  |  | -1 | USER | Schreibrollen | Rollen, die die Datei ändern dürfen, aus der FileClass. |
| 8 | `analysisStatus` | STRING | ja | ja |  | ja |  |  |  |  | -1 | USER | Auswertung | Stand der Auswertung nach dem Upload: PENDING wartet (Tika, Texterkennung, EXIF, Vorschau), DONE fertig, FAILED gescheitert. |
| 9 | `status` | STRING | ja | ja |  | ja | ja |  |  |  | -1 | USER | Status | ACTIVE (aktiv), DEACTIVATED (deaktiviert: in der Suche, Felder gesperrt), ARCHIVED (archiviert: für normale User nur lesbar) oder DELETED (Soft-Delete, nur Admin über Admin-Endpunkte). |
| 10 | `fileName` | TEXT_EDGE | ja | ja |  |  |  |  | ja | ja | 5 | USER | Dateiname | Name der Datei. |
| 12 | `fileDescription` | TEXT_SUCHE | ja | ja |  |  |  |  |  | ja | 3 | USER | Beschreibung | Beschreibung der Datei. |
| 13 | `tikaFileDescription` | TEXT_SUCHE | ja | ja |  |  |  |  |  |  | -1 | USER | Von Tika gelesener Text | Texterkennung eines Bildes oder Inhalt eines Dokuments, setzt die Auswertung |
| 14 | `tags` | STRING | ja | ja | ja | ja |  | ja |  | ja | 4 | USER | Tags | Schlagwörter, je Tag ein Wert. |
| 15 | `fileExtension` | STRING | ja | ja |  | ja |  |  |  |  | -1 | USER | Endung | Endung der Datei, klein, ohne Punkt. |
| 16 | `mimeType` | STRING | ja | ja |  | ja |  |  |  |  | -1 | USER | MIME-Typ | Typ der Datei laut Tika, erkannt an den Bytes. |
| 17 | `fileSizeBytes` | LONG | ja | ja |  | ja |  |  |  |  | -1 | USER | Größe (Bytes) | Größe der Datei in Bytes. |
| 18 | `galleryIds` | LONG | ja | ja | ja | ja |  |  |  |  | -1 | USER | Galerien | ids der Galerien (Postgres, Tabelle gallery), in denen die Datei steht. Damit löst man alle Bilder einer Galerie als Vorschaukacheln auf; das Bild selbst kommt für Viewer und Download vom SFTP. |
| 19 | `uploadedAt` | DATE | ja | ja |  | ja |  |  |  |  | -1 | USER | Hochgeladen am | Zeitpunkt des Uploads. |
| 20 | `lastChangedAt` | DATE | ja | ja |  | ja |  |  |  |  | -1 | USER | Zuletzt geändert | Zeitpunkt der letzten Änderung. |
| 21 | `cheerUpCount` | LONG | ja | ja |  | ja |  |  |  |  | -1 | USER | Cheers hoch | Zahl der Upvotes, zum Sortieren. Wer wie bewertet hat, steht in FileCheer (Postgres). |
| 22 | `cheerDownCount` | LONG | ja | ja |  | ja |  |  |  |  | -1 | USER | Cheers runter | Zahl der Downvotes, zum Sortieren. Wer wie bewertet hat, steht in FileCheer (Postgres). |
| 23 | `previewBase64Png` | STRING |  | ja |  |  |  |  |  |  | -1 | USER | Vorschau | PNG als Base64, höchstens 200 × 200 Pixel, Seitenverhältnis bleibt, Rest transparent. |
| 24 | `searchableText` | TEXT_SUCHE | ja | ja |  |  |  |  |  |  | 1 | USER | Volltext | Text aus der Datei laut Tika. Geht nie zum Client. |
| 25 | `imageWidth` | LONG | ja | ja |  | ja |  |  |  |  | -1 | USER | Bildbreite (px) | Breite des Bildes in Pixeln. |
| 26 | `imageHeight` | LONG | ja | ja |  | ja |  |  |  |  | -1 | USER | Bildhöhe (px) | Höhe des Bildes in Pixeln. |
| 27 | `capturedAt` | DATE | ja | ja |  | ja |  |  |  |  | -1 | USER | Aufgenommen am | Aufnahmezeit laut EXIF. |
| 28 | `cameraModel` | STRING | ja | ja |  | ja |  | ja |  |  | -1 | USER | Kamera | Kameramodell laut EXIF. |
| 29 | `gpsLatitude` | DOUBLE | ja | ja |  |  |  |  |  |  | -1 | ADMIN | GPS Breite | Breitengrad laut EXIF. |
| 30 | `gpsLongitude` | DOUBLE | ja | ja |  |  |  |  |  |  | -1 | ADMIN | GPS Länge | Längengrad laut EXIF. |
| 31 | `cursorDate` | DATE | ja | ja |  | ja |  |  |  |  | -1 | ADMIN | Zuletzt durchlaufen | Wann ein Durchlauf über alle Dateien (z. B. neu indizieren) diese Datei zuletzt angefasst hat. Der Zeiger, um alle Dateien der Reihe nach zu durchlaufen und nach einem Abbruch weiterzumachen. Setzt nur das Backend. |
| 32 | `visibility` | STRING | ja | ja |  | ja |  |  |  |  | -1 | USER | Sichtbarkeit | Wer die Datei sieht: NONE nur der Autor, FRIENDS seine Freunde, AUTHENTICATED jeder Angemeldete, ANY alle. Setzt das Backend, später aus der Galerie; beim Upload NONE. ADMIN und FILE_MANAGER sehen jede Datei. |
| 33 | `readableForFriendsOfUsersGuid` | STRING | ja | ja |  | ja |  |  |  |  | -1 | (nur Backend) | Lesbar für Freunde von | Bei FRIENDS die GUID des Autors: Seine Freunde dürfen die Datei lesen. Sonst leer. Der Lesefilter vergleicht sie mit der Freundesliste des Lesers aus dem Hauptspeicher, ohne Postgres. Setzt nur das Backend. |
| 34 | `galleryListingPosition` | LONG | ja | ja |  | ja |  |  |  |  | -1 | USER | Platz in der Galerie | Reihenfolge des Bildes in seiner Galerie (Drag and Drop), setzt das Backend. |
| 35 | `editorUsersGuids` | STRING | ja | ja | ja | ja |  |  |  |  | -1 | USER | Bearbeiter | GUIDs der User, die der Autor zum Bearbeiten der Metadaten freigegeben hat; sie dürfen die Datei auch lesen. Setzt nur das Backend. |

## Beispiel-Dokument

Das erste Dokument des Exports, lange Werte gekürzt:

```json
{
  "fileName": "A7R05831.jpg",
  "fileClassKey": "FOTO_WALLPAPER",
  "id": "12c9550b43f01716ed6aed82544c870ac4dcd797ae656071ac48c48e573c2041",
  "sftpPath": "2026/11/08/12c9550b43f01716ed6aed82544c870ac4dcd797ae656071ac48c48e573c2041.bin",
  "readerAccessRoleKeys": [
    "USER"
  ],
  "writerAccessRoleKeys": [
    "USER"
  ],
  "status": "ACTIVE",
  "fileExtension": "jpg",
  "fileSizeBytes": 40818029,
  "uploadedAt": "2026-11-08T03:38:34.775Z",
  "lastChangedAt": "2026-11-08T03:38:34.775Z",
  "cheerUpCount": 0,
  "cheerDownCount": 0,
  "mimeType": "image/jpeg",
  "imageWidth": 6193,
  "imageHeight": 8138,
  "capturedAt": "2026-07-31T18:43:34Z",
  "cameraModel": "ILCE-7RM4",
  "analysisStatus": "DONE",
  "tikaFileDescription": "Y yeaaiee ie Ae\nLa J\nBBO pai)\n©",
  "authorUsersGuid": "77777777-7777-7777-7777-777777777777",
  "visibility": "NONE",
  "previewBase64Png": "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAACAAElEQVR4Xty9…"
}
```

## Endpunkte

Alle Endpunkte, deren Pfad oder Signatur zum Kern gehört (Muster `file-document|\bFile(?:Document|Upload)\w*`).

| Methode | Pfad | Controller |
|---|---|---|
| DELETE | `/api/admin/file-document` | [`FileDocumentAdminController.deleteFileDocument`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentAdminController.java) |
| DELETE | `/api/admin/file-document/finally` | [`FileDocumentAdminController.deleteFileDocumentFinally`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentAdminController.java) |
| GET | `/api/file-document/analysis-status-value-set` | [`FileDocumentController.getFileAnalysisStatusValueSet`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| GET | `/api/file-document/status-value-set` | [`FileDocumentController.getFileStatusValueSet`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| GET | `/api/file-document/field-name-set` | [`FileDocumentController.getFileSolrFieldNameSet`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| GET | `/api/file-document/existence/{sha256Hex}` | [`FileDocumentController.getFileDocumentExistence`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| GET | `/api/file-document/{id}` | [`FileDocumentController.getFileDocumentForClient`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| POST | `/api/file-document/resolve` | [`FileDocumentController.resolveFileDocuments`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| POST | `/api/file-document/search-field-values` | [`FileDocumentController.searchFileFieldValues`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| POST | `/api/file-document/analysis-progress/resolve` | [`FileDocumentController.resolveFileAnalysisProgress`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| GET | `/api/file-document/download/{id}` | [`FileDocumentController.downloadFileDocument`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| GET | `/api/file-document/view/{id}` | [`FileDocumentController.viewFileDocument`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| PUT | `/api/file-document` | [`FileDocumentController.changeOwnFileDocument`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| PUT | `/api/file-document/editors` | [`FileDocumentController.changeFileDocumentEditors`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| PUT | `/api/file-document/visibility` | [`FileDocumentController.changeOwnFileDocumentVisibility`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| DELETE | `/api/file-document` | [`FileDocumentController.deleteOwnFileDocument`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) |
| POST | `/api/file-manager/file-document/upload` | [`FileDocumentFileManagerController.uploadFile`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentFileManagerController.java) |
| PUT | `/api/file-manager/file-document` | [`FileDocumentFileManagerController.changeFileDocument`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentFileManagerController.java) |
| PUT | `/api/file-manager/file-document/visibility` | [`FileDocumentFileManagerController.changeFileDocumentVisibility`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentFileManagerController.java) |
| POST | `/api/gallery/upload` | [`GalleryController.uploadFileIntoGallery`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) |
| POST | `/api/gallery/file/resolve` | [`GalleryController.resolveGalleryFiles`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryController.java) |
