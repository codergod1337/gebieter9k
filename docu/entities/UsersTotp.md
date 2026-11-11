# UsersTotp

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Die Authenticator-App (TOTP) eines Users: das gemeinsame Geheimnis, verschlüsselt, und ob es bestätigt ist. Höchstens ein Eintrag je User. Das Geheimnis verlässt das Backend nur einmal, beim Einrichten (QR-Code); keine Methode liefert es danach aus.

- **Tabelle:** `users_totp`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/security/model/UsersTotp.java`](../../code/backend/src/main/java/de/gebiter/security/model/UsersTotp.java)
- **DTOs:** `UsersTotpCodeCheck`, `UsersTotpCodeRedemption`, `UsersTotpCodeRequest`, `UsersTotpDeleteRequest`, `UsersTotpSetup`, `UsersTotpStatus`, `UsersTotpUsersRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "confirmedAt": "2026-11-09T14:05:27Z",
  "lastUsedTimeStep": 0,
  "createdAt": "2026-11-09T14:05:27Z",
  "failedCodeCount": 0,
  "codeLockedUntil": "2026-11-09T14:05:27Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, eindeutig, unveränderlich | ja | GUID des Users, dem das TOTP gehört; je User höchstens eins. |
| `secretEncrypted` | `String` | Pflicht, max. 200 Zeichen | nein | Das Geheimnis, mit AES-GCM verschlüsselt (Schlüssel aus der .env), als Base64. |
| `confirmedAt` | `Instant` |  | ja | Wann der erste Code bestätigt wurde; `null`: Einrichtung läuft noch. |
| `lastUsedTimeStep` | `Long` |  | ja | Der 30-Sekunden-Schritt des zuletzt angenommenen Codes: Derselbe Code gilt nie zweimal. |
| `createdAt` | `Instant` | Pflicht | ja | Wann das TOTP eingerichtet wurde. |
| `failedCodeCount` | `int` | Pflicht | ja | Falsche Codes am Stück beim Login. Standard 0, damit vorhandene Zeilen die neue Spalte bekommen. |
| `codeLockedUntil` | `Instant` |  | ja | Bis wann der Login keinen Code annimmt; `null`: nicht gesperrt. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/share/users-login-2fa/totp-setup` | [`UsersLogin2faShareController.createUsersLogin2faTotpSetup`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersLogin2faShareController.java) | `UsersTotpSetup` |
| GET | `/api/admin/users-totp/{usersGuid}` | [`UsersTotpAdminController.getUsersTotpStatus`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersTotpAdminController.java) | `UsersTotpStatus` |
| DELETE | `/api/admin/users-totp` | [`UsersTotpAdminController.deleteUsersTotp`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersTotpAdminController.java) | `UsersTotpUsersRequest` |
| POST | `/api/users-totp/setup` | [`UsersTotpController.createOwnUsersTotpSetup`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersTotpController.java) | `UsersTotpSetup` |
| GET | `/api/users-totp` | [`UsersTotpController.getOwnUsersTotpStatus`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersTotpController.java) | `UsersTotpStatus` |
| POST | `/api/users-totp/check` | [`UsersTotpController.checkOwnUsersTotpCode`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersTotpController.java) | `UsersTotpCodeCheck`, `UsersTotpCodeRequest` |
| PUT | `/api/users-totp/confirm` | [`UsersTotpController.confirmOwnUsersTotp`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersTotpController.java) | `UsersTotpCodeRequest`, `UsersTotpStatus` |
| DELETE | `/api/users-totp` | [`UsersTotpController.deleteOwnUsersTotp`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersTotpController.java) | `UsersTotpDeleteRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/security/repository/UsersTotpRepository.java`](../../code/backend/src/main/java/de/gebiter/security/repository/UsersTotpRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/security/service/UsersTotpService.java`](../../code/backend/src/main/java/de/gebiter/security/service/UsersTotpService.java): `checkOwnUsersTotpCode`, `confirmOwnUsersTotp`, `redeemUsersTotpCode`, `deleteOwnUsersTotp`, `deleteUsersTotp`, `doCreateUsersTotpSetup`, `doGetUsersTotpStatus`, `doAcceptCode`, `doGetUsersTotp`, `doMatchesSecret`, `doFindMatchingTimeStep`

## Verwendung im Frontend

- [`code/frontend/src/admin/users/UsersTotpBox.tsx`](../../code/frontend/src/admin/users/UsersTotpBox.tsx): `getUsersTotpStatusText`
- [`code/frontend/src/auth/login/LoginSecondFactorStep.tsx`](../../code/frontend/src/auth/login/LoginSecondFactorStep.tsx): (Typ)
- [`code/frontend/src/auth/login/useLoginWith2fa.ts`](../../code/frontend/src/auth/login/useLoginWith2fa.ts): `useLoginWith2fa`
- [`code/frontend/src/auth/login/useUsersLogin2fa.ts`](../../code/frontend/src/auth/login/useUsersLogin2fa.ts): `useUsersLogin2fa`, `createUsersLogin2fa`, `createUsersLogin2faTotpSetup`
- [`code/frontend/src/auth/totp/TotpSetupInstructions.tsx`](../../code/frontend/src/auth/totp/TotpSetupInstructions.tsx): (Typ)
- [`code/frontend/src/auth/totp/useUsersTotp.ts`](../../code/frontend/src/auth/totp/useUsersTotp.ts): `useUsersTotp`, `createOwnUsersTotpSetup`, `getOwnUsersTotpStatus`, `checkOwnUsersTotpCode`, `confirmOwnUsersTotp`
- [`code/frontend/src/auth/totp/useUsersTotpAdmin.ts`](../../code/frontend/src/auth/totp/useUsersTotpAdmin.ts): `useUsersTotpAdmin`, `getUsersTotpStatus`
- [`code/frontend/src/profile/ProfileAuthenticatorPopup.tsx`](../../code/frontend/src/profile/ProfileAuthenticatorPopup.tsx): `ProfileAuthenticatorPopup`
- [`code/frontend/src/profile/ProfileSecurityBox.tsx`](../../code/frontend/src/profile/ProfileSecurityBox.tsx): `getAuthenticatorText`
