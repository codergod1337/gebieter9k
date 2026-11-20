# FileComment

> Von Hand im Format von `docu/tools/generate_entity_docs.py` geschrieben (2026-11-20), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Ein Kommentar eines Users zu einer Datei, z. B. zu einem Bild einer Galerie (Nutzer 2026-11-20: „Die Kommentare möchte ich auch noch drin haben […] so eine Sprechblase neben die Smileys“). Die Kommentare einer Datei bilden einen Verlauf, die ältesten zuerst. Nie geändert, nur gelöscht. Lose gekoppelt, ohne JPA-Beziehung: Die Datei ist ein Solr-Dokument, der Autor nur seine GUID.

- **Tabelle:** `file_comment`, Index `ix_file_comment_file_document_id`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/file/model/FileComment.java`](../../code/backend/src/main/java/de/gebiter/file/model/FileComment.java)
- **Frontend-Typ:** [`code/frontend/src/file/FileComment.ts`](../../code/frontend/src/file/FileComment.ts) (`FileCommentForClient`, `FileCommentThread`, `FileCommentCount`)
- **DTOs:** `FileCommentCount`, `FileCommentDeleteRequest`, `FileCommentForClient`, `FileCommentThread`, `NewFileComment`; Meldung `FileDocumentFinallyDeletedEvent`

## Regeln (Nutzer 2026-11-20)

- Kommentieren und die Kommentare lesen darf, wer die Datei lesen darf, auch ihr Autor. Eine Datei, die er nicht lesen darf, sieht aus wie „gibt es nicht“ (404).
- Löschen darf den Kommentar sein Autor und der Autor der Datei (403 für alle anderen). Einen Admin-Endpunkt gibt es noch nicht.
- **Kein Einfluss auf Suchen und Auflösen** (wie die Stimmen, Entscheidung 15 im Konzept der Freigabe: „in der Kachelansicht asynchron nachladen“): Die Kacheln kommen sofort aus Solr. Erst danach lädt jede Kachel die Zahl ihrer Kommentare selbst nach (`GET /api/file-comment/count/{fileDocumentId}`), den Verlauf erst, wer ihn öffnet (`GET /api/file-comment/{fileDocumentId}`).
- **Wo sie stehen:** an der Bildkachel die Sprechblase mit der Zahl neben den beiden Smileys (ein Klick öffnet das Bild groß); am großen Bild der Verlauf rechts daneben, auf einem schmalen Bildschirm darunter; auf der Seite der Datei unter der Beschreibung.
- **Besucher über den Link einer Galerie-Freigabe** lesen mit, schreiben nicht (Entscheidung 9 im Konzept der Freigabe). Die Zahl je Bild kommt mit der Seite der Freigabe (`SharedGalleryForClient.commentCountsByFileDocumentId`, eine Abfrage für die ganze Seite), der Verlauf über `GET /api/share/token/{shareToken}/comment/{fileDocumentId}`. Unter dem Verlauf steht für Besucher ohne Anmeldung „Zum Kommentieren anmelden“.
- **Die Autoren kommen mit dem Verlauf** (`authors`, je Autor einmal ein `UsersAvatarForClient`, nach der Sichtbarkeit seines Profils: privat „Anonym“). So sieht sie auch ein Besucher, der selbst nichts nachfragen kann.
- Der Text ist mehrsprachiger Rich-Text wie im Gästebuch (bereinigt vom `RichTextService`), höchstens `gebiter.file.comment-text-max-length` (2000) Zeichen sichtbarer Text.
- Wird eine Datei endgültig gelöscht, gehen ihre Kommentare mit (`FileDocumentFinallyDeletedEvent`). Beim weichen Löschen bleiben sie.
- **Erstes Stück:** nur Kommentare. Keine Antworten auf Kommentare, keine Smileys an Kommentaren, keine Punkte fürs Kommentieren.

Beispiel: Jochen öffnet in Alices Galerie „Tansania 2026“ das Bild `#strand`, schreibt „Wahnsinn!“ und schließt das Bild. Die Sprechblase an der Kachel zeigt 1. Alice (Autorin des Bildes) darf den Kommentar löschen, Jochen auch, Bob nicht.

