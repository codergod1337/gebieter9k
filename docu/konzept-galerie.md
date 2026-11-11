# Konzept: Galerien im Profil

Stand 2026-11-09: **erstes Stück gebaut, getestet und auf dem Pi** (Abschnitt 6). Hier steht nur das erste Stück
genau, der Rest als Richtung (siehe `konzept-lesezugriff.md` für die Lesegrenze im Solr-Dokument).

## 1. Was der Nutzer will (2026-11-09)

- Im Profil ein weiterer Tab „Galerien“ mit der Ansicht der Galerien.
- Ein User legt beliebig viele Galerien an, jede mit Titel, Beschreibung und eigener Sichtbarkeit.
- In eine Galerie lädt er Bilder hoch.
- Beim Anlegen wählt er, welche Art Bilder die Galerie hat (Urlaub, Screenshots, Wallpaper …). Angeboten werden nur
  FileClasses, die der Admin dafür freigegeben hat. Dazu bekommen FileClasses ein **Ziel**: wofür sie benutzt werden
  dürfen. Der Fundus an FileClasses wird stark wachsen.

## 2. Entscheidungen des Nutzers (2026-11-09)

1. **Keine FileClass an der Galerie.** Die FileClass gehört zu jedem Upload. Eine Galerie hat nur ihre id, Titel und
   Beschreibung, die der User selbst festlegt, und ihre Sichtbarkeit.
2. **Ein Bild liegt in genau einer Galerie.** Mehrere sind nicht vorgesehen. Die Galerie ist der Einhängepunkt, über
   den normale User ein Bild hochladen; ins Feld `galleryIds` schreibt das Backend genau die eine id.
3. **Ziel einer FileClass** heißt: in welchem Upload-Weg sie im Dropdown angeboten wird. Beim Hochladen in eine
   Galerie bietet das Dropdown nur FileClasses mit dem Ziel `GALLERY` an, in die der User schreiben darf.
4. **Sortieren per Drag and Drop:** die eigenen Galerien und die Bilder in einer Galerie.

## 3. Erstes Stück

### 3.1 Ziel einer FileClass

- Neues Enum `FileClassDestination` im Code, zuerst nur `GALLERY`. Jedes Ziel ist ein Upload-Weg mit eigenem Code,
  deshalb ein Enum und keine Tabelle mit freien Werten.
- Neue Zuordnung `FileClassDestinationAssignment` (Tabelle `file_class_destination_assignment`): `id`,
  `fileClassKey`, `destination`, eindeutig je Paar.
- Admin-Tab „FileClass-Ziel“ als Matrix wie „FileClass-Endung“.

### 3.2 Galerie

- Entity `Gallery` (Tabelle `gallery`), lose gekoppelt:

| Feld | Was |
|---|---|
| `id` | Long |
| `ownerUsersGuid` | wem sie gehört |
| `title`, `description` | Höchstlängen in der YAML |
| `visibility` | `NONE`, `FRIENDS`, `AUTHENTICATED`, `ANY` |
| `listingPosition` | Reihenfolge der eigenen Galerien, per Drag and Drop |
| `createdAt` | wann angelegt |

- Endpunkte nach den Controller-Regeln: `/api/gallery` (eigene anlegen, ändern, löschen, sortieren) und
  `/api/gallery/resolve` (die Galerien eines Profils, die der Betrachter sehen darf).
- Wer eine Galerie sieht, regelt zuerst die Sichtbarkeit des Profils (privat: nichts), dann die der Galerie.

### 3.3 Hochladen in eine Galerie

- Über den vorhandenen Upload-Weg: JSON plus Bytes, je Request eine Datei, zwei parallel. Das JSON nennt die
  `galleryId` und die FileClass aus dem Dropdown.
- Das Backend prüft:
  - Die Galerie gehört dem User.
  - Die FileClass hat das Ziel `GALLERY`, und der User darf in sie schreiben.
- Dann schreibt es ins Solr-Dokument:
  - `galleryIds` mit genau der einen id;
  - `visibility` aus der Galerie;
  - bei FRIENDS `readableForFriendsOfUsersGuid`.
