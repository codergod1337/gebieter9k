# AccessRoleCollection

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Position: eine Bündelung von `AccessRole`s, identifiziert über ihren eindeutigen `key` (keine id). Ein User hat höchstens eine Position (`Users.accessRoleCollectionKey`), dazu direkt zugewiesene Rechte. Welche Rechte eine Position verleiht, steht in `AccessRoleCollectionRole`. Der Rang ist etwas anderes (nur Anzeige). Das Badge ist eine Pille, ihr Aussehen steht im `BadgeLook`.

- **Tabelle:** `access_role_collection`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/access/model/AccessRoleCollection.java`](../../code/backend/src/main/java/de/gebiter/access/model/AccessRoleCollection.java)
- **Frontend-Typ:** [`code/frontend/src/auth/access/AccessRoleCollection.ts`](../../code/frontend/src/auth/access/AccessRoleCollection.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "key": "BEISPIEL_KEY",
  "displayName": {
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
  }
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `access_role_collection_key`, unveränderlich | ja | Fester technischer Schlüssel der Collection. Spaltenname mit Präfix, weil `key` in SQL ein Schlüsselwort ist. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename als JSON mit dem Sprachkürzel als Schlüssel, z. B. `{"de": "Admin"`}. Vorerst gibt es nur `de`, die Pflichtsprache steht in `gebiter.language.default-code`. |
| `listingPosition` | `int` | Pflicht | ja | Platz in der Anzeige, von oben nach unten ab 1. Neue kommen ans Ende, verschoben wird per Drag and Drop (`PUT …/listing-position`). Der Standard 0 gilt nur für Zeilen von vor dieser Spalte. |
| `badgeLook` | `BadgeLook` | eingebettet | ja | Das Aussehen der Pille, `null`: Standard aus `base.css`. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| GET | `/api/admin/access-role-collection/{accessRoleCollectionKey}` | [`AccessRoleCollectionAdminController.getAccessRoleCollection`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionAdminController.java) | `AccessRoleCollection` |
| PUT | `/api/admin/access-role-collection` | [`AccessRoleCollectionAdminController.changeAccessRoleCollection`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionAdminController.java) | `AccessRoleCollection` |
| PUT | `/api/admin/access-role-collection/listing-position` | [`AccessRoleCollectionAdminController.changeAccessRoleCollectionListingPositions`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionAdminController.java) | `AccessRoleCollection` |
| GET | `/api/access-role-collection` | [`AccessRoleCollectionController.getAllAccessRoleCollection`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionController.java) | `AccessRoleCollection` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionAdminController.java`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionAdminController.java): `getAccessRoleCollection`, `changeAccessRoleCollection`, `changeAccessRoleCollectionListingPositions`
- [`code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionController.java`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionController.java): `getAllAccessRoleCollection`
- [`code/backend/src/main/java/de/gebiter/access/repository/AccessRoleCollectionRepository.java`](../../code/backend/src/main/java/de/gebiter/access/repository/AccessRoleCollectionRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/access/service/AccessRoleCollectionService.java`](../../code/backend/src/main/java/de/gebiter/access/service/AccessRoleCollectionService.java): `createAccessRoleCollection`, `getAccessRoleCollection`, `getAllAccessRoleCollection`, `changeAccessRoleCollection`, `changeAccessRoleCollectionListingPositions`, `doCreateAccessRoleCollection`, `doGetAccessRoleCollection`, `doGetAllAccessRoleCollection`
- [`code/backend/src/main/java/de/gebiter/users/model/Users.java`](../../code/backend/src/main/java/de/gebiter/users/model/Users.java): (Import, Felder)

## Verwendung im Frontend

- [`code/frontend/src/admin/accessrolecollection/AccessRoleCollectionForm.tsx`](../../code/frontend/src/admin/accessrolecollection/AccessRoleCollectionForm.tsx): `AccessRoleCollectionForm`, `handleSave`
- [`code/frontend/src/admin/accessrolecollection/AccessRoleCollectionTab.tsx`](../../code/frontend/src/admin/accessrolecollection/AccessRoleCollectionTab.tsx): `getAccessRoleCollectionKey`, `AccessRoleCollectionTab`, `saveAccessRoleCollectionOrder`, `handleEdit`
- [`code/frontend/src/admin/accessrolecollection/EditAccessRoleCollectionTab.tsx`](../../code/frontend/src/admin/accessrolecollection/EditAccessRoleCollectionTab.tsx): `EditAccessRoleCollectionTab`, `loadAccessRoleCollection`, `handleSave`
- [`code/frontend/src/admin/arcar/AccessRoleCollectionAccessRoleMatrixTab.tsx`](../../code/frontend/src/admin/arcar/AccessRoleCollectionAccessRoleMatrixTab.tsx): `getAccessRoleCollectionKey`, `isGrantedInBackend`, `reloadServerAccessRoleCollectionRoles`, `saveAccessRoleCollectionRoleChanges`, `handleCellClick`, `handleCellPaint`, `isShownGranted`, `getCellClassName`, `getCellLabel`
- [`code/frontend/src/admin/userarc/UsersArcMatrixTab.tsx`](../../code/frontend/src/admin/userarc/UsersArcMatrixTab.tsx): `UsersArcMatrixTab`, `getShownUsers`, `handleCellClick`, `isMarked`, `getCellLabel`, `renderRowHeader`
- [`code/frontend/src/admin/users/UsersTab.tsx`](../../code/frontend/src/admin/users/UsersTab.tsx): `UsersTab`, `getAssignedAccessRoles`, `getAccessRoleCollection`
- [`code/frontend/src/admin/users/UsersTableRow.tsx`](../../code/frontend/src/admin/users/UsersTableRow.tsx): (Typ)
- [`code/frontend/src/auth/access/AccessRoleCollectionBadge.tsx`](../../code/frontend/src/auth/access/AccessRoleCollectionBadge.tsx): (Typ)
- [`code/frontend/src/auth/access/useAccessRoleCollection.ts`](../../code/frontend/src/auth/access/useAccessRoleCollection.ts): `useAccessRoleCollection`, `getAccessRoleCollection`, `changeAccessRoleCollection`, `changeAccessRoleCollectionListingPositions`
- [`code/frontend/src/components/Matrix.tsx`](../../code/frontend/src/components/Matrix.tsx): (Typ)
- [`code/frontend/src/layout/OwnAccessRoleCollection.tsx`](../../code/frontend/src/layout/OwnAccessRoleCollection.tsx): `OwnAccessRoleCollection`
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
- [`code/frontend/src/profile/OtherUsersProfileOverview.tsx`](../../code/frontend/src/profile/OtherUsersProfileOverview.tsx): `OtherUsersProfileOverview`, `loadUsersForClient`, `loadUsersDetail`, `loadVisibleContacts`, `loadUsersOnlineStatus`
- [`code/frontend/src/profile/ProfileAccountBox.tsx`](../../code/frontend/src/profile/ProfileAccountBox.tsx): (Typ)
- [`code/frontend/src/profile/ProfileHero.tsx`](../../code/frontend/src/profile/ProfileHero.tsx): (Typ)
- [`code/frontend/src/profile/ProfileOverview.tsx`](../../code/frontend/src/profile/ProfileOverview.tsx): `ProfileOverview`, `loadUsersDetail`
- [`code/frontend/src/users/Users.ts`](../../code/frontend/src/users/Users.ts): (Typ)
