# AccessRole

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein einzelnes Recht, identifiziert über seinen eindeutigen `key` (keine id). Gebündelt werden Rechte in einer `AccessRoleCollection`, und genau eine Collection wird einem User zugewiesen. Einzeln zugewiesen wird ein Recht über `AccessRoleUsersAssignment`.

- **Tabelle:** `access_role`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/access/model/AccessRole.java`](../../code/backend/src/main/java/de/gebiter/access/model/AccessRole.java)
- **Frontend-Typ:** [`code/frontend/src/auth/access/AccessRole.ts`](../../code/frontend/src/auth/access/AccessRole.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "key": "BEISPIEL_KEY",
  "displayName": {
    "de": "Beispiel"
  },
  "listingPosition": 0
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `access_role_key`, unveränderlich | ja | Fester technischer Schlüssel des Rechts. Spaltenname mit Präfix, weil `key` in SQL ein Schlüsselwort ist. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename als JSON mit dem Sprachkürzel als Schlüssel, z. B. `{"de": "Admin"`}. Vorerst gibt es nur `de`, die Pflichtsprache steht in `gebiter.language.default-code`. |
| `listingPosition` | `int` | Pflicht | ja | Platz in der Anzeige, von oben nach unten ab 1. Neue kommen ans Ende, verschoben wird per Drag and Drop (`PUT …/listing-position`). Der Standard 0 gilt nur für Zeilen von vor dieser Spalte. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/access-role` | [`AccessRoleAdminController.createAccessRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleAdminController.java) | `AccessRole` |
| GET | `/api/admin/access-role/{accessRoleKey}` | [`AccessRoleAdminController.getAccessRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleAdminController.java) | `AccessRole` |
| PUT | `/api/admin/access-role` | [`AccessRoleAdminController.changeAccessRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleAdminController.java) | `AccessRole` |
| PUT | `/api/admin/access-role/listing-position` | [`AccessRoleAdminController.changeAccessRoleListingPositions`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleAdminController.java) | `AccessRole` |
| GET | `/api/access-role` | [`AccessRoleController.getAllAccessRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleController.java) | `AccessRole` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/Gebiter9kApplication.java`](../../code/backend/src/main/java/de/gebiter/Gebiter9kApplication.java): `grantEveryAccessRoleToAlmightyIfMissing`
- [`code/backend/src/main/java/de/gebiter/access/controller/AccessRoleAdminController.java`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleAdminController.java): `createAccessRole`, `getAccessRole`, `changeAccessRole`, `changeAccessRoleListingPositions`
- [`code/backend/src/main/java/de/gebiter/access/controller/AccessRoleController.java`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleController.java): `getAllAccessRole`
- [`code/backend/src/main/java/de/gebiter/access/repository/AccessRoleRepository.java`](../../code/backend/src/main/java/de/gebiter/access/repository/AccessRoleRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/access/service/AccessRoleService.java`](../../code/backend/src/main/java/de/gebiter/access/service/AccessRoleService.java): `createAccessRole`, `getAccessRole`, `getAllAccessRole`, `changeAccessRole`, `changeAccessRoleListingPositions`, `doCreateAccessRole`, `doGetAccessRole`, `doGetAllAccessRole`, `doChangeAccessRole`

## Verwendung im Frontend

