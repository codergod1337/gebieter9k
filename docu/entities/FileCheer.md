# FileCheer

> Von Hand im Format von `docu/tools/generate_entity_docs.py` geschrieben (2026-11-11), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Die Stimme eines Users zu einer Datei: begeistert (cheerUp, in der Oberfläche 🤩) oder angewidert (cheerDown, 🤮); Smileys statt der Daumen von Facebook (Nutzer 2026-11-11). Je User und Datei gibt es höchstens eine Zeile, das sichert die Datenbank selbst (`uq_file_cheer`); so kann niemand zweimal abstimmen. Wechselt der User die Richtung, wird seine Zeile umgestellt, nimmt er die Stimme zurück, wird sie gelöscht. Die Stimmen sind nicht anonym: Jeder, der die Datei lesen darf, sieht, wer zuletzt wie gestimmt hat. Im Solr-Dokument der Datei stehen nur die beiden Zähler `cheerUpCount` und `cheerDownCount` (Kern [FILE](../solr-cores/FILE.md), zum Sortieren); der `FileCheerService` zählt sie nach jeder Stimme aus dieser Tabelle neu. Lose gekoppelt, ohne JPA-Beziehung: Die Datei ist ein Solr-Dokument, der User nur seine GUID.

- **Tabelle:** `file_cheer`, eindeutig je `file_document_id` und `users_guid`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/file/model/FileCheer.java`](../../code/backend/src/main/java/de/gebiter/file/model/FileCheer.java)
- **Enum:** [`FileCheerDirection`](../../code/backend/src/main/java/de/gebiter/file/model/FileCheerDirection.java) (`UP`, `DOWN`)
- **Frontend-Typ:** [`code/frontend/src/file/FileCheer.ts`](../../code/frontend/src/file/FileCheer.ts) (`FileCheerState`, `FileCheerDirection`)
- **DTOs:** `FileCheerDeleteRequest`, `FileCheerState`, `FileCheerUsersPage`, `FileCheerUsersResolveRequest`, `NewFileCheer`; Meldung `FileDocumentFinallyDeletedEvent`

## Regeln (Nutzer 2026-11-11)

- Stimmen darf, wer die Datei lesen darf, auch ihr Autor. Eine Datei, die er nicht lesen darf, sieht aus wie „gibt es nicht“ (404).
- Je User und Datei eine Stimme. Ein Klick auf den anderen Smiley wechselt, ein Klick auf den eigenen nimmt die Stimme zurück.
- **Kein Einfluss auf Suchen und Auflösen:** Dateien kommen sofort aus Solr, ohne Postgres. Erst wenn sie angezeigt sind, lädt die Oberfläche die Stimmen nach, je Datei eine eigene kleine Anfrage (`GET /api/file-cheer/{fileDocumentId}`): auf der Seite einer Datei, an jeder Bildkachel einer Galerie und am großen Bild. Bis die Antwort da ist, steht dort ein kleiner Spinner; danach die beiden Smileys mit Zahl, die eigene Stimme hervorgehoben.
- **Nie alle User laden:** Die Antwort enthält beide Zahlen, die eigene Stimme und je Richtung nur die neuesten User (`gebiter.file.cheer-shown-users-max`, 15). Ihre Namen fragt erst die Sprechblase eines Smileys ab, wenn sie aufgeht, je GUID einmal (`GET /api/users/avatar/{guid}`); darunter steht „und 4.985 weitere“.
- **Sprechblase zum Hineinklicken (Nutzer 2026-11-11):** Wer über einen Smiley fährt, sieht die User, die zuletzt so gestimmt haben; jeder Name führt über seine GUID auf das Profil. Ein kleines Suchfeld blendet alle aus, deren Name nicht passt (Teilstring, Fundstelle markiert). Gesucht wird in den geladenen Namen: zuerst die neuesten 15, nach „Alle laden“ in allen. Die Liste mit Suchfeld ist eine eigene Komponente für jedes Hoverlay mit einer Liste (`SearchableList`, für User `UsersGuidList`).
- **„Alle laden“ (Nutzer 2026-11-11):** Hat eine Richtung mehr Stimmen als die 15 genannten, steht in der Sprechblase „und n weitere“ mit dem Knopf „Alle laden“. Er holt alle User gemütlich nach, eine Seite nach der anderen (`POST /api/file-cheer/users/resolve`, `gebiter.file.cheer-users-page-size` = 100 GUIDs je Seite), und zu jeder Seite gleich die Namen in einer Sammel-Anfrage (`POST /api/users/avatar/resolve`). Solange steht der Spinner mit „1.200 von 5.000 geladen …“ da; erst wenn alles da ist, erscheint die ganze Liste. Das Nachladen läuft weiter, auch wenn die Sprechblase zwischendurch zugeht. Stimmt danach jemand, gilt wieder die Liste der neuesten.
- **Wo die Smileys stehen:** an der Bildkachel oben mittig über dem Bild, am großen Bild in der Fußzeile, auf der Seite der Datei unter der Vorschau. Die Sprechblase geht nach oben auf, damit sie nichts verdeckt, was darunter zum Anklicken steht (an der Kachel die Aktionsleiste).
- **Texte mehrsprachig (Nutzer 2026-11-11):** „Begeistert“, „Angewidert“ und alle Hinweise der Sprechblase stehen je Sprachkürzel in [`fileCheerTexts.ts`](../../code/frontend/src/file/cheer/fileCheerTexts.ts) (`{ de: '…' }`, Platzhalter in geschweiften Klammern), die der User-Liste in `UsersGuidList.tsx`; eine weitere Sprache kommt dort je Text dazu. In der Sprechblase stehen Bezeichnung und Zahl nebeneinander, beide neongelb.
- **Beim Zeigen** wächst der Smiley, bekommt einen neongelben Schein und sieht schon so aus wie nach dem Klick: ein fremder Bordeaux wie die eigene Stimme, der eigene hell mit gestrichelter Kante (Stimme zurücknehmen). Direkt nach einem Klick zeigt er den neuen Stand, bis der Zeiger ihn verlässt.
- Wird eine Datei endgültig gelöscht, gehen ihre Stimmen mit (`FileDocumentFinallyDeletedEvent`, eine Löschanweisung für alle Zeilen). Beim weichen Löschen bleiben sie.

Beispiel: Bob stimmt bei Alices Urlaubsfoto „begeistert“, im Dokument steht `cheerUpCount` 1, `cheerDownCount` 0. Klickt er auf „angewidert“, wird dieselbe Zeile umgestellt: 0 und 1. Klickt er noch einmal auf „angewidert“, ist die Zeile weg: 0 und 0.

## Beispiel-JSON

Die Entity selbst geht nie zum Client. Was der Client bekommt, ist der Stand der Stimmen (`FileCheerState`); die Werte sind erfunden.

```json
{
  "fileDocumentId": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "cheerUpCount": 5000,
  "cheerDownCount": 3000,
  "cheerUpUsersGuids": ["77777777-7777-7777-7777-777777777777", "… höchstens 15, der neueste zuerst"],
  "cheerDownUsersGuids": ["019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b", "… höchstens 15"],
  "directionOfCurrentUsers": "UP"
}
```

Eine Stimme abgeben (`NewFileCheer`): `{"fileDocumentId": "9f86…0a08", "direction": "DOWN"}`. Zurücknehmen (`FileCheerDeleteRequest`): `{"fileDocumentId": "9f86…0a08"}`.

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | nein |  |
| `fileDocumentId` | `String` | Pflicht, max. 64 Zeichen, unveränderlich | als `fileDocumentId` des Stands | id der Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | in `cheerUpUsersGuids` oder `cheerDownUsersGuids`, wenn er zu den neuesten gehört | GUID des Users, der gestimmt hat. |
| `direction` | `FileCheerDirection` | Enum als Text, Pflicht, max. 10 Zeichen | bestimmt Zähler und Liste; die eigene als `directionOfCurrentUsers` | Begeistert (`UP`) oder angewidert (`DOWN`). |
| `cheeredAt` | `OffsetDateTime` | Pflicht | nein, bestimmt die Reihenfolge der Listen | Wann der User gestimmt hat; wechselt er die Richtung, der Zeitpunkt des Wechsels. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/file-cheer` | [`FileCheerController.createOwnFileCheer`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCheerController.java) | `NewFileCheer`, `FileCheerState` |
| GET | `/api/file-cheer/{fileDocumentId}` | [`FileCheerController.getFileCheerState`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCheerController.java) | `FileCheerState` |
| POST | `/api/file-cheer/users/resolve` | [`FileCheerController.resolveFileCheerUsersGuids`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCheerController.java) | `FileCheerUsersResolveRequest`, `FileCheerUsersPage` |
| DELETE | `/api/file-cheer` | [`FileCheerController.deleteOwnFileCheer`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCheerController.java) | `FileCheerDeleteRequest`, `FileCheerState` |

