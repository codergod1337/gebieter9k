# GuestbookComment

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Kommentar unter einem Gästebucheintrag. Die Kommentare eines Eintrags bilden einen Verlauf in der Reihenfolge `writtenAt`, wie Rückfrage und Rückantwort beim To-do-Job: der Besitzer des Gästebuchs und andere User im Wechsel. Nie geändert, nur gelöscht; mit ihm gehen seine Smileys. Lose gekoppelt, ohne JPA-Beziehung.

- **Tabelle:** `guestbook_comment`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/guestbook/model/GuestbookComment.java`](../../code/backend/src/main/java/de/gebiter/guestbook/model/GuestbookComment.java)
- **Frontend-Typ:** [`code/frontend/src/guestbook/Guestbook.ts`](../../code/frontend/src/guestbook/Guestbook.ts)
- **DTOs:** `GuestbookCommentDeleteRequest`, `GuestbookCommentForClient`, `NewGuestbookComment`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "guestbookId": 1,
  "authorUsersGuid": "77777777-7777-7777-7777-777777777777",
  "commentText": {
    "de": "Beispiel"
  },
  "writtenAt": "2026-11-09T14:05:27Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `guestbookId` | `Long` | Pflicht, unveränderlich | ja | id des Eintrags, unter dem der Kommentar steht. |
| `authorUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, der den Kommentar geschrieben hat. |
| `commentText` | `Map<String, String>` | Pflicht, jsonb, unveränderlich | ja | Der Kommentar als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML aus dem Rich-Text-Editor (Nutzer 2026-11-09; vorerst nur Deutsch). |
| `writtenAt` | `OffsetDateTime` | Pflicht, unveränderlich | ja | Wann der Kommentar geschrieben wurde. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| DELETE | `/api/admin/guestbook/comment` | [`GuestbookAdminController.deleteGuestbookComment`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookAdminController.java) | `GuestbookCommentDeleteRequest` |
| POST | `/api/guestbook-comment` | [`GuestbookCommentController.createOwnGuestbookComment`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookCommentController.java) | `GuestbookComment`, `NewGuestbookComment` |
| DELETE | `/api/guestbook-comment` | [`GuestbookCommentController.deleteOwnGuestbookComment`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookCommentController.java) | `GuestbookCommentDeleteRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookCommentController.java`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookCommentController.java): `createOwnGuestbookComment`
- [`code/backend/src/main/java/de/gebiter/guestbook/repository/GuestbookCommentRepository.java`](../../code/backend/src/main/java/de/gebiter/guestbook/repository/GuestbookCommentRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookCommentService.java`](../../code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookCommentService.java): `createGuestbookComment`, `getGuestbookComment`, `getGuestbookCommentByGuestbookIds`
- [`code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java`](../../code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java): `resolveGuestbookPage`, `createOwnGuestbookComment`, `deleteOwnGuestbookComment`, `createOwnGuestbookReaction`

## Verwendung im Frontend

- [`code/frontend/src/guestbook/GuestbookCommentItem.tsx`](../../code/frontend/src/guestbook/GuestbookCommentItem.tsx): (Typ)
- [`code/frontend/src/guestbook/useGuestbook.ts`](../../code/frontend/src/guestbook/useGuestbook.ts): `useGuestbook`, `resolveGuestbookPage`, `createOwnGuestbook`, `deleteOwnGuestbook`, `deleteGuestbook`, `createOwnGuestbookComment`
