# Konzept: Kontaktangaben im Profil

Stand 2026-11-09: **gebaut, getestet und auf dem Pi.**

## 1. Regel (Nutzer 2026-11-09)

- **Oberste Regel:** Steht das Profil auf „Nur ich“, sehen andere nichts außer der GUID.
- Sonst stellt der User **jede Angabe frei** ein, mit derselben Auswahl wie überall (`VisibilityPicker`): „Nur ich“, „Ich und meine
  Freunde“, „Alle User“, „Alle“. Keine Sonderregeln je Feld.
- Wer das Profil nicht sehen darf, sieht auch keine Angabe. Darf er es sehen, entscheidet die Sichtbarkeit der Angabe
  (`UsersService.isVisibleToCurrentUsers`, dieselbe Regel wie für Profil und Galerie).
- Der Admin liest alles, aber nur über `/api/admin/users-contact`.

## 2. Daten

Tabelle `users_contact` (Entity `UsersContact`), lose gekoppelt:

| Feld | Was |
|---|---|
| `id` | Long |
| `usersGuid` | wem die Angabe gehört |
| `contactType` | Enum `UsersContactType`: `MOBILE_NUMBER`, `STREET`, `HOUSE_NUMBER`, `POSTAL_CODE`, `CITY`, `COUNTRY`, `INSTAGRAM`, `TIKTOK`, `YOUTUBE`, `TWITCH`, `STEAM`, `DISCORD`, `TWITTER`, `FACEBOOK`, `REDDIT`, `SNAPCHAT` |
| `contactValue` | ohne Leerzeichen außen, eine Zeile, höchstens `gebiter.users-contact.value-max-length` (150) |
| `visibility` | `NONE`, `FRIENDS`, `AUTHENTICATED`, `ANY` |

- Je User und Art höchstens ein Eintrag. Eine leere Angabe gibt es nicht, sie wird gelöscht.
- Bei Social-Media steht nur die Kennung drin, den Link baut das Frontend aus einer festen Vorlage
  (`users/usersContactTypes.ts`).
- Die alten Kontaktspalten in `users_detail` sind entfernt (Code und Pi-DB; sie waren leer).
- Andere bekommen vom User selbst nur `UsersForProfile` (GUID, Name, Position, Punkte), nie die E-Mail-Adresse. Die
  E-Mail-Adresse dient nur Anmeldung und Systemmails.

## 3. Endpunkte

- `GET /api/users-contact/users/{usersGuid}`: die Angaben, die man sehen darf, nur Art und Wert; 404 bei nicht sichtbarem
  Profil.
- `GET /api/users-contact`: die eigenen samt Sichtbarkeit.
- `PUT /api/users-contact`: eigene Angabe setzen, Body `{contactType, contactValue, visibility}`.
- `DELETE /api/users-contact`: eigene Angabe löschen, Body `{contactType}`.
- `GET /api/admin/users-contact` und `/api/admin/users-contact/users/{usersGuid}`: alles, nur ADMIN.

## 4. Oberfläche

- Box „Kontakt“ im eigenen Profil mit Stift: Popup mit je Angabe einem Feld und der Sichtbarkeit (`VisibilityPicker`) darunter. Ein leeres
  Feld löscht die Angabe, „Speichern“ schickt nur Geändertes.
- Vorauswahl bei einer neuen Angabe: Social-Media „Alle“, Telefon und Anschrift „Nur ich“; frei änderbar.
- Im Profil anderer links die Box mit dem, was man sehen darf (ohne sichtbare Angabe keine Box), rechts das Gästebuch.