## Beispiel-JSON

Die Entity selbst geht nie zum Client. Was der Client bekommt, ist der Verlauf (`FileCommentThread`); die Werte sind erfunden.

```json
{
  "fileDocumentId": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "comments": [
    {
      "id": 12,
      "authorUsersGuid": "11111111-2222-3333-4444-555555555555",
      "commentText": { "de": "<p>Wahnsinn!</p>" },
      "writtenAt": "2026-11-20T19:02:11Z",
      "deletableByCurrentUsers": true
    }
  ],
  "authors": [
    {
      "usersGuid": "11111111-2222-3333-4444-555555555555",
      "anonymous": false,
      "username": "jochen",
      "profileImageSmallBase64Png": null,
      "avatarTextColor": null,
      "avatarBackgroundColor": null
    }
  ]
}
```

Die Zahl für die Sprechblase (`FileCommentCount`): `{"fileDocumentId": "9f86…0a08", "commentCount": 3}`.

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `fileDocumentId` | `String` | Pflicht, max. 64 Zeichen, unveränderlich | ja | id der Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. |
| `authorUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, der den Kommentar geschrieben hat. |
| `commentText` | `Map<String, String>` | Pflicht, `jsonb`, unveränderlich | ja | Der Kommentar als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML. |
| `writtenAt` | `OffsetDateTime` | Pflicht, unveränderlich, automatisch | ja | Wann der Kommentar geschrieben wurde. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/file-comment` | [`FileCommentController.createOwnFileComment`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCommentController.java) | `NewFileComment`, `FileCommentThread` |
| GET | `/api/file-comment/{fileDocumentId}` | [`FileCommentController.getFileCommentThread`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCommentController.java) | `FileCommentThread` |
| GET | `/api/file-comment/count/{fileDocumentId}` | [`FileCommentController.getFileCommentCount`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCommentController.java) | `FileCommentCount` |
| DELETE | `/api/file-comment` | [`FileCommentController.deleteOwnFileComment`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCommentController.java) | `FileCommentDeleteRequest`, `FileCommentThread` |
| GET | `/api/share/token/{shareToken}/comment/{fileDocumentId}` | [`GalleryShareShareController.getSharedFileCommentThread`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `FileCommentThread` |
| GET, POST | `/api/share/token/{shareToken}`, `…/resolve` | [`GalleryShareShareController`](../../code/backend/src/main/java/de/gebiter/gallery/controller/GalleryShareShareController.java) | `SharedGalleryForClient` mit `commentCountsByFileDocumentId` |

Die ersten vier für jeden angemeldeten User (Pfad `/api/**`); Schreiben und Löschen antworten mit dem Verlauf danach. Die Adressen unter `/api/share/token/` gehen ohne Anmeldung (Besucher mit dem Link einer Freigabe), nur lesend; sie zählen nicht als Aufruf der Freigabe.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/repository/FileCommentRepository.java`](../../code/backend/src/main/java/de/gebiter/file/repository/FileCommentRepository.java): `findByFileDocumentIdOrderByWrittenAtAscIdAsc`, `countByFileDocumentId`, `countByFileDocumentIds` (eine Abfrage für mehrere Dateien), `deleteAllByFileDocumentId`
- [`code/backend/src/main/java/de/gebiter/file/service/FileCommentService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileCommentService.java): `createOwnFileComment`, `getFileCommentThread`, `getFileCommentCount`, `getFileCommentThreadForGalleryShare`, `resolveFileCommentCountsForGalleryShare`, `deleteOwnFileComment`, `deleteFileCommentsOfFinallyDeletedFileDocument`, `requireReadableFileDocumentBackendFacts`, `doGetFileCommentThread`, `isDeletableBy`
- [`code/backend/src/main/java/de/gebiter/file/controller/FileCommentController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileCommentController.java): `createOwnFileComment`, `getFileCommentThread`, `getFileCommentCount`, `deleteOwnFileComment`
- [`code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareVisitorService.java`](../../code/backend/src/main/java/de/gebiter/gallery/service/GalleryShareVisitorService.java): `resolveSharedGallery` (Zahl der Kommentare je Bild der Seite), `getSharedFileCommentThread`
- [`code/backend/src/main/java/de/gebiter/users/service/UsersService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersService.java): `getUsersAvatarForClient` (die Autoren)
- Einstellung: `gebiter.file.comment-text-max-length` (2000) in [`application.yaml`](../../code/backend/src/main/resources/application.yaml), gelesen von `FileConfig.commentTextMaxLength`

