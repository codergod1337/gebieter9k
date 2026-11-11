# UsersRefreshToken

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Glied der Kette einer Sitzung: der Teil, der eine Anmeldung über das kurze JWT hinaus trägt und sich widerrufen lässt. Der Token selbst ist ein Zufallswert im HttpOnly-Cookie, hier steht nur sein SHA-256.

- **Tabelle:** `users_refresh_token`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/security/model/UsersRefreshToken.java`](../../code/backend/src/main/java/de/gebiter/security/model/UsersRefreshToken.java)
- **DTOs:** `CreatedUsersRefreshToken`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "chainGuid": "77777777-7777-7777-7777-777777777777",
  "sessionNumber": 0,
  "sessionStartedAt": "2026-11-09T14:05:27Z",
  "refreshCount": 0,
  "createdAt": "2026-11-09T14:05:27Z",
  "expiresAt": "2026-11-09T14:05:27Z",
  "usedAt": "2026-11-09T14:05:27Z"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `tokenHash` | `String` | Pflicht, eindeutig, max. 64 Zeichen, unveränderlich | nein | SHA-256 des Tokens als Hex-Text. |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, dem die Sitzung gehört. |
| `chainGuid` | `UUID` | Pflicht, unveränderlich | ja | Die Kette: alle Glieder einer Sitzung, vom Login bis zur letzten Erneuerung. |
| `sessionNumber` | `int` | Pflicht, unveränderlich | ja | Der Platz der Sitzung, 1 bis `gebiter.login.max-sessions`. |
| `sessionStartedAt` | `Instant` | Pflicht, unveränderlich | ja | Wann die Sitzung mit dem Login begann, in jedem Glied der Kette gleich. |
| `refreshCount` | `int` | Pflicht, unveränderlich | ja | Wie oft die Sitzung bis zu diesem Glied erneuert wurde, 0 beim Login. |
| `createdAt` | `Instant` | Pflicht, unveränderlich | ja | Wann dieses Glied ausgestellt wurde, beim Login oder bei einer Verlängerung. |
| `expiresAt` | `Instant` | Pflicht, unveränderlich | ja | Bis wann dieses Glied gilt; danach braucht der User einen neuen Login. |
| `usedAt` | `Instant` |  | ja | Wann das Glied gegen ein neues getauscht wurde, `null`: noch nicht. |

## Endpunkte

Keine: Die Entity wird nur im Backend benutzt.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/security/repository/UsersRefreshTokenRepository.java`](../../code/backend/src/main/java/de/gebiter/security/repository/UsersRefreshTokenRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/security/service/SessionService.java`](../../code/backend/src/main/java/de/gebiter/security/service/SessionService.java): `refreshSession`, `deleteSession`
- [`code/backend/src/main/java/de/gebiter/security/service/UsersRefreshTokenService.java`](../../code/backend/src/main/java/de/gebiter/security/service/UsersRefreshTokenService.java): `createUsersRefreshToken`, `consumeUsersRefreshToken`, `createSuccessorUsersRefreshToken`, `deleteUsersRefreshTokenChain`, `chooseSessionNumber`, `doCreateUsersRefreshToken`

## Verwendung im Frontend

Keine: Das Frontend kennt die Entity nicht.