- Ändert der User die Sichtbarkeit einer Galerie, setzt das Backend beide Felder in allen ihren Dokumenten neu
  (Atomic Update), wie in `konzept-lesezugriff.md`.
- Reihenfolge der Bilder: ein Feld im Solr-Dokument (`galleryListingPosition`), Sortieren schreibt die geänderten
  Dokumente per Atomic Update. Die Plätze sind lückenlos 1 bis n und heilen sich selbst, siehe Abschnitt 7.

### 3.4 Oberfläche

- **Profil-Tabs im Subheader:** „Übersicht“ (`/profile/<guid>`) und „Galerien“ (`/profile/<guid>/galleries`).
- **Liste der Galerien:**
  - Kacheln mit Titel, Sichtbarkeit und einem Vorschaubild, im eigenen Profil per Drag and Drop sortierbar.
  - Im eigenen Profil der `NewEntityButton` „neue Galerie“, als Popup mit Titel, Beschreibung und Sichtbarkeit
    (dieselbe Auswahl `VisibilityPicker` wie überall).
- **Eine Galerie** (`/profile/<guid>/galleries/<id>`, unter dem Tab „Galerien“, der dort aktiv bleibt):
  - Bilder als Kacheln aus Solr, mit dem Lesefilter, Vorschau aus `previewBase64Png`, seitenweise mit
    `PageNavigation`, im eigenen Profil per Drag and Drop sortierbar.
  - Im eigenen Profil die `FileDropzone` mit dem Dropdown der FileClasses.
  - Ein Klick öffnet den Viewer, mit Origin und Seite in der Adresse nach `konzept-navigation.md`.

## 4. Danach (nur Richtung)

Weitere Ziele (Profilbanner, Shop-Grafik), offizielle Galerien und Challenges der Plattform.

## 5. Noch offen

1. **Galerie löschen:** Gebaut ist vorerst: Die Bilder bleiben erhalten, verlieren Galerie und Platz und werden privat
   (`visibility` NONE). Der Nutzer kann stattdessen „mit löschen“ (weich, `DELETED`) wählen.
2. **Weitere Ziele:** Gebaut ist nur `GALLERY`. Profilbanner und Shop-Grafik kommen als eigene Ziele, wenn sie dran
   sind.

## 6. Gebaut (2026-11-09)

**Backend**
- `file/model/FileClassDestination` (Enum, nur `GALLERY`), `FileClassDestinationAssignment` (Tabelle
  `file_class_destination_assignment`), Service, `FileClassDestinationAssignmentController`
  (`GET /api/file-class-destination-assignment`, für das Dropdown) und `…AdminController` (`/api/admin/…`: anlegen,
  lesen, löschen).
- `gallery/`: Entity `Gallery`, `GalleryRepository`, `GalleryService` (alle Rechte), `GalleryController`
  (`/api/gallery`): POST anlegen, POST `/upload` (multipart), GET `/{id}`, POST `/resolve` (Galerien eines Profils),
  POST `/file/resolve` (eine Seite Bilder), PUT ändern, PUT `/listing-position`, PUT `/file/listing-position`, DELETE.
- Upload: `FileUploadService.uploadFileIntoGallery`. Der Teil `data` ist `{galleryId, fieldValuesByFieldName}`. Das
  Backend prüft Besitz und Ziel und schreibt `galleryIds`, `galleryListingPosition` (ans Ende), `visibility` und
  `readableForFriendsOfUsersGuid`.
- Solr-Feld `galleryListingPosition` (LONG, docValues, Leser USER, nur Backend) im Kern FILE angelegt und
  synchronisiert. Sortiert wird nach `galleryListingPosition asc, uploadedAt asc`.
- YAML `gebiter.gallery`: Titel 100, Beschreibung 2000, 24 Bilder je Seite.

**Frontend**
- Profil als Modul mit Subheader-Tabs „Übersicht“ (`ProfileHome`: eigenes oder fremdes Profil) und „Galerien“, darunter
  `<Outlet/>`. Die Dummy-Box „Galerie“ in der Übersicht ist entfernt.
