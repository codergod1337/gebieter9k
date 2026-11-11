# UsersSetting

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Einstellung eines Users als Schlüssel-Wert-Paar: seine Preferences, z. B. das Theme oder Einstellungen je Tabelle. Je User gibt es jeden Schlüssel höchstens einmal.

- **Tabelle:** `users_setting`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/UsersSetting.java`](../../code/backend/src/main/java/de/gebiter/users/model/UsersSetting.java)
- **Frontend-Typ:** [`code/frontend/src/userssetting/UsersSetting.ts`](../../code/frontend/src/userssetting/UsersSetting.ts)
- **DTOs:** `OwnUsersSettingDeleteRequest`, `OwnUsersSettingSaveRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "settingKey": "BEISPIEL_KEY",
  "settingValue": "Beispieltext"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, dem die Einstellung gehört. |
| `settingKey` | `String` | Pflicht, max. 100 Zeichen, Spalte `setting_key`, unveränderlich | ja | Spaltenname mit Präfix, weil `key` in SQL ein Schlüsselwort ist. |
| `settingValue` | `String` | Spalte `setting_value` | ja | Der Wert der Einstellung als Text, z. B. die Spaltenbreiten einer Tabelle. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/users-setting` | [`UsersSettingAdminController.createUsersSetting`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingAdminController.java) | `UsersSetting` |
| GET | `/api/admin/users-setting/{id}` | [`UsersSettingAdminController.getUsersSetting`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingAdminController.java) | `UsersSetting` |
| GET | `/api/admin/users-setting/users/{usersGuid}` | [`UsersSettingAdminController.getUsersSettingByUsersGuid`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingAdminController.java) | `UsersSetting` |
| GET | `/api/admin/users-setting` | [`UsersSettingAdminController.getAllUsersSetting`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingAdminController.java) | `UsersSetting` |
| PUT | `/api/admin/users-setting` | [`UsersSettingAdminController.changeUsersSetting`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingAdminController.java) | `UsersSetting` |
| DELETE | `/api/admin/users-setting` | [`UsersSettingAdminController.deleteUsersSetting`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingAdminController.java) | `UsersSetting` |
| GET | `/api/users-setting` | [`UsersSettingController.getOwnUsersSetting`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingController.java) | `UsersSetting` |
| PUT | `/api/users-setting` | [`UsersSettingController.saveOwnUsersSetting`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingController.java) | `UsersSetting`, `OwnUsersSettingSaveRequest` |
| DELETE | `/api/users-setting` | [`UsersSettingController.deleteOwnUsersSetting`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingController.java) | `OwnUsersSettingDeleteRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/users/controller/UsersSettingAdminController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingAdminController.java): `createUsersSetting`, `getUsersSetting`, `getUsersSettingByUsersGuid`, `getAllUsersSetting`, `changeUsersSetting`, `deleteUsersSetting`
- [`code/backend/src/main/java/de/gebiter/users/controller/UsersSettingController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersSettingController.java): `getOwnUsersSetting`, `saveOwnUsersSetting`
- [`code/backend/src/main/java/de/gebiter/users/repository/UsersSettingRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersSettingRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersSettingService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersSettingService.java): `createUsersSetting`, `getUsersSetting`, `getUsersSettingByUsersGuid`, `getAllUsersSetting`, `getOwnUsersSetting`, `saveOwnUsersSetting`, `deleteOwnUsersSetting`, `changeUsersSetting`, `deleteUsersSetting`, `doCreateUsersSetting`, `doGetUsersSetting`, `doGetUsersSettingByUsersGuid`, `doGetAllUsersSetting`, `doChangeUsersSetting`, `doDeleteUsersSetting`

## Verwendung im Frontend

- [`code/frontend/src/achievementmanager/achievement/AchievementTab.tsx`](../../code/frontend/src/achievementmanager/achievement/AchievementTab.tsx): (Typ)
- [`code/frontend/src/achievementmanager/pointactivity/PointActivityTab.tsx`](../../code/frontend/src/achievementmanager/pointactivity/PointActivityTab.tsx): (Typ)
- [`code/frontend/src/profile/ProfilePointsBox.tsx`](../../code/frontend/src/profile/ProfilePointsBox.tsx): (Typ)
- [`code/frontend/src/profile/ProfileSettingsBox.tsx`](../../code/frontend/src/profile/ProfileSettingsBox.tsx): (Typ)
- [`code/frontend/src/userssetting/useOwnUsersSetting.ts`](../../code/frontend/src/userssetting/useOwnUsersSetting.ts): `useOwnUsersSetting`, `getOwnUsersSetting`, `saveOwnUsersSetting`
