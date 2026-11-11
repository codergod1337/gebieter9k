# UsersDetail

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Erweiterte Profildaten eines Users – das, was andere sehen, wenn sie auf sein Profil kommen: Profilbild, Status-Text, Banner-Drift, Avatar-Farben und Zähler. Alles freiwillig. Wer das Profil überhaupt sehen darf, regelt allein `Users.getProfileVisibility()`; ohne diese Freigabe wird UsersDetail gar nicht geladen. Kontaktangaben mit eigener Sichtbarkeit je Feld stehen in `UsersContact`.

- **Tabelle:** `users_detail`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/UsersDetail.java`](../../code/backend/src/main/java/de/gebiter/users/model/UsersDetail.java)
- **Frontend-Typ:** [`code/frontend/src/users/UsersDetail.ts`](../../code/frontend/src/users/UsersDetail.ts)
- **DTOs:** `OwnUsersDetailAboutTextRequest`, `OwnUsersDetailAvatarColorsRequest`, `OwnUsersDetailBannerDriftSpeedRequest`, `OwnUsersDetailProfileImageRequest`, `OwnUsersDetailStatusTextRequest`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "usersGuid": "77777777-7777-7777-7777-777777777777",
  "uploadCount": 0,
  "downloadCount": 0,
  "writtenGuestbookEntryCount": 0,
  "profileImageBase64Png": "iVBORw0KGgoAAAANSUhEUgAA…",
  "profileImageSmallBase64Png": "iVBORw0KGgoAAAANSUhEUgAA…",
  "statusText": "Beispieltext",
  "aboutText": {
    "de": "Beispiel"
  },
  "bannerDriftSpeedPercent": 100,
  "avatarTextColor": "#e9ff3b",
  "avatarBackgroundColor": "#e9ff3b"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `usersGuid` | `UUID` | Primärschlüssel, Pflicht, unveränderlich | ja | GUID des Users, zugleich Primärschlüssel (1:1 zu Users). |
| `uploadCount` | `Long` | Pflicht | ja | Anzahl der Uploads dieses Users. |
| `downloadCount` | `Long` | Pflicht | ja | Anzahl der Downloads dieses Users. |
| `writtenGuestbookEntryCount` | `Long` | Pflicht | ja | Anzahl der Gästebucheinträge, die dieser User bei anderen geschrieben hat. |
| `profileImageBase64Png` | `String` |  | ja | Das Profilbild groß fürs Profil: ein PNG von `gebiter.profile-image.size-pixels` im Quadrat (600 × 600) als Base64 ohne Präfix, nach der Regel der Dateivorschau: Bild ganz eingepasst, Seitenverhältnis bleibt, mittig, Rest transparent. Im Browser zugeschnitten und gerechnet, vom `Base64PngService` geprüft. Nur hier, nie als Datei im Kern FILE. `null` heißt: Das Profil zeigt die Initialen. Setzt nur der User selbst, immer zusammen mit `.profileImageSmallBase64Png`. |
| `profileImageSmallBase64Png` | `String` |  | ja | Dasselbe Profilbild klein (`gebiter.profile-image.small-size-pixels`, 96 × 96), als Abklatsch für Avatare im Gästebuch, in Listen und später im Chat: So trägt eine Seite mit vielen Autoren nicht viele große Bilder. |
| `statusText` | `String` | max. 500 Zeichen | ja | Der Status-Text im Profilkopf, z. B. was man gerade macht (Nutzer 2026-11-09). Höchstens `gebiter.profile-status-text.max-length` Zeichen, `null` ohne Status. Setzt nur der User selbst. |
| `aboutText` | `Map<String, String>` | jsonb | ja | Der freie Text der Box „Über mich“ im Profil (Nutzer 2026-11-09) als mehrsprachiger Rich-Text: je Sprachkürzel das HTML aus dem Rich-Text-Editor, beim Speichern bereinigt (nur `gebiter.rich-text.allowed-tags`, keine Attribute), z. B. `{"de": " |
| `bannerDriftSpeedPercent` | `Integer` |  | ja | Wie schnell das Standard-Banner dieses Profils driftet, in Prozent des Tempos aus dem Theme: 0 steht still, `null` gilt als 100, höchstens `gebiter.profile-banner-drift.max-percent`. Gehört zum Profil und ist deshalb für jeden sichtbar, der das Profil sehen darf (Nutzer 2026-11-09). Setzt nur der User selbst. |
| `avatarTextColor` | `String` | max. 7 Zeichen | ja | Die Farben des Avatars ohne Profilbild, also der Initialen (Nutzer 2026-11-09): Schrift und Hintergrund als `#rrggbb`. `null` heißt Standard: weiße Schrift, Hintergrund als Verlauf aus der GUID. Gehören zum Profil und sind deshalb für jeden sichtbar, der das Profil sehen darf. Setzt nur der User selbst. |
| `avatarBackgroundColor` | `String` | max. 7 Zeichen | ja | Die Hintergrundfarbe des Avatars ohne Profilbild als `#rrggbb`; `null`: Verlauf aus der GUID. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| GET | `/api/admin/users-detail/{usersGuid}` | [`UsersDetailAdminController.getUsersDetail`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailAdminController.java) | `UsersDetail` |
| GET | `/api/admin/users-detail` | [`UsersDetailAdminController.getAllUsersDetail`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailAdminController.java) | `UsersDetail` |
| GET | `/api/users-detail/{usersGuid}` | [`UsersDetailController.getVisibleUsersDetail`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailController.java) | `UsersDetail` |
| PUT | `/api/users-detail/profile-image` | [`UsersDetailController.changeOwnUsersDetailProfileImage`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailController.java) | `UsersDetail`, `OwnUsersDetailProfileImageRequest` |
| PUT | `/api/users-detail/status-text` | [`UsersDetailController.changeOwnUsersDetailStatusText`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailController.java) | `UsersDetail`, `OwnUsersDetailStatusTextRequest` |
| PUT | `/api/users-detail/about-text` | [`UsersDetailController.changeOwnUsersDetailAboutText`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailController.java) | `UsersDetail`, `OwnUsersDetailAboutTextRequest` |
| PUT | `/api/users-detail/banner-drift-speed` | [`UsersDetailController.changeOwnUsersDetailBannerDriftSpeed`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailController.java) | `UsersDetail`, `OwnUsersDetailBannerDriftSpeedRequest` |
| PUT | `/api/users-detail/avatar-colors` | [`UsersDetailController.changeOwnUsersDetailAvatarColors`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailController.java) | `UsersDetail`, `OwnUsersDetailAvatarColorsRequest` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java`](../../code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java): `createGuestbookAuthor`
- [`code/backend/src/main/java/de/gebiter/users/controller/UsersDetailAdminController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailAdminController.java): `getUsersDetail`, `getAllUsersDetail`
- [`code/backend/src/main/java/de/gebiter/users/controller/UsersDetailController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersDetailController.java): `getVisibleUsersDetail`, `changeOwnUsersDetailProfileImage`, `changeOwnUsersDetailStatusText`, `changeOwnUsersDetailAboutText`, `changeOwnUsersDetailBannerDriftSpeed`, `changeOwnUsersDetailAvatarColors`
- [`code/backend/src/main/java/de/gebiter/users/repository/UsersDetailRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersDetailRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersDetailService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersDetailService.java): `createUsersDetail`, `getUsersDetail`, `getAllUsersDetail`, `increaseUsersDetailUploadCount`, `increaseUsersDetailWrittenGuestbookEntryCount`, `changeOwnUsersDetailProfileImage`, `changeOwnUsersDetailStatusText`, `changeOwnUsersDetailAboutText`, `changeOwnUsersDetailBannerDriftSpeed`, `changeOwnUsersDetailAvatarColors`, `doGetOrCreateOwnUsersDetail`, `doCreateUsersDetail`, `doGetUsersDetail`, `doGetAllUsersDetail`
- [`code/backend/src/main/java/de/gebiter/users/service/UsersService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersService.java): `getUsersAvatarForClient`, `getVisibleUsersDetail`

## Verwendung im Frontend

- [`code/frontend/src/profile/ProfileAboutBox.tsx`](../../code/frontend/src/profile/ProfileAboutBox.tsx): (Typ)
- [`code/frontend/src/profile/ProfileAboutEditPopup.tsx`](../../code/frontend/src/profile/ProfileAboutEditPopup.tsx): (Typ)
- [`code/frontend/src/profile/ProfileHeadSettingsPopup.tsx`](../../code/frontend/src/profile/ProfileHeadSettingsPopup.tsx): (Typ)
- [`code/frontend/src/profile/ProfileHero.tsx`](../../code/frontend/src/profile/ProfileHero.tsx): (Typ)
- [`code/frontend/src/users/useUsersDetail.ts`](../../code/frontend/src/users/useUsersDetail.ts): `useUsersDetail`, `getUsersDetail`, `getAllUsersDetail`, `changeOwnUsersDetailProfileImage`, `changeOwnUsersDetailStatusText`, `changeOwnUsersDetailAboutText`, `changeOwnUsersDetailBannerDriftSpeed`, `changeOwnUsersDetailAvatarColors`
