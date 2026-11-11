# AchievementTracking

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Zeile im universellen Protokoll für Achievements (Nutzer 2026-11-09): was ein User getan hat, mit dem Kontrollcounter danach. Jede neue Zeile ist der einzige Anlass, Achievements zu prüfen; geprüft wird der Sprung von `runningValue - amount` auf `runningValue`, ein Zählen über das Protokoll gibt es nie. Zeilen werden nie geändert.

- **Tabelle:** `achievement_tracking`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/achievement/model/AchievementTracking.java`](../../code/backend/src/main/java/de/gebiter/achievement/model/AchievementTracking.java)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "trackingKey": "ONLINE_PRESENCE",
  "amount": 0,
  "runningValue": 0,
  "occurredAt": "2026-11-09T14:05:27Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, Spalte `users_guid`, unveränderlich | ja | Wessen Zähler. |
| `trackingKey` | `AchievementTrackingKey` | Enum als Text, Pflicht, max. 50 Zeichen, Spalte `tracking_key`, unveränderlich | ja | Was gezählt wird. |
| `amount` | `long` | Pflicht, unveränderlich | ja | Was dieses Ereignis dazugibt, z. B. 902 Sekunden Online-Zeit; 0 beim Beginn einer neuen Serie. |
| `runningValue` | `long` | Pflicht, unveränderlich | ja | Der Kontrollcounter nach diesem Ereignis, z. B. Sekunden am Stück; daran misst sich jede Schwelle. |
| `occurredAt` | `Instant` | Pflicht, Spalte `occurred_at`, unveränderlich | ja | Wann, immer von der Uhr des Servers. |

## Endpunkte

Keine: Die Entity wird nur im Backend benutzt.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/achievement/repository/AchievementTrackingRepository.java`](../../code/backend/src/main/java/de/gebiter/achievement/repository/AchievementTrackingRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/achievement/service/AchievementTrackingService.java`](../../code/backend/src/main/java/de/gebiter/achievement/service/AchievementTrackingService.java): `doCreateOnlinePresenceTracking`, `doCreateOnlinePresenceSeriesStart`, `doGetOnlineSince`, `doRestoreOnlinePresenceOnce`
- [`code/backend/src/main/java/de/gebiter/achievement/service/UsersAchievementService.java`](../../code/backend/src/main/java/de/gebiter/achievement/service/UsersAchievementService.java): `createReachedUsersAchievements`, `doCountReachedCompletions`, `doCreateUsersAchievements`

## Verwendung im Frontend

Keine: Das Frontend kennt die Entity nicht.