- [`code/frontend/src/admin/accessrole/AccessRoleTab.tsx`](../../code/frontend/src/admin/accessrole/AccessRoleTab.tsx): `getAccessRoleKey`, `AccessRoleTab`, `saveAccessRoleOrder`, `handleCreateAccessRole`, `handleSaveDisplayName`, `renderDisplayNameCell`
- [`code/frontend/src/admin/arcar/AccessRoleCollectionAccessRoleMatrixTab.tsx`](../../code/frontend/src/admin/arcar/AccessRoleCollectionAccessRoleMatrixTab.tsx): `isGrantedInBackend`, `reloadServerAccessRoleCollectionRoles`, `saveAccessRoleCollectionRoleChanges`, `handleCellClick`, `handleCellPaint`, `isShownGranted`, `getCellClassName`, `getCellLabel`
- [`code/frontend/src/admin/fileclass/FileClassAccessRoleMatrixTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassAccessRoleMatrixTab.tsx): `getServerCellValue`, `reloadServerFileClassAccessRoles`, `saveFileClassAccessCell`, `saveFileClassAccessRoleChanges`, `handleCellClick`, `handleCellPaint`, `getShownCellValue`, `isShownMarked`, `getShownMarkText`, `getCellClassName`, `getCellLabel`
- [`code/frontend/src/admin/fileclass/FileClassTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassTab.tsx): `getAccessRolesWithAccessLevel`
- [`code/frontend/src/admin/users/EditUsersForm.tsx`](../../code/frontend/src/admin/users/EditUsersForm.tsx): (Typ)
- [`code/frontend/src/admin/users/UsersTab.tsx`](../../code/frontend/src/admin/users/UsersTab.tsx): `UsersTab`, `getAssignedAccessRoles`
- [`code/frontend/src/admin/users/UsersTableRow.tsx`](../../code/frontend/src/admin/users/UsersTableRow.tsx): (Typ)
- [`code/frontend/src/auth/access/AccessRoleBadge.tsx`](../../code/frontend/src/auth/access/AccessRoleBadge.tsx): (Typ)
- [`code/frontend/src/auth/access/AccessRoleCollectionBadge.tsx`](../../code/frontend/src/auth/access/AccessRoleCollectionBadge.tsx): `AccessRoleCollectionBadge`
- [`code/frontend/src/auth/access/AccessRolePicker.tsx`](../../code/frontend/src/auth/access/AccessRolePicker.tsx): `compareAccessRolesByListingPosition`, `matchesSearchText`, `AccessRolePicker`, `pickAccessRole`
- [`code/frontend/src/auth/access/AccessRolePickerPopup.tsx`](../../code/frontend/src/auth/access/AccessRolePickerPopup.tsx): `AccessRolePickerPopup`, `handleNoAccessRoleClick`, `handleAccessRolePick`
- [`code/frontend/src/auth/access/AccessRoleToggleList.tsx`](../../code/frontend/src/auth/access/AccessRoleToggleList.tsx): (Typ)
- [`code/frontend/src/auth/access/useAccessRole.ts`](../../code/frontend/src/auth/access/useAccessRole.ts): `useAccessRole`, `createAccessRole`, `getAccessRole`, `getAllAccessRole`, `changeAccessRole`, `changeAccessRoleListingPositions`
- [`code/frontend/src/home/HomeTileEntryAccessRolesHint.tsx`](../../code/frontend/src/home/HomeTileEntryAccessRolesHint.tsx): `HomeTileEntryAccessRolesHint`
- [`code/frontend/src/layout/OwnAccessRoleCollection.tsx`](../../code/frontend/src/layout/OwnAccessRoleCollection.tsx): `OwnAccessRoleCollection`, `findAccessRole`
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
- [`code/frontend/src/profile/ProfileOverview.tsx`](../../code/frontend/src/profile/ProfileOverview.tsx): `ProfileOverview`, `loadUsersDetail`
- [`code/frontend/src/profile/ProfileRightsBox.tsx`](../../code/frontend/src/profile/ProfileRightsBox.tsx): (Typ)
- [`code/frontend/src/solrmanager/SolrCoreFieldsTab.tsx`](../../code/frontend/src/solrmanager/SolrCoreFieldsTab.tsx): `SolrCoreFieldsTab`, `loadSolrFields`, `getShownSolrField`, `getShownSolrFields`, `saveSolrFieldOrder`, `findShownSolrField`, `getReaderAccessRole`, `putShownSolrField`, `markSolrFieldSaving`, `saveChangedSolrField`, `handleSwitchChange`, `handleClientValueAcceptedChange`, `openCellEditPopup`, `handleCloseCellEditPopup`, `handleSaveCell`
