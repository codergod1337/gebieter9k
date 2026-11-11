# Guestbook

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Eintrag im Gästebuch eines Users: wer ihn wo geschrieben hat und was. Einträge werden nie geändert, nur gelöscht (Vorgabe des Nutzers 2026-11-09); mit ihnen gehen ihre Kommentare und Smileys.

- **Tabelle:** `guestbook`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/guestbook/model/Guestbook.java`](../../code/backend/src/main/java/de/gebiter/guestbook/model/Guestbook.java)
- **Frontend-Typ:** [`code/frontend/src/guestbook/Guestbook.ts`](../../code/frontend/src/guestbook/Guestbook.ts)
- **DTOs:** `GuestbookAuthor`, `GuestbookDeleteRequest`, `GuestbookEntryForClient`, `GuestbookPage`, `GuestbookResolveRequest`, `NewGuestbook`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "profileUsersGuid": "77777777-7777-7777-7777-777777777777",
  "authorUsersGuid": "77777777-7777-7777-7777-777777777777",
  "entryText": {
    "de": "Beispiel"
  },
  "writtenAt": "2026-11-09T14:05:27Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `profileUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, in dessen Gästebuch der Eintrag steht. |
| `authorUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, der den Eintrag geschrieben hat. |
| `entryText` | `Map<String, String>` | Pflicht, jsonb | ja | Der Eintrag als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML aus dem Rich-Text-Editor, z. B. `{"de": " |
| `writtenAt` | `OffsetDateTime` | Pflicht, unveränderlich | ja | Wann der Eintrag geschrieben wurde. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| DELETE | `/api/admin/guestbook` | [`GuestbookAdminController.deleteGuestbook`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookAdminController.java) | `GuestbookDeleteRequest` |
| DELETE | `/api/admin/guestbook/comment` | [`GuestbookAdminController.deleteGuestbookComment`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookAdminController.java) | (eigener Controller) |
| POST | `/api/guestbook` | [`GuestbookController.createOwnGuestbook`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookController.java) | `Guestbook`, `NewGuestbook` |
| POST | `/api/guestbook/resolve` | [`GuestbookController.resolveGuestbookPage`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookController.java) | `GuestbookPage`, `GuestbookResolveRequest` |
| DELETE | `/api/guestbook` | [`GuestbookController.deleteOwnGuestbook`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookController.java) | `GuestbookDeleteRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookController.java`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookController.java): `createOwnGuestbook`
- [`code/backend/src/main/java/de/gebiter/guestbook/repository/GuestbookRepository.java`](../../code/backend/src/main/java/de/gebiter/guestbook/repository/GuestbookRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java`](../../code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java): `createOwnGuestbook`, `resolveGuestbookPage`, `deleteOwnGuestbook`, `deleteGuestbook`, `createOwnGuestbookComment`, `deleteOwnGuestbookComment`, `createOwnGuestbookReaction`, `doGetGuestbook`, `doGetVisibleGuestbook`, `doDeleteGuestbook`

## Verwendung im Frontend

- [`code/frontend/src/guestbook/GuestbookCommentItem.tsx`](../../code/frontend/src/guestbook/GuestbookCommentItem.tsx): (Typ)
- [`code/frontend/src/guestbook/GuestbookCommentThread.tsx`](../../code/frontend/src/guestbook/GuestbookCommentThread.tsx): (Typ)
- [`code/frontend/src/guestbook/GuestbookEntryCard.tsx`](../../code/frontend/src/guestbook/GuestbookEntryCard.tsx): (Typ)
- [`code/frontend/src/guestbook/GuestbookHead.tsx`](../../code/frontend/src/guestbook/GuestbookHead.tsx): (Typ)
- [`code/frontend/src/guestbook/GuestbookReactionBar.tsx`](../../code/frontend/src/guestbook/GuestbookReactionBar.tsx): (Typ)
- [`code/frontend/src/guestbook/useGuestbook.ts`](../../code/frontend/src/guestbook/useGuestbook.ts): `useGuestbook`, `resolveGuestbookPage`, `createOwnGuestbook`