Alle für jeden angemeldeten User (Pfad `/api/**`). Stimmen, Lesen und Zurücknehmen antworten mit dem Stand der Stimmen danach; das Auflösen mit einer Seite User: `{"fileDocumentId": "9f86…0a08", "direction": "UP", "page": 0}` ergibt `{"usersGuids": ["…"], "totalCount": 5000, "page": 0, "pageSize": 100, …}`.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/repository/FileCheerRepository.java`](../../code/backend/src/main/java/de/gebiter/file/repository/FileCheerRepository.java): `findByFileDocumentIdAndDirectionOrderByCheeredAtDescIdDesc` (seitenweise), `findByFileDocumentIdAndUsersGuid`, `countByFileDocumentIdAndDirection`, `deleteAllByFileDocumentId`
- [`code/backend/src/main/java/de/gebiter/file/service/FileCheerService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileCheerService.java): `createOwnFileCheer`, `getFileCheerState`, `resolveFileCheerUsersGuids`, `deleteOwnFileCheer`, `deleteFileCheersOfFinallyDeletedFileDocument`, `requireReadableFileDocumentId`, `doGetFileCheerState`, `doGetNewestCheerUsersGuids`, `doGetCheerUsersGuids`, `doWriteFileCheerCounts`
- [`code/backend/src/main/java/de/gebiter/file/controller/FileCheerController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCheerController.java): `createOwnFileCheer`, `getFileCheerState`, `resolveFileCheerUsersGuids`, `deleteOwnFileCheer`
- [`code/backend/src/main/java/de/gebiter/file/service/FileDocumentWriteService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileDocumentWriteService.java): `deleteFileDocumentFinally` (meldet `FileDocumentFinallyDeletedEvent`), `changeFileDocumentBackendFieldValues` (schreibt die Zähler)

