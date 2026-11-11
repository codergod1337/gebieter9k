# AccessRoleUsersAssignment

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Welche `AccessRole` welchem User zugewiesen ist: Ein Eintrag ist ein Recht an einem User. Ein User kann beliebig viele Rechte haben, jedes höchstens einmal.

- **Tabelle:** `access_role_users_assignment`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/access/model/AccessRoleUsersAssignment.java`](../../code/backend/src/main/java/de/gebiter/access/model/AccessRoleUsersAssignment.java)
- **Frontend-Typ:** [`code/frontend/src/auth/access/AccessRoleUsersAssignment.ts`](../../code/frontend/src/auth/access/AccessRoleUsersAssignment.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "accessRoleKey": "USER"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, dem das Recht einzeln zugewiesen ist. |
| `accessRoleKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Key des einzeln zugewiesenen Rechts (AccessRole). |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/access-role-users-assignment` | [`AccessRoleUsersAssignmentAdminController.createAccessRoleUsersAssignment`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleUsersAssignmentAdminController.java) | `AccessRoleUsersAssignment` |
| GET | `/api/admin/access-role-users-assignment/{id}` | [`AccessRoleUsersAssignmentAdminController.getAccessRoleUsersAssignment`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleUsersAssignmentAdminController.java) | `AccessRoleUsersAssignment` |
| GET | `/api/admin/access-role-users-assignment/users/{usersGuid}` | [`AccessRoleUsersAssignmentAdminController.getAccessRoleUsersAssignmentByUsersGuid`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleUsersAssignmentAdminController.java) | `AccessRoleUsersAssignment` |
| GET | `/api/admin/access-role-users-assignment` | [`AccessRoleUsersAssignmentAdminController.getAllAccessRoleUsersAssignment`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleUsersAssignmentAdminController.java) | `AccessRoleUsersAssignment` |
| DELETE | `/api/admin/access-role-users-assignment` | [`AccessRoleUsersAssignmentAdminController.deleteAccessRoleUsersAssignment`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleUsersAssignmentAdminController.java) | `AccessRoleUsersAssignment` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/access/controller/AccessRoleUsersAssignmentAdminController.java`](../../code/backend/src/main/java/de/gebiter/access/controller/AccessRoleUsersAssignmentAdminController.java): `createAccessRoleUsersAssignment`, `getAccessRoleUsersAssignment`, `getAccessRoleUsersAssignmentByUsersGuid`, `getAllAccessRoleUsersAssignment`, `deleteAccessRoleUsersAssignment`
- [`code/backend/src/main/java/de/gebiter/access/repository/AccessRoleUsersAssignmentRepository.java`](../../code/backend/src/main/java/de/gebiter/access/repository/AccessRoleUsersAssignmentRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/access/service/AccessRoleUsersAssignmentService.java`](../../code/backend/src/main/java/de/gebiter/access/service/AccessRoleUsersAssignmentService.java): `createAccessRoleUsersAssignment`, `getAccessRoleUsersAssignment`, `getAccessRoleUsersAssignmentByUsersGuid`, `getAllAccessRoleUsersAssignment`, `deleteAccessRoleUsersAssignment`, `doCreateAccessRoleUsersAssignment`, `doGetAccessRoleUsersAssignment`, `doGetAccessRoleUsersAssignmentByUsersGuid`, `doGetAccessRoleKeysByUsersGuid`, `doGetAllAccessRoleUsersAssignment`, `doDeleteAccessRoleUsersAssignment`

## Verwendung im Frontend

- [`code/frontend/src/admin/users/EditUsersForm.tsx`](../../code/frontend/src/admin/users/EditUsersForm.tsx): (Typ)
- [`code/frontend/src/auth/access/useAccessRoleUsersAssignment.ts`](../../code/frontend/src/auth/access/useAccessRoleUsersAssignment.ts): `useAccessRoleUsersAssignment`, `createAccessRoleUsersAssignment`, `getAccessRoleUsersAssignment`, `getAccessRoleUsersAssignmentByUsersGuid`, `getAllAccessRoleUsersAssignment`