- `gallery/`: `GalleryListTab` (Kacheln, `NewEntityButton` „neue Galerie“, Drag and Drop), `GalleryEditPopup`,
  `GalleryTile`, `GalleryPage` (Seite und Bild in der Adresse, Viewer), `GalleryUploadBox`, `GalleryImageTile`,
  `GalleryImageViewerPopup`.
- **Hochladen = der globale Upload-Ablauf** `file/upload/FileUploadForm` (Nutzer 2026-11-09: genau wie im File-Manager).
  `GalleryUploadBox` gibt nur mit: die FileClasses mit Ziel GALLERY und Schreibrecht, den Endpunkt `/api/gallery/upload`,
  eigene gemerkte fertige Uploads je Galerie und die Felder je Bild: **nur Beschreibung und Tags** (Tags mit
  Vervollständigung aus allen Dateien, statt eines Titels; kein Dateiname, kein `wtf`). Eine Liste je Bild von der Prüfung
  bis „ausgewertet“, mit Platz in der Warteschlange und Schritt der Auswertung. Nach jedem Upload und nach jeder fertigen
  Auswertung lädt die Galerie ihre Bilder neu.
- Admin-Tab „FileClass-Ziel“ (Matrix, `settingKey` `FILE_CLASS_DESTINATION`).
- CSS: Lage in `base.css` (Variablen `--gallery-tile-min-width` usw.), Aussehen im Theme (Abschnitt „Galerien“).

**Daten auf dem Pi:** `FOTO_URLAUB`, `FOTO_WALLPAPER` und `FOTO_SCREENSHOT` sind am Ziel `GALLERY` freigegeben.

**Getestet** (Wegwerf-Test gegen die Pi-DB, danach gelöscht):
- Anlegen mit Prüfung von Titel und Sichtbarkeit; Upload von 3 PNGs mit fertiger Analyse und Vorschau.
- FileClass ohne Ziel GALLERY wird abgelehnt.
- Bilder sortieren, auch das Abweisen einer veralteten Liste; Galerien sortieren.
- Sichtbarkeit FRIENDS und AUTHENTICATED geht auf die Dokumente über. Ein Fremder sieht NONE- und FRIENDS-Galerien
  nicht und darf weder ändern noch hochladen, sortieren oder löschen.
- Löschen; danach sind alle Testdateien endgültig entfernt.

## 7. Plätze der Bilder: lückenlos 1 bis n, selbstheilend (2026-11-11)

**Der Fehler vorher:** Das Sortieren verglich nur, ob an einer Stelle der Liste ein anderes Bild steht als vorher, nicht
den Platz, der im Dokument steht. Waren die Plätze schon lückenhaft, schrieb es doppelte Plätze. Beispiel: vier Bilder
P, Q, R, S auf den Plätzen 2 bis 5 (Platz 1 fehlte nach einem Löschen), der Besitzer zieht S vor R. Gespeichert wurde
P:2, S:2, Q:3, R:3 statt P, Q, S, R.

**Die Regel jetzt:** Die aktiven Bilder einer Galerie stehen auf den Plätzen 1 bis n, ohne Lücke und ohne doppelten
Platz. Eine Methode bringt das in Ordnung, `GalleryService.doRepairGalleryFileListingPositions`:

1. Sie liest je aktivem Bild nur id und Platz, in der Reihenfolge der Galerie (nach Platz, bei gleichem Platz nach
   Upload): `FileDocumentResolveService.resolveActiveFileDocumentListingPositionsOfGallery`.
2. Das erste Bild bekommt Platz 1, das zweite 2 und so weiter. Geschrieben werden nur Bilder, deren gespeicherter Platz
   abweicht, alle in einer Anfrage an Solr mit einem Commit
   (`FileDocumentWriteService.changeBackendFieldValuesOfFileDocuments` →
   `SolrDocumentService.setFieldValuesOfSolrDocuments`). Stimmen alle Plätze, wird nichts geschrieben.

**Wann sie läuft:**