## Verwendung im Frontend

- [`code/frontend/src/file/useFileComment.ts`](../../code/frontend/src/file/useFileComment.ts): `useFileComment`, `createOwnFileComment`, `getFileCommentThread`, `getFileCommentCount`, `deleteOwnFileComment`
- [`code/frontend/src/gallery/useGalleryShare.ts`](../../code/frontend/src/gallery/useGalleryShare.ts): `getSharedFileCommentThread` (Besucher)
- [`code/frontend/src/file/comment/FileCommentBubble.tsx`](../../code/frontend/src/file/comment/FileCommentBubble.tsx): `FileCommentBubble`; die Sprechblase mit der Zahl, lädt sie selbst nach oder nimmt sie vom Aufrufer
- [`code/frontend/src/file/comment/FileCommentSection.tsx`](../../code/frontend/src/file/comment/FileCommentSection.tsx): `FileCommentSection`, `findAuthor`, `applyChangedThread`, `writeComment`, `deleteComment`; der Verlauf mit dem Feld zum Schreiben, für Besucher nur zum Lesen
- [`code/frontend/src/file/comment/fileCommentTexts.ts`](../../code/frontend/src/file/comment/fileCommentTexts.ts): alle Texte, mehrsprachig angelegt
- Globale Bausteine, dieselben wie im Gästebuch: [`CommentItem.tsx`](../../code/frontend/src/components/CommentItem.tsx), [`AuthorHead.tsx`](../../code/frontend/src/components/AuthorHead.tsx), [`RichTextForm.tsx`](../../code/frontend/src/components/RichTextForm.tsx), [`ConfirmDeleteButton.tsx`](../../code/frontend/src/components/ConfirmDeleteButton.tsx)
- [`code/frontend/src/gallery/GalleryImageTile.tsx`](../../code/frontend/src/gallery/GalleryImageTile.tsx): zeigt die `FileCommentBubble` neben der `FileCheerBar`
- [`code/frontend/src/gallery/GalleryImageViewerPopup.tsx`](../../code/frontend/src/gallery/GalleryImageViewerPopup.tsx): zeigt die `FileCommentSection` neben dem großen Bild
- [`code/frontend/src/gallery/GalleryPage.tsx`](../../code/frontend/src/gallery/GalleryPage.tsx): `rememberCommentCount` (die Kachel zeigt nach dem Kommentieren gleich die neue Zahl)
- [`code/frontend/src/gallery/GalleryShareVisitorPage.tsx`](../../code/frontend/src/gallery/GalleryShareVisitorPage.tsx): Sprechblase mit der Zahl aus der Seite, Verlauf nur zum Lesen (`loadSharedFileCommentThread`)
- [`code/frontend/src/file/document/FileDocumentDetailPage.tsx`](../../code/frontend/src/file/document/FileDocumentDetailPage.tsx): zeigt die `FileCommentSection` unter der Beschreibung
- Aussehen: `.file-comment-button`, `.file-comment-count` (Pille wie die Smileys), `.file-comments`, `.file-comments-title`, `.comment-thread`, `.comment-item*`, `.author-head*`, `.rich-text-form`, am großen Bild `.gallery-viewer-picture` und `.gallery-viewer-comments` in [`base.css`](../../code/frontend/src/styles/base.css), Farben in [`default.css`](../../code/frontend/public/themes/default.css)

## Getestet (2026-11-20)

Nur lokal: Backend kompiliert, Frontend baut mit Typprüfung, und ein Wegwerf-Test (wieder gelöscht) hat die JPA-Schicht ohne Datenbankverbindung aufgebaut (Entities und alle Abfragen der Repositories). Nicht getestet: gegen die Pi-DB und den Solr und in der Oberfläche.
