# UsersAchievement

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein erreichtes Achievement eines Users (Nutzer 2026-11-09): wer, welches, wann. Ein wiederholbares Achievement steht je Abschluss einmal da. Wird nur angelegt, nie geändert.

- **Tabelle:** `users_achievement`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/achievement/model/UsersAchievement.java`](../../code/backend/src/main/java/de/gebiter/achievement/model/UsersAchievement.java)
- **DTOs:** `UsersAchievementSummary`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "achievementKey": "BEISPIEL_KEY",
  "achievedAt": "2026-11-09T14:05:27Z",
  "achievementTrackingId": 1
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, Spalte `users_guid`, unveränderlich | ja | Wessen Abschluss. |
| `achievementKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Welches Achievement, sein Key. |
| `achievedAt` | `Instant` | Pflicht, unveränderlich | ja | Wann erreicht: der Zeitpunkt der Protokollzeile, die es ausgelöst hat. |
| `achievementTrackingId` | `Long` | unveränderlich | ja | Die Zeile in `achievement_tracking`, die es ausgelöst hat, zum Nachvollziehen. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| GET | `/api/users-achievement` | [`UsersAchievementController.getOwnUsersAchievementSummaries`](../../code/backend/src/main/java/de/gebiter/achievement/controller/UsersAchievementController.java) | `UsersAchievementSummary` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/achievement/repository/UsersAchievementRepository.java`](../../code/backend/src/main/java/de/gebiter/achievement/repository/UsersAchievementRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/achievement/service/UsersAchievementService.java`](../../code/backend/src/main/java/de/gebiter/achievement/service/UsersAchievementService.java): `doCreateUsersAchievements`

## Verwendung im Frontend

- [`code/frontend/src/achievement/useUsersAchievement.ts`](../../code/frontend/src/achievement/useUsersAchievement.ts): `useUsersAchievement`, `getOwnUsersAchievementSummaries`
- [`code/frontend/src/profile/ProfileAchievementsBox.tsx`](../../code/frontend/src/profile/ProfileAchievementsBox.tsx): `ProfileAchievementsBox`, `renderHint`