## Verwendung im Frontend

- [`code/frontend/src/file/useFileCheer.ts`](../../code/frontend/src/file/useFileCheer.ts): `useFileCheer`, `createOwnFileCheer`, `getFileCheerState`, `resolveFileCheerUsersGuids`, `deleteOwnFileCheer`
- [`code/frontend/src/file/cheer/FileCheerHint.tsx`](../../code/frontend/src/file/cheer/FileCheerHint.tsx): der Inhalt der Sprechblase eines Smileys (Zahl, Hinweis, Liste, „Alle laden“)
- [`code/frontend/src/file/cheer/useFileCheerAllUsers.ts`](../../code/frontend/src/file/cheer/useFileCheerAllUsers.ts): `useFileCheerAllUsers`, lädt alle User einer Richtung Seite für Seite nach
- [`code/frontend/src/file/cheer/FileCheerBar.tsx`](../../code/frontend/src/file/cheer/FileCheerBar.tsx): `FileCheerBar`, `cheer`, `renderCheerButton`
- [`code/frontend/src/components/UsersGuidList.tsx`](../../code/frontend/src/components/UsersGuidList.tsx): die User einer Richtung als Liste mit Suchfeld, Namen je GUID über `useUsersAvatarsForClient`
- [`code/frontend/src/components/SearchableList.tsx`](../../code/frontend/src/components/SearchableList.tsx): die Liste mit Suchfeld, überall dieselbe
- [`code/frontend/src/components/Hoverlay.tsx`](../../code/frontend/src/components/Hoverlay.tsx): mit `interactive` die Sprechblase zum Hineinklicken
- [`code/frontend/src/file/document/FileDocumentDetailPage.tsx`](../../code/frontend/src/file/document/FileDocumentDetailPage.tsx): zeigt die `FileCheerBar` unter der Kachel
- [`code/frontend/src/gallery/GalleryImageTile.tsx`](../../code/frontend/src/gallery/GalleryImageTile.tsx): zeigt die `FileCheerBar` an jeder Bildkachel, unter dem Bild
- [`code/frontend/src/gallery/GalleryImageViewerPopup.tsx`](../../code/frontend/src/gallery/GalleryImageViewerPopup.tsx): zeigt die `FileCheerBar` am großen Bild, in der Fußzeile
- Einstellungen: `gebiter.file.cheer-shown-users-max` (15 genannte User je Richtung) und `gebiter.file.cheer-users-page-size` (100 je Seite bei „Alle laden“) in [`application.yaml`](../../code/backend/src/main/resources/application.yaml), gelesen von `FileConfig.cheerShownUsersMax` und `FileConfig.cheerUsersPageSize`
- Aussehen: `.file-cheer`, `.file-cheer-button` (mit `-own`, `-settled`), `.file-cheer-count`, `.file-cheer-hint` (mit `-title`, `-count`, `-note`, `-more`), an der Kachel `.gallery-image-tile-cheers` in [`base.css`](../../code/frontend/src/styles/base.css), Farben in [`default.css`](../../code/frontend/public/themes/default.css) (dieselben Pillen wie die Smileys des Gästebuchs)

## Getestet (2026-11-11, Wegwerf-Test gegen die Pi-DB und den Solr, danach gelöscht)

Die Autorin stimmt für ihre eigene Datei (Zähler 1/0), ein zweiter User dagegen (1/1), die Autorin wechselt (0/2, keine zweite Zeile), dieselbe Richtung noch einmal ändert nichts, zurücknehmen (0/1). Wird die Datei privat, bekommt der zweite User beim Lesen und beim Stimmen „gibt es nicht“. Nach der Meldung „endgültig gelöscht“ sind die Stimmen weg. Danach ist das Testdokument entfernt und die Tabelle leer.

Messung am selben Tag (vom Mac über das LAN gegen die Pi-DB, danach alles entfernt): eine Datei mit 5000 Stimmen „begeistert“ und 3000 „angewidert“. Der Stand der Stimmen nennt 15 und 15 User und beide Zahlen; ihn 24 Mal nacheinander zu lesen (eine Seite Bildkacheln) dauert 0,9 s, also 36 ms je Kachel, im Browser laufen die Anfragen nebeneinander. Eine Stimme abgeben samt Zählern im Solr-Dokument: 83 ms. Alle 8001 Stimmen der Datei löschen: 23 ms.
