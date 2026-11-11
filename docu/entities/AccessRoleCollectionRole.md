# AccessRoleCollectionRole

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Welche `AccessRole` zu welcher `AccessRoleCollection` gehört: Ein Eintrag ist ein Recht in einer Collection, verknüpft über die Keys. Je Collection ist jedes Recht höchstens einmal enthalten. Lose gekoppelt, ohne JPA-Beziehung.

- **Tabelle:** `access_role_collection_role`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/access/model/AccessRoleCollectionRole.java`](../../code/backend/src/main/java/de/gebiter/access/model/AccessRoleCollectionRole.java)
- **Frontend-Typ:** [`code/frontend/src/auth/access/AccessRoleCollectionRole.ts`](../../code/frontend/src/auth/access/AccessRoleCollectionRole.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "accessRoleCollectionKey": "BUERGER",
  "accessRoleKey": "USER"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `accessRoleCollectionKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Key der Position (AccessRoleCollection), die das Recht verleiht. |
| `accessRoleKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Key des Rechts (AccessRole), das die Position verleiht. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/access-role-collection-role` | [`AccessRoleCollectionRoleAdminController.createAccessRoleCollectionRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleAdminController.java) | `AccessRoleCollectionRole` |
| GET | `/api/admin/access-role-collection-role/{id}` | [`AccessRoleCollectionRoleAdminController.getAccessRoleCollectionRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleAdminController.java) | `AccessRoleCollectionRole` |
| GET | `/api/admin/access-role-collection-role` | [`AccessRoleCollectionRoleAdminController.getAllAccessRoleCollectionRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleAdminController.java) | `AccessRoleCollectionRole` |
| DELETE | `/api/admin/access-role-collection-role` | [`AccessRoleCollectionRoleAdminController.deleteAccessRoleCollectionRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleAdminController.java) | `AccessRoleCollectionRole` |
| GET | `/api/access-role-collection-role` | [`AccessRoleCollectionRoleController.getAllAccessRoleCollectionRole`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleController.java) | `AccessRoleCollectionRole` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleAdminController.java`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleAdminController.java): `createAccessRoleCollectionRole`, `getAccessRoleCollectionRole`, `getAllAccessRoleCollectionRole`, `deleteAccessRoleCollectionRole`
- [`code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleController.java`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleCollectionRoleController.java): `getAllAccessRoleCollectionRole`
- [`code/backend/src/main/java/de/gebiter/access/repository/AccessRoleCollectionRoleRepository.java`](../../code/backend/src/main/java/de/gebiter/access/repository/AccessRoleCollectionRoleRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/access/service/AccessRoleCollectionRoleService.java`](../../code/backend/src/main/java/de/gebiter/access/service/AccessRoleCollectionRoleService.java): `createAccessRoleCollectionRole`, `getAccessRoleCollectionRole`, `getAllAccessRoleCollectionRole`, `deleteAccessRoleCollectionRole`, `doGetAccessRoleCollectionRole`, `doCreateAccessRoleCollectionRole`, `doGetAccessRoleKeysByAccessRoleCollectionKey`

## Verwendung im Frontend

- [`code/frontend/src/admin/arcar/AccessRoleCollectionAccessRoleMatrixTab.tsx`](../../code/frontend/src/admin/arcar/AccessRoleCollectionAccessRoleMatrixTab.tsx): `findAccessRoleCollectionRole`, `AccessRoleCollectionAccessRoleMatrixTab`, `saveAccessRoleCollectionOrder`, `isGrantedInBackend`, `reloadServerAccessRoleCollectionRoles`
- [`code/frontend/src/auth/access/useAccessRoleCollectionRole.ts`](../../code/frontend/src/auth/access/useAccessRoleCollectionRole.ts): `useAccessRoleCollectionRole`, `createAccessRoleCollectionRole`, `getAllAccessRoleCollectionRole`
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
