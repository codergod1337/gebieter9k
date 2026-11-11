# UsersContact

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Kontaktangabe eines Users, z. B. seine Stadt oder sein Instagram-Konto, mit eigener Sichtbarkeit (Nutzer 2026-11-09): Je Feld wählt der User frei „Nur ich“, „Ich und meine Freunde“, „Alle User“ oder „Alle“. Je User und Art höchstens ein Eintrag; eine leere Angabe gibt es nicht, sie wird gelöscht. Lose gekoppelt über die GUID.

- **Tabelle:** `users_contact`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/UsersContact.java`](../../code/backend/src/main/java/de/gebiter/users/model/UsersContact.java)
- **Frontend-Typ:** [`code/frontend/src/users/UsersContact.ts`](../../code/frontend/src/users/UsersContact.ts)
- **DTOs:** `OwnUsersContactDeleteRequest`, `OwnUsersContactSaveRequest`, `UsersContactForClient`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "contactType": "MOBILE_NUMBER",
  "contactValue": "Beispieltext",
  "visibility": "NONE"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `usersGuid` | `UUID` | Pflicht, unveränderlich | ja | GUID des Users, dem die Angabe gehört. |
| `contactType` | `UsersContactType` | Enum als Text, Pflicht, max. 30 Zeichen, unveränderlich | ja | Welche Angabe, z. B. Mobil, Anschrift oder ein Social-Media-Konto. |
| `contactValue` | `String` | Pflicht, max. 500 Zeichen | ja | Die Angabe ohne Leerzeichen außen, höchstens `gebiter.users-contact.value-max-length` Zeichen. |
| `visibility` | `Visibility` | Enum als Text, Pflicht, max. 30 Zeichen | ja | Wer die Angabe sieht: Nur ich, Ich und meine Freunde, Alle User oder Alle. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| GET | `/api/admin/users-contact/users/{usersGuid}` | [`UsersContactAdminController.getUsersContactByUsers`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersContactAdminController.java) | `UsersContact` |
| GET | `/api/admin/users-contact` | [`UsersContactAdminController.getAllUsersContact`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersContactAdminController.java) | `UsersContact` |
| GET | `/api/users-contact/users/{usersGuid}` | [`UsersContactController.getVisibleUsersContact`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersContactController.java) | `UsersContactForClient` |
| GET | `/api/users-contact` | [`UsersContactController.getOwnUsersContact`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersContactController.java) | `UsersContact` |
| PUT | `/api/users-contact` | [`UsersContactController.saveOwnUsersContact`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersContactController.java) | `UsersContact`, `OwnUsersContactSaveRequest` |
| DELETE | `/api/users-contact` | [`UsersContactController.deleteOwnUsersContact`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersContactController.java) | `OwnUsersContactDeleteRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/users/controller/UsersContactAdminController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersContactAdminController.java): `getUsersContactByUsers`, `getAllUsersContact`
- [`code/backend/src/main/java/de/gebiter/users/controller/UsersContactController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersContactController.java): `getOwnUsersContact`, `saveOwnUsersContact`
- [`code/backend/src/main/java/de/gebiter/users/repository/UsersContactRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersContactRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersContactService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersContactService.java): `getOwnUsersContact`, `getVisibleUsersContact`, `getUsersContactByUsers`, `getAllUsersContact`, `saveOwnUsersContact`, `deleteOwnUsersContact`, `doGetUsersContactInOrder`, `doSaveUsersContact`

## Verwendung im Frontend

- [`code/frontend/src/profile/ProfileContactBox.tsx`](../../code/frontend/src/profile/ProfileContactBox.tsx): `createContactRows`
- [`code/frontend/src/profile/ProfileContactEditPopup.tsx`](../../code/frontend/src/profile/ProfileContactEditPopup.tsx): `createInitialDrafts`
- [`code/frontend/src/users/UsersDetail.ts`](../../code/frontend/src/users/UsersDetail.ts): (Typ)
- [`code/frontend/src/users/useUsersContact.ts`](../../code/frontend/src/users/useUsersContact.ts): `useUsersContact`, `getVisibleUsersContact`, `getOwnUsersContact`, `saveOwnUsersContact`
- [`code/frontend/src/users/usersContactTypes.ts`](../../code/frontend/src/users/usersContactTypes.ts): (Typ)
