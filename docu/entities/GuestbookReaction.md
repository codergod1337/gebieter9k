# GuestbookReaction

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Smiley auf einen Gästebucheintrag oder einen seiner Kommentare (Vorgabe des Nutzers 2026-11-09): nur in eine Richtung, nicht zurücknehmbar. Ein User darf mehrere verschiedene Emojis an dasselbe Ziel hängen, dasselbe Emoji je Ziel nur einmal (prüft der Service). Gelöscht wird ein Smiley nur mit seinem Eintrag bzw. Kommentar. Lose gekoppelt, ohne JPA-Beziehung.

- **Tabelle:** `guestbook_reaction`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/guestbook/model/GuestbookReaction.java`](../../code/backend/src/main/java/de/gebiter/guestbook/model/GuestbookReaction.java)
- **DTOs:** `GuestbookReactionCount`, `NewGuestbookReaction`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "guestbookId": 1,
  "guestbookCommentId": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "reactionEmoji": "🔥",
  "reactedAt": "2026-11-09T14:05:27Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `guestbookId` | `Long` | Pflicht, unveränderlich | ja | id des Eintrags; auch bei einem Smiley auf einen Kommentar, damit eine Seite alle Smileys auf einmal lädt. |
| `guestbookCommentId` | `Long` | unveränderlich | ja | id des Kommentars, `null` bei einem Smiley auf den Eintrag selbst. |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, der reagiert hat. |
| `reactionEmoji` | `String` | Pflicht, max. 32 Zeichen, unveränderlich | ja | Das Emoji selbst, ein Standard-Emoji (geprüft über `Helper.requireSingleEmoji`). |
| `reactedAt` | `OffsetDateTime` | Pflicht, unveränderlich | ja | Wann der Smiley vergeben wurde. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/guestbook-reaction` | [`GuestbookReactionController.createOwnGuestbookReaction`](../../code/backend/src/main/java/de/gebiter/guestbook/controller/GuestbookReactionController.java) | `NewGuestbookReaction` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/guestbook/repository/GuestbookReactionRepository.java`](../../code/backend/src/main/java/de/gebiter/guestbook/repository/GuestbookReactionRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookReactionService.java`](../../code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookReactionService.java): `createGuestbookReaction`, `getGuestbookReactionByGuestbookIds`
- [`code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java`](../../code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java): `resolveGuestbookPage`, `countReactions`

## Verwendung im Frontend

- [`code/frontend/src/guestbook/GuestbookReactionBar.tsx`](../../code/frontend/src/guestbook/GuestbookReactionBar.tsx): (Typ)
