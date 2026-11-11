# UsersFriendRequest

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Freundschaftsantrag, die ganze Anfrage in einer Tabelle (Vorgabe des Nutzers 2026-11-09): wer fragt (`requesterUsersGuid`), wer annimmt oder ablehnt (`acceptorUsersGuid`), wann gefragt wurde und die Antwort. `accepted` ist `null`, solange der Antrag offen ist, danach ja oder nein. Nimmt der Empfänger an, entsteht die Freundschaft in beiden Freundeslisten (`UsersFriendship`). Lose gekoppelt, ohne JPA-Beziehung.

- **Tabelle:** `users_friend_request`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/UsersFriendRequest.java`](../../code/backend/src/main/java/de/gebiter/users/model/UsersFriendRequest.java)
- **Frontend-Typ:** [`code/frontend/src/users/UsersFriendRequest.ts`](../../code/frontend/src/users/UsersFriendRequest.ts)
- **DTOs:** `NewUsersFriendRequest`, `UsersFriendRequestAnswer`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "requesterUsersGuid": "77777777-7777-7777-7777-777777777777",
  "acceptorUsersGuid": "77777777-7777-7777-7777-777777777777",
  "requestedAt": "2026-11-09T14:05:27Z",
  "accepted": false
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `requesterUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, der fragt. |
| `acceptorUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, der annimmt oder ablehnt. |
| `requestedAt` | `Instant` | Pflicht, unveränderlich | ja | Wann gefragt wurde. |
| `accepted` | `Boolean` |  | ja | Die Antwort: `null` offen, `true` angenommen, `false` abgelehnt. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/users-friend-request` | [`UsersFriendRequestController.createOwnUsersFriendRequest`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersFriendRequestController.java) | `UsersFriendRequest`, `NewUsersFriendRequest` |
| GET | `/api/users-friend-request` | [`UsersFriendRequestController.getOwnOpenUsersFriendRequest`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersFriendRequestController.java) | `UsersFriendRequest` |
| PUT | `/api/users-friend-request` | [`UsersFriendRequestController.answerOwnUsersFriendRequest`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersFriendRequestController.java) | `UsersFriendRequest`, `UsersFriendRequestAnswer` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/users/controller/UsersFriendRequestController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersFriendRequestController.java): `createOwnUsersFriendRequest`, `getOwnOpenUsersFriendRequest`, `answerOwnUsersFriendRequest`
- [`code/backend/src/main/java/de/gebiter/users/repository/UsersFriendRequestRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersFriendRequestRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersFriendRequestService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersFriendRequestService.java): `createOwnUsersFriendRequest`, `getOwnOpenUsersFriendRequest`, `answerOwnUsersFriendRequest`

## Verwendung im Frontend

- [`code/frontend/src/users/useOwnFriends.ts`](../../code/frontend/src/users/useOwnFriends.ts): `useOwnFriends`, `reloadAll`, `getRelation`, `findReceivedRequest`
- [`code/frontend/src/users/useUsersFriendRequest.ts`](../../code/frontend/src/users/useUsersFriendRequest.ts): `useUsersFriendRequest`, `createOwnUsersFriendRequest`, `getOwnOpenUsersFriendRequest`, `answerOwnUsersFriendRequest`
