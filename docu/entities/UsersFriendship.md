# UsersFriendship

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Eintrag in der Freundesliste eines Users: `usersGuid` hat `friendUsersGuid` als Freund. Freundschaft ist beidseitig (Vorgabe des Nutzers 2026-11-09): Jede Freundschaft steht zweimal da, einmal je Richtung. Das ist doppelt, aber jeder User bekommt seine ganze Liste mit einer Abfrage nach seiner GUID. Kündigen löscht beide Zeilen. Je User und Freund nur einmal. Wer die Liste sehen darf, steht in `Users.getFriendListVisibility()`. Lose gekoppelt, ohne JPA-Beziehung.

- **Tabelle:** `users_friendship`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/UsersFriendship.java`](../../code/backend/src/main/java/de/gebiter/users/model/UsersFriendship.java)
- **DTOs:** `UsersFriendshipDeleteRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "friendUsersGuid": "77777777-7777-7777-7777-777777777777"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, dem die Liste gehört. |
| `friendUsersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Freundes. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| GET | `/api/users-friendship` | [`UsersFriendshipController.getOwnFriendUsersGuids`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersFriendshipController.java) | (eigener Controller) |
| DELETE | `/api/users-friendship` | [`UsersFriendshipController.deleteOwnUsersFriendship`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersFriendshipController.java) | `UsersFriendshipDeleteRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/users/repository/UsersFriendshipRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersFriendshipRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersFriendshipService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersFriendshipService.java): `doCreateUsersFriendshipEntry`, `doLoadFriendUsersGuidsIntoMemory`

## Verwendung im Frontend

Keine: Das Frontend kennt die Entity nicht.
