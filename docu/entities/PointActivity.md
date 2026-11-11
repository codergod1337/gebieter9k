# PointActivity

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Tätigkeit, für die es Punkte gibt (Nutzer 2026-11-09), z. B. einen Gästebucheintrag schreiben. Der Admin pflegt, wie viele Punkte sie bringt; das gilt nie rückwirkend, denn jede Buchung schreibt den Betrag beim Buchen fest. Welche Tätigkeiten der Code auslöst, steht in `gebiter.point-activity.*`; der Start-Runner legt sie an, wenn sie fehlen.

- **Tabelle:** `point_activity`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/point/model/PointActivity.java`](../../code/backend/src/main/java/de/gebiter/point/model/PointActivity.java)
- **Frontend-Typ:** [`code/frontend/src/point/PointActivity.ts`](../../code/frontend/src/point/PointActivity.ts)

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
  "rewardPoints": 0,
  "listingPosition": 0
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `point_activity_key`, unveränderlich | ja | Fester technischer Schlüssel, Key-Regel, z. B. `GUESTBOOK_ENTRY_WRITTEN`. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename, z. B. `{"de": "Gästebucheintrag geschrieben"`}; so steht es im Kontoauszug. |
| `description` | `Map<String, String>` | jsonb | ja | Mehrsprachige Beschreibung: wann es die Punkte gibt; darf fehlen. |
| `rewardPoints` | `long` | Pflicht | ja | So viele Punkte bringt die Tätigkeit ab jetzt, ab 0 (0: keine). |
| `listingPosition` | `int` | Pflicht | ja | Platz in der Anzeige, ab 1, per Drag and Drop. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/point-activity` | [`PointActivityAdminController.createPointActivity`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityAdminController.java) | `PointActivity` |
| GET | `/api/admin/point-activity/{pointActivityKey}` | [`PointActivityAdminController.getPointActivity`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityAdminController.java) | `PointActivity` |
| GET | `/api/admin/point-activity` | [`PointActivityAdminController.getAllPointActivity`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityAdminController.java) | `PointActivity` |
| PUT | `/api/admin/point-activity` | [`PointActivityAdminController.changePointActivity`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityAdminController.java) | `PointActivity` |
| PUT | `/api/admin/point-activity/listing-position` | [`PointActivityAdminController.changePointActivityListingPositions`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityAdminController.java) | `PointActivity` |
| DELETE | `/api/admin/point-activity` | [`PointActivityAdminController.deletePointActivity`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityAdminController.java) | `PointActivity` |
| GET | `/api/point-activity` | [`PointActivityController.getAllPointActivity`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityController.java) | `PointActivity` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/point/controller/PointActivityAdminController.java`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityAdminController.java): `createPointActivity`, `getPointActivity`, `getAllPointActivity`, `changePointActivity`, `changePointActivityListingPositions`, `deletePointActivity`
- [`code/backend/src/main/java/de/gebiter/point/controller/PointActivityController.java`](../../code/backend/src/main/java/de/gebiter/point/controller/PointActivityController.java): `getAllPointActivity`
- [`code/backend/src/main/java/de/gebiter/point/repository/PointActivityRepository.java`](../../code/backend/src/main/java/de/gebiter/point/repository/PointActivityRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/point/service/PointActivityService.java`](../../code/backend/src/main/java/de/gebiter/point/service/PointActivityService.java): `createPointActivity`, `getPointActivity`, `getAllPointActivity`, `getPointActivityRewardPoints`, `changePointActivity`, `changePointActivityListingPositions`, `deletePointActivity`, `doGetPointActivity`

## Verwendung im Frontend

- [`code/frontend/src/achievementmanager/pointactivity/EditPointActivityTab.tsx`](../../code/frontend/src/achievementmanager/pointactivity/EditPointActivityTab.tsx): `EditPointActivityTab`, `loadPointActivity`, `handleSave`
- [`code/frontend/src/achievementmanager/pointactivity/NewPointActivityTab.tsx`](../../code/frontend/src/achievementmanager/pointactivity/NewPointActivityTab.tsx): `NewPointActivityTab`, `handleSave`
- [`code/frontend/src/achievementmanager/pointactivity/PointActivityForm.tsx`](../../code/frontend/src/achievementmanager/pointactivity/PointActivityForm.tsx): (Typ)
- [`code/frontend/src/achievementmanager/pointactivity/PointActivityTab.tsx`](../../code/frontend/src/achievementmanager/pointactivity/PointActivityTab.tsx): `getPointActivityKey`, `PointActivityTab`, `savePointActivityOrder`, `handleNewPointActivity`, `handleEdit`, `handleConfirmDelete`, `renderActions`
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
- [`code/frontend/src/point/usePointActivity.ts`](../../code/frontend/src/point/usePointActivity.ts): `usePointActivity`, `createPointActivity`, `getPointActivity`, `getAllPointActivity`, `changePointActivity`, `changePointActivityListingPositions`
