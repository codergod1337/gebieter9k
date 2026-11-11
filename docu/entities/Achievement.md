# Achievement

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Achievement, ähnlich wie bei Steam: ein Abzeichen, das man sich freischaltet, z. B. „Knipsgott“ für 1000 hochgeladene Bilder, und das man später im Profilbanner zeigt. Unabhängig von Rang und Position. Das Badge ist ein Medaillon, sein Aussehen steht im `BadgeLook`: Gewöhnliche sehen schlicht aus, seltene richtig nach Bling-Bling.

- **Tabelle:** `achievement`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/achievement/model/Achievement.java`](../../code/backend/src/main/java/de/gebiter/achievement/model/Achievement.java)
- **Frontend-Typ:** [`code/frontend/src/achievement/Achievement.ts`](../../code/frontend/src/achievement/Achievement.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "key": "BEISPIEL_KEY",
  "displayName": {
    "de": "Beispiel"
  },
  "description": {
    "de": "Beispiel"
  },
  "listingPosition": 0,
  "badgeLook": {
    "gradient": "Beispieltext",
    "structure": "Beispieltext",
    "effects": [
      "Beispieltext"
    ],
    "symbolPack": "Beispieltext",
    "symbolName": "Beispielname",
    "gradientStartColor": "#e9ff3b",
    "gradientEndColor": "#e9ff3b",
    "textColor": "#e9ff3b",
    "textShadowColor": "#e9ff3b",
    "borderColor": "#e9ff3b",
    "shadowColor": "#e9ff3b",
    "structureColor": "#e9ff3b"
  },
  "trackingKey": "ONLINE_PRESENCE",
  "thresholdValue": 0,
  "repeatable": false,
  "rewardPoints": 0
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `achievement_key`, unveränderlich | ja | Fester technischer Schlüssel, Key-Regel, z. B. `KNIPSGOTT`. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename als JSON, z. B. `{"de": "Knipsgott"`}. |
| `description` | `Map<String, String>` | jsonb | ja | Mehrsprachig wie der Name: wofür es das Achievement gibt, z. B. `{"de": "1000 Bilder hochgeladen."`}. |
| `listingPosition` | `int` | Pflicht | ja | Platz in der Anzeige, von oben nach unten ab 1. Neue kommen ans Ende, verschoben wird per Drag and Drop. |
| `badgeLook` | `BadgeLook` | eingebettet | ja | Das Aussehen des Medaillons, `null`: Standard aus `base.css`. |
| `trackingKey` | `AchievementTrackingKey` | Enum als Text, max. 50 Zeichen | ja | Woran es hängt (Nutzer 2026-11-09): die Art im Protokoll `achievement_tracking`, deren Kontrollcounter bei jeder neuen Zeile gegen `.thresholdValue` geprüft wird. `null`: wird nur von Hand vergeben. |
| `thresholdValue` | `Long` |  | ja | Ab diesem Stand des Kontrollcounters ist es erreicht, z. B. 3600 (Sekunden) für eine Stunde online. |
| `repeatable` | `boolean` | Pflicht | ja | Wiederholbar: jedes weitere Vielfache der Schwelle ist ein weiterer Abschluss; sonst genau einmal. |
| `rewardPoints` | `long` | Pflicht | ja | So viele Punkte kommen je Abschluss aufs Punktekonto (`Users.points`), ab 0. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/achievement` | [`AchievementAdminController.createAchievement`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementAdminController.java) | `Achievement` |
| GET | `/api/admin/achievement/{achievementKey}` | [`AchievementAdminController.getAchievement`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementAdminController.java) | `Achievement` |
| GET | `/api/admin/achievement` | [`AchievementAdminController.getAllAchievement`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementAdminController.java) | `Achievement` |
| PUT | `/api/admin/achievement` | [`AchievementAdminController.changeAchievement`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementAdminController.java) | `Achievement` |
| PUT | `/api/admin/achievement/listing-position` | [`AchievementAdminController.changeAchievementListingPositions`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementAdminController.java) | `Achievement` |
| DELETE | `/api/admin/achievement` | [`AchievementAdminController.deleteAchievement`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementAdminController.java) | `Achievement` |
| GET | `/api/achievement` | [`AchievementController.getAllAchievement`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementController.java) | `Achievement` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/achievement/controller/AchievementAdminController.java`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementAdminController.java): `createAchievement`, `getAchievement`, `getAllAchievement`, `changeAchievement`, `changeAchievementListingPositions`, `deleteAchievement`
- [`code/backend/src/main/java/de/gebiter/achievement/controller/AchievementController.java`](../../code/backend/src/main/java/de/gebiter/achievement/controller/AchievementController.java): `getAllAchievement`
- [`code/backend/src/main/java/de/gebiter/achievement/repository/AchievementRepository.java`](../../code/backend/src/main/java/de/gebiter/achievement/repository/AchievementRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/achievement/service/AchievementService.java`](../../code/backend/src/main/java/de/gebiter/achievement/service/AchievementService.java): `createAchievement`, `getAchievement`, `getAllAchievement`, `changeAchievement`, `changeAchievementListingPositions`, `deleteAchievement`, `getTrackedAchievements`, `requireValidTracking`, `doLoadTrackedAchievements`, `doGetAchievement`
- [`code/backend/src/main/java/de/gebiter/achievement/service/UsersAchievementService.java`](../../code/backend/src/main/java/de/gebiter/achievement/service/UsersAchievementService.java): `createReachedUsersAchievements`, `doCountReachedCompletions`, `doCreateUsersAchievements`

## Verwendung im Frontend

- [`code/frontend/src/achievement/AchievementBadge.tsx`](../../code/frontend/src/achievement/AchievementBadge.tsx): (Typ)
- [`code/frontend/src/achievement/UsersAchievementSummary.ts`](../../code/frontend/src/achievement/UsersAchievementSummary.ts): (Typ)
- [`code/frontend/src/achievement/useAchievement.ts`](../../code/frontend/src/achievement/useAchievement.ts): `useAchievement`, `createAchievement`, `getAchievement`, `getAllAchievement`, `changeAchievement`, `changeAchievementListingPositions`
- [`code/frontend/src/achievement/useUsersAchievement.ts`](../../code/frontend/src/achievement/useUsersAchievement.ts): `useUsersAchievement`
- [`code/frontend/src/achievementmanager/achievement/AchievementForm.tsx`](../../code/frontend/src/achievementmanager/achievement/AchievementForm.tsx): `AchievementForm`, `handleTrackingKeyChange`, `parseWholeNumberOrNull`, `createEnteredAchievement`
- [`code/frontend/src/achievementmanager/achievement/AchievementTab.tsx`](../../code/frontend/src/achievementmanager/achievement/AchievementTab.tsx): `getAchievementKey`, `describeAchievementCondition`, `AchievementTab`, `saveAchievementOrder`, `handleNewAchievement`, `handleEdit`, `handleConfirmDelete`, `renderActions`
- [`code/frontend/src/achievementmanager/achievement/EditAchievementTab.tsx`](../../code/frontend/src/achievementmanager/achievement/EditAchievementTab.tsx): `EditAchievementTab`, `loadAchievement`, `handleSave`, `handleCancel`
- [`code/frontend/src/achievementmanager/achievement/NewAchievementTab.tsx`](../../code/frontend/src/achievementmanager/achievement/NewAchievementTab.tsx): `NewAchievementTab`, `handleSave`, `handleCancel`
- [`code/frontend/src/achievementmanager/achievement/achievementPaths.ts`](../../code/frontend/src/achievementmanager/achievement/achievementPaths.ts): (Typ)
- [`code/frontend/src/admin/fileclass/FileClassForm.tsx`](../../code/frontend/src/admin/fileclass/FileClassForm.tsx): (Typ)
- [`code/frontend/src/badge/BadgeLook.ts`](../../code/frontend/src/badge/BadgeLook.ts): (Typ)
- [`code/frontend/src/badge/LookBadge.tsx`](../../code/frontend/src/badge/LookBadge.tsx): (Typ)
- [`code/frontend/src/components/KeyDisplayNameForm.tsx`](../../code/frontend/src/components/KeyDisplayNameForm.tsx): (Typ)
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
- [`code/frontend/src/profile/ProfileAchievementsBox.tsx`](../../code/frontend/src/profile/ProfileAchievementsBox.tsx): `ProfileAchievementsBox`, `renderHint`
- [`code/frontend/src/profile/ProfilePointsBox.tsx`](../../code/frontend/src/profile/ProfilePointsBox.tsx): `ProfilePointsBox`, `loadPage`
- [`code/frontend/src/users/UsersPointBooking.ts`](../../code/frontend/src/users/UsersPointBooking.ts): (Typ)
