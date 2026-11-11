# UsersLogin2fa

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Die Wartezeile der 2FA zwischen „Passwort stimmt“ und „angemeldet“. Der Anmeldeschein (`loginToken`) bleibt im Fenster mit dem Passwort; mit ihm holt es beim Einrichten QR-Code und Schlüssel und löst am Ende mit dem Code aus der Authenticator-App die Sitzung ein. Ohne gültigen Code gibt es keine Sitzung (seit 2026-11-08 Pflicht, der simulierte Bestätigungslink ist weg).

- **Tabelle:** `users_login_2fa`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/security/model/UsersLogin2fa.java`](../../code/backend/src/main/java/de/gebiter/security/model/UsersLogin2fa.java)
- **DTOs:** `CreatedUsersLogin2fa`, `UsersLogin2faTokenRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "expiresAt": "2026-11-09T14:05:27Z",
  "failedCodeCount": 0
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `loginTokenHash` | `String` | Pflicht, eindeutig, max. 64 Zeichen, unveränderlich | nein | SHA-256 des Anmeldescheins als Hex-Text. |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | ja | Wem die Sitzung gehören wird. Lose gekoppelt an `Users.guid`. |
| `expiresAt` | `Instant` | Pflicht, unveränderlich | ja | Ab hier gilt die Zeile nicht mehr (`gebiter.login.two-factor-validity` nach dem Anlegen). |
| `failedCodeCount` | `int` | Pflicht | ja | So viele falsche Codes kamen schon; ab `gebiter.login.max-failed-codes` ist die Zeile weg. Setzt das Repository. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/share/users-login-2fa` | [`UsersLogin2faShareController.createUsersLogin2fa`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersLogin2faShareController.java) | `CreatedUsersLogin2fa` |
| POST | `/api/share/users-login-2fa/totp-setup` | [`UsersLogin2faShareController.createUsersLogin2faTotpSetup`](../../code/backend/src/main/java/de/gebiter/security/controller/UsersLogin2faShareController.java) | `UsersLogin2faTokenRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/security/repository/UsersLogin2faRepository.java`](../../code/backend/src/main/java/de/gebiter/security/repository/UsersLogin2faRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/security/service/UsersLogin2faService.java`](../../code/backend/src/main/java/de/gebiter/security/service/UsersLogin2faService.java): `createUsersLogin2fa`, `createUsersLogin2faTotpSetup`, `deleteUsersLogin2fa`, `doGetActiveUsersLogin2fa`

## Verwendung im Frontend

- [`code/frontend/src/auth/login/useUsersLogin2fa.ts`](../../code/frontend/src/auth/login/useUsersLogin2fa.ts): `useUsersLogin2fa`, `createUsersLogin2fa`
