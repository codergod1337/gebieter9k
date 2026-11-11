# Rank

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Rang der Rangleiter, von Stufe 1 (Leibeigener) bis Stufe 50 (General des Schreckens). Ein Rang ist kein Recht und keine Position: Die AccessRoleCollections bilden die Zugänge ab, ein Rang ist nur Anzeige. Man erarbeitet ihn sich mit Punkten: Ein User hat den höchsten Rang, dessen `.minimumPoints` er erreicht. Das Badge hat sein Aussehen im `BadgeLook`: unten schlicht, oben immer edler.

- **Tabelle:** `rank`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/rank/model/Rank.java`](../../code/backend/src/main/java/de/gebiter/rank/model/Rank.java)
- **Frontend-Typ:** [`code/frontend/src/rank/Rank.ts`](../../code/frontend/src/rank/Rank.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "key": "BEISPIEL_KEY",
  "displayName": {
    "de": "Beispiel"
  },
  "level": 0,
  "minimumPoints": 0,
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
  }
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `rank_key`, unveränderlich | ja | Fester technischer Schlüssel, Key-Regel, z. B. `RAUBRITTER`. Spaltenname mit Präfix wie bei den Rechten. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename als JSON, z. B. `{"de": "Raubritter"`}. |
| `level` | `int` | Pflicht, eindeutig | ja | Die Stufe in der Leiter, ab 1, jede nur einmal vergeben. Je höher, desto weiter oben. Neue kommen oben drauf, verschoben wird per Drag and Drop (`PUT /api/admin/rank/level`). |
| `minimumPoints` | `long` | Pflicht | ja | So viele Punkte (`Users.points`) braucht man mindestens für diesen Rang, ab 0. |
| `badgeLook` | `BadgeLook` | eingebettet | ja | Das Aussehen des Rang-Badges, `null`: Standard aus `base.css`. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/rank` | [`RankAdminController.createRank`](../../code/backend/src/main/java/de/gebiter/rank/controller/RankAdminController.java) | `Rank` |
| GET | `/api/admin/rank/{rankKey}` | [`RankAdminController.getRank`](../../code/backend/src/main/java/de/gebiter/rank/controller/RankAdminController.java) | `Rank` |
| GET | `/api/admin/rank` | [`RankAdminController.getAllRank`](../../code/backend/src/main/java/de/gebiter/rank/controller/RankAdminController.java) | `Rank` |
| PUT | `/api/admin/rank` | [`RankAdminController.changeRank`](../../code/backend/src/main/java/de/gebiter/rank/controller/RankAdminController.java) | `Rank` |
| PUT | `/api/admin/rank/level` | [`RankAdminController.changeRankLevels`](../../code/backend/src/main/java/de/gebiter/rank/controller/RankAdminController.java) | `Rank` |
| DELETE | `/api/admin/rank` | [`RankAdminController.deleteRank`](../../code/backend/src/main/java/de/gebiter/rank/controller/RankAdminController.java) | `Rank` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/rank/controller/RankAdminController.java`](../../code/backend/src/main/java/de/gebiter/rank/controller/RankAdminController.java): `createRank`, `getRank`, `getAllRank`, `changeRank`, `changeRankLevels`, `deleteRank`
- [`code/backend/src/main/java/de/gebiter/rank/repository/RankRepository.java`](../../code/backend/src/main/java/de/gebiter/rank/repository/RankRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/rank/service/RankService.java`](../../code/backend/src/main/java/de/gebiter/rank/service/RankService.java): `createRank`, `getRank`, `getAllRank`, `changeRank`, `changeRankLevels`, `deleteRank`, `doGetRank`

## Verwendung im Frontend

- [`code/frontend/src/admin/rank/EditRankTab.tsx`](../../code/frontend/src/admin/rank/EditRankTab.tsx): `EditRankTab`, `loadRank`, `handleSave`
- [`code/frontend/src/admin/rank/NewRankTab.tsx`](../../code/frontend/src/admin/rank/NewRankTab.tsx): `NewRankTab`, `handleSave`
- [`code/frontend/src/admin/rank/RankForm.tsx`](../../code/frontend/src/admin/rank/RankForm.tsx): `RankForm`, `handleMinimumPointsChange`, `handleSave`
- [`code/frontend/src/admin/rank/RankTab.tsx`](../../code/frontend/src/admin/rank/RankTab.tsx): `getRankKey`, `RankTab`, `saveRankOrder`, `handleNewRank`, `handleEdit`, `handleConfirmDelete`
- [`code/frontend/src/rank/RankBadge.tsx`](../../code/frontend/src/rank/RankBadge.tsx): (Typ)
- [`code/frontend/src/rank/useRank.ts`](../../code/frontend/src/rank/useRank.ts): `useRank`, `createRank`, `getRank`, `getAllRank`, `changeRank`, `changeRankLevels`
