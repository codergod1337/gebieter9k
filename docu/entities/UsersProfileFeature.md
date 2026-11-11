# UsersProfileFeature

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Freigeschaltete Profil-Features eines Users: Ein Eintrag ist ein Feature, das er sich z. B. durch ein Achievement verdient hat. Je User ist jedes Feature höchstens einmal freigeschaltet.

- **Tabelle:** `users_profile_feature`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/UsersProfileFeature.java`](../../code/backend/src/main/java/de/gebiter/users/model/UsersProfileFeature.java)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "featureKey": "BEISPIEL_KEY"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, dem das Feature freigeschaltet ist. |
| `featureKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Schlüssel des freigeschalteten Features. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/users-profile-feature` | [`UsersProfileFeatureAdminController.createUsersProfileFeature`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureAdminController.java) | `UsersProfileFeature` |
| DELETE | `/api/admin/users-profile-feature` | [`UsersProfileFeatureAdminController.deleteUsersProfileFeature`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureAdminController.java) | `UsersProfileFeature` |
| GET | `/api/users-profile-feature/{id}` | [`UsersProfileFeatureController.getUsersProfileFeature`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureController.java) | `UsersProfileFeature` |
| GET | `/api/users-profile-feature/users/{usersGuid}` | [`UsersProfileFeatureController.getUsersProfileFeatureByUsersGuid`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureController.java) | `UsersProfileFeature` |
| GET | `/api/users-profile-feature` | [`UsersProfileFeatureController.getAllUsersProfileFeature`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureController.java) | `UsersProfileFeature` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureAdminController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureAdminController.java): `createUsersProfileFeature`, `deleteUsersProfileFeature`
- [`code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersProfileFeatureController.java): `getUsersProfileFeature`, `getUsersProfileFeatureByUsersGuid`, `getAllUsersProfileFeature`
- [`code/backend/src/main/java/de/gebiter/users/repository/UsersProfileFeatureRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersProfileFeatureRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersProfileFeatureService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersProfileFeatureService.java): `createUsersProfileFeature`, `getUsersProfileFeature`, `getUsersProfileFeatureByUsersGuid`, `getAllUsersProfileFeature`, `deleteUsersProfileFeature`, `doCreateUsersProfileFeature`, `doGetUsersProfileFeature`, `doGetUsersProfileFeatureByUsersGuid`, `doGetAllUsersProfileFeature`, `doDeleteUsersProfileFeature`

## Verwendung im Frontend

Keine: Das Frontend kennt die Entity nicht.
