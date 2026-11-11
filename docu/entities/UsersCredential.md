# UsersCredential

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Das Passwort eines Users – nur setzbar und prüfbar, nie lesbar.

- **Tabelle:** `users_credential`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/UsersCredential.java`](../../code/backend/src/main/java/de/gebiter/users/model/UsersCredential.java)
- **DTOs:** `UsersCredentialCheckRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "usersGuid": "77777777-7777-7777-7777-777777777777"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `usersGuid` | `UUID` | Primärschlüssel, Pflicht, unveränderlich | ja | GUID des Users, zugleich Primärschlüssel (1:1 zu Users). |
| `passwordHash` | `String` | max. 60 Zeichen | nein | BCrypt-Hash (immer 60 Zeichen) des SHA-256-Hex-Werts. `null`, solange kein Passwort gesetzt ist. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/users-credential/check` | [`UsersCredentialAdminController.checkUsersCredential`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersCredentialAdminController.java) | `UsersCredentialCheckRequest` |
| PUT | `/api/users-credential` | [`UsersCredentialController.changeOwnUsersCredential`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersCredentialController.java) | (eigener Controller) |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/users/controller/UsersCredentialAdminController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersCredentialAdminController.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/controller/UsersCredentialController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersCredentialController.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/repository/UsersCredentialRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersCredentialRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersCredentialService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersCredentialService.java): `createUsersCredential`, `changeUsersCredential`, `changeOwnUsersCredential`, `doCreateUsersCredential`, `doCheckUsersCredential`, `doGetUsersCredential`, `doChangeUsersCredential`

## Verwendung im Frontend

Keine: Das Frontend kennt die Entity nicht.