| Anlass | Stelle | Beispiel |
|---|---|---|
| Der Besitzer löst die Bilder seiner Galerie auf (`POST /api/gallery/file/resolve`) | `GalleryService.resolveGalleryFiles`, vor dem Lesen der Seite | Plätze 2, 2, 3, 3 werden zu 1, 2, 3, 4; die Antwort zeigt schon die neuen Plätze |
| Vor einem Upload in die Galerie | `GalleryService.prepareOwnGalleryUpload` | drei Bilder auf 1 bis 3, das neue bekommt 4 |
| Ein Bild der Galerie wird weich gelöscht (Autor oder Admin) | Meldung `FileDocumentSoftDeletedEvent` aus `FileDocumentWriteService`, gehört von `GalleryService` | fünf Bilder, Platz 3 gelöscht: aus 4 und 5 werden 3 und 4 |

Das Sortieren (`PUT /api/gallery/file/listing-position`) schreibt die Plätze ohnehin neu und vergleicht dabei mit dem
gespeicherten Platz jedes Bildes (`GalleryService.doSetGalleryFileListingPositions`).

**Was bewusst nicht geschieht:**

- Kein Reparieren beim Suchen und nicht für andere User: Nur der Besitzer hat Schreibrecht an der Galerie. Ein Besucher
  sieht trotzdem dieselbe Reihenfolge, denn sortiert wird nach Platz und bei gleichem Platz nach Upload.
- Das Frontend erfährt vom Reparieren nichts und braucht es nicht: Das Backend macht nach dem Schreiben selbst einen
  Commit und wartet, bis er sichtbar ist. Die Seite, die es danach liest und zurückgibt, enthält schon die neuen Plätze.
  (Solrs eigener Commit alle 10 Sekunden, `-Dsolr.autoSoftCommit.maxTime=10000` in `code/compose.yaml`, ist nur das
  Netz für alles, was ohne eigenen Commit geschrieben würde.)
- Scheitert das Aufrücken nach einem Löschen, bleibt das Löschen gültig; die Lücke schließt sich beim nächsten Auflösen
  durch den Besitzer.
- Der Upload schickt zwei Dateien gleichzeitig (3.3). Beide fragen ihren Platz, bevor das Dokument der anderen
  angelegt ist, und bekommen deshalb denselben. Das wird nicht verhindert, es heilt: Die Galerie lädt nach jedem Upload
  ihre Bilder neu, das ist ein Auflösen durch den Besitzer; der ältere Upload steht danach vorn.

**Alte Daten:** Bis 2026-11-11 zählten die Plätze ab 0. Jede Galerie stellt sich beim ersten Auflösen durch ihren
Besitzer von selbst auf 1 bis n um. Stand auf dem Pi am 2026-11-11 vor dem Umbau: Galerie 5 mit neun Bildern auf den
Plätzen 0, 1, 2, 2, 4, 4, 6, 7, 8 (zweimal derselbe Platz durch gleichzeitige Uploads, die Plätze 3 und 5 fehlen).
Öffnet der Besitzer sie, werden daraus 1 bis 9, im Log steht „Galerie 5: Plätze von 9 Bildern in Ordnung gebracht“.

**Getestet** (beide Tests danach gelöscht):
- Wegwerf-Test mit nachgestellten Services: Sortieren bei Lücke und bei doppelten Plätzen, Auflösen durch den Besitzer
  (Reparatur vor dem Lesen der Seite) und durch einen Fremden (keine Prüfung, kein Schreiben), Upload (alte Plätze ab 0
  werden zu 1 bis 3, das neue Bild bekommt 4), Löschen (Aufrücken, Fehler wird nur geloggt).
- Wegwerf-Test gegen den Solr des Pi (vom Mac aus, über das LAN): 300 Testdokumente einer Galerie, die es nicht gibt,
  alle Plätze falsch. Nur prüfen ohne Abweichung: 44 ms. Alle 300 reparieren (lesen, 300 schreiben, ein Commit): 0,5 s.
  Ein Bild aus der Mitte weg, 199 rücken auf: 0,25 s. Die Meldung `FileDocumentSoftDeletedEvent` kommt beim
  `GalleryService` an. Danach sind alle Testdokumente wieder entfernt (geprüft: 0 übrig).
