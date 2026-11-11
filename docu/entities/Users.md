# Users

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Benutzer.

- **Tabelle:** `users`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/users/model/Users.java`](../../code/backend/src/main/java/de/gebiter/users/model/Users.java)
- **Frontend-Typ:** [`code/frontend/src/users/Users.ts`](../../code/frontend/src/users/Users.ts)
- **DTOs:** `NewUsers`, `OnlineUsersCount`, `OwnUsersVisibilityRequest`, `UsersAvatarForClient`, `UsersAvatarResolveRequest`, `UsersForClient`, `UsersForProfile`, `UsersOnlineCheckInEvent`, `UsersOnlineStatus`, `UsersSessionEndedEvent`
- **Steckt in:** `SessionInfo`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "guid": "77777777-7777-7777-7777-777777777777",
  "username": "alice",
  "email": "alice@example.org",
  "profileVisibility": "NONE",
  "friendListVisibility": "NONE",
  "accessRoleCollectionKey": "BUERGER",
  "status": "ACTIVE",
  "points": 0
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `guid` | `UUID` | Primärschlüssel, Pflicht, unveränderlich | ja | Wird im Konstruktor gesetzt: zufällig (normaler User) oder vorgegeben (Admin). |
| `username` | `String` | Pflicht, eindeutig, max. 50 Zeichen | ja | Der Name des Users, eindeutig; so steht er im Profil und an seinen Beiträgen. |
| `email` | `String` | Pflicht, eindeutig, max. 255 Zeichen | ja | Die E-Mail-Adresse, eindeutig; mit ihr meldet er sich an. |
| `profileVisibility` | `Visibility` | Enum als Text, Pflicht, max. 30 Zeichen | ja | Wer mich überhaupt sehen darf. Alle anderen sehen mich nur als „anonym“. |
| `friendListVisibility` | `Visibility` | Enum als Text, Pflicht, max. 30 Zeichen | ja | Wer meine Freundesliste sehen darf – eine Einstellung für alle Freunde gemeinsam. |
| `accessRoleCollectionKey` | `String` | max. 100 Zeichen | ja | Die Position: die eine zugewiesene `AccessRoleCollection`, höchstens eine, `null` heißt keine. Sie verleiht Rechte; dazu kann ein User Rechte direkt zugewiesen haben, die bei einem Wechsel der Position bleiben. Mit welcher er startet, setzt der `UsersService` beim Anlegen aus `gebiter.accessrolecollection.default-key`. Kein Rang: Der Rang ist nur Anzeige und steht für sich. |
| `status` | `UsersStatus` | Enum als Text, Pflicht, max. 30 Zeichen | ja | Jeder neue User startet als `UsersStatus.ACTIVE`. Auf `UsersStatus.DELETED` setzt ihn nur `UsersService.deleteUsers`, ein `PUT` ändert den Status nie. |
| `points` | `long` | Pflicht | ja | Der Punktestand: Punkte gibt es für Aktionen, die wir für wertvoll halten, z. B. hochladen, Daumen bekommen oder geben, Gästebucheinträge schreiben oder bekommen. Damit schaltet man sich später mehr frei. Setzt nur das Backend, nie ein Request Body; ein `PUT` ändert ihn nie. Neue User starten bei 0, der Default in der Datenbank füllt auch die Zeilen, die es schon gibt. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| GET | `/api/users-online/count` | [`UsersOnlineController.getOnlineUsersCount`](../../code/backend/src/main/java/de/gebiter/achievement/controller/UsersOnlineController.java) | `OnlineUsersCount` |
| GET | `/api/users-online/{usersGuid}` | [`UsersOnlineController.getVisibleUsersOnlineStatus`](../../code/backend/src/main/java/de/gebiter/achievement/controller/UsersOnlineController.java) | `UsersOnlineStatus` |
| POST | `/api/share/registration` | [`RegistrationShareController.createRegistration`](../../code/backend/src/main/java/de/gebiter/security/controller/RegistrationShareController.java) | `Users` |
| GET | `/api/session` | [`SessionController.getSession`](../../code/backend/src/main/java/de/gebiter/security/controller/SessionController.java) | `SessionInfo` |
| POST | `/api/share/session` | [`SessionShareController.createSession`](../../code/backend/src/main/java/de/gebiter/security/controller/SessionShareController.java) | `SessionInfo` |
| POST | `/api/share/session/refresh` | [`SessionShareController.refreshSession`](../../code/backend/src/main/java/de/gebiter/security/controller/SessionShareController.java) | `SessionInfo` |
| POST | `/api/admin/users` | [`UsersAdminController.createUsers`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersAdminController.java) | `NewUsers`, `Users` |
| GET | `/api/admin/users/{usersGuid}` | [`UsersAdminController.getUsers`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersAdminController.java) | `Users` |
| GET | `/api/admin/users` | [`UsersAdminController.getAllUsers`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersAdminController.java) | `Users` |
| GET | `/api/admin/users/deleted` | [`UsersAdminController.getDeletedUsers`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersAdminController.java) | `Users` |
| PUT | `/api/admin/users` | [`UsersAdminController.changeUsers`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersAdminController.java) | `Users` |
| DELETE | `/api/admin/users` | [`UsersAdminController.deleteUsers`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersAdminController.java) | `Users` |
| GET | `/api/users/{usersGuid}` | [`UsersController.getUsersForClient`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersController.java) | `UsersForClient` |
| GET | `/api/users/avatar/{usersGuid}` | [`UsersController.getUsersAvatarForClient`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersController.java) | `UsersAvatarForClient` |
| POST | `/api/users/avatar/resolve` | [`UsersController.resolveUsersAvatarsForClient`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersController.java) | `UsersAvatarResolveRequest`, `UsersAvatarForClient` (Liste); mehrere User in einer Anfrage, höchstens `gebiter.users.avatar-resolve-max-guids` (100) |
| PUT | `/api/users/visibility` | [`UsersController.changeOwnUsersVisibility`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersController.java) | `Users`, `OwnUsersVisibilityRequest` |

**Anlegen durch den Admin (Nutzer 2026-11-11):** `POST /api/admin/users` nimmt dieselben Angaben wie die Registrierung, dazu wahlweise die GUID: `{"username": "bob", "email": "bob@example.org", "guid": "019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b", "sha256HexPassword": "…64 Hex-Zeichen…"}`. `guid` und `sha256HexPassword` dürfen fehlen: Ohne GUID entsteht eine neue (Version 7), ohne Passwort gilt das Startpasswort aus `gebiter.users.start-password`. User und Passwort entstehen in einer Transaktion (`UsersService.createUsersWithPassword`). Der neue User bekommt die Standard-Position und hat noch keine Authenticator-App; er richtet sie bei seiner ersten Anmeldung ein. In der Oberfläche: Administration, Tab „User“, Knopf „neuer User“. Getestet am 2026-11-11 (Wegwerf-Test gegen die Pi-DB mit Rollback, danach gelöscht): ohne Passwort stimmt das Startpasswort, ein eigenes Passwort und eine vorgegebene GUID werden übernommen, ein Passwort im Klartext ergibt 400 und legt nichts an, vergebene E-Mail-Adresse oder GUID 409, der Login mit dem Startpasswort führt zum Einrichten der App, ein normaler User darf nicht anlegen.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java`](../../code/backend/src/main/java/de/gebiter/guestbook/service/GuestbookService.java): `createGuestbookAuthor`
- [`code/backend/src/main/java/de/gebiter/security/controller/RegistrationShareController.java`](../../code/backend/src/main/java/de/gebiter/security/controller/RegistrationShareController.java): `createRegistration`
- [`code/backend/src/main/java/de/gebiter/security/dto/SessionInfo.java`](../../code/backend/src/main/java/de/gebiter/security/dto/SessionInfo.java): `(Record-Komponenten)`
- [`code/backend/src/main/java/de/gebiter/security/service/RegistrationService.java`](../../code/backend/src/main/java/de/gebiter/security/service/RegistrationService.java): `createRegistration`, `doCreateRegistration`
- [`code/backend/src/main/java/de/gebiter/security/service/SessionService.java`](../../code/backend/src/main/java/de/gebiter/security/service/SessionService.java): `createSession`, `refreshSession`, `doCreateSession`, `doGetSession`
- [`code/backend/src/main/java/de/gebiter/security/service/UsersLogin2faService.java`](../../code/backend/src/main/java/de/gebiter/security/service/UsersLogin2faService.java): `createUsersLogin2fa`
- [`code/backend/src/main/java/de/gebiter/security/service/UsersTotpService.java`](../../code/backend/src/main/java/de/gebiter/security/service/UsersTotpService.java): `doCreateUsersTotpSetup`
- [`code/backend/src/main/java/de/gebiter/users/controller/UsersAdminController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersAdminController.java): `createUsers`, `getUsers`, `getAllUsers`, `getDeletedUsers`, `changeUsers`, `deleteUsers`
- [`code/backend/src/main/java/de/gebiter/users/controller/UsersController.java`](../../code/backend/src/main/java/de/gebiter/users/controller/UsersController.java): `changeOwnUsersVisibility`
- [`code/backend/src/main/java/de/gebiter/users/repository/UsersRepository.java`](../../code/backend/src/main/java/de/gebiter/users/repository/UsersRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/users/service/UsersContactService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersContactService.java): `getVisibleUsersContact`
- [`code/backend/src/main/java/de/gebiter/users/service/UsersService.java`](../../code/backend/src/main/java/de/gebiter/users/service/UsersService.java): `createUsers`, `createUsersWithPassword`, `getUsers`, `isProfileVisibleToCurrentUsers`, `getUsersForClient`, `getUsersAvatarForClient`, `resolveUsersAvatarsForClient`, `doGetUsersAvatarForClient`, `getVisibleUsersDetail`, `findUsersByEmail`, `getAllUsers`, `getDeletedUsers`, `changeUsers`, `getUsersPoints`, `changeOwnUsersVisibility`, `deleteUsers`, `doCreateUsers`, `doIsProfileVisibleToCurrentUsers`, `doGetNotDeletedUsers`, `doFindNotDeletedUsersByEmail`, `doGetAllNotDeletedUsers`, `doGetDeletedUsers`, `doChangeUsers`, `doDeleteUsers`

## Verwendung im Frontend

- [`code/frontend/src/achievement/UsersAchievementSummary.ts`](../../code/frontend/src/achievement/UsersAchievementSummary.ts): (Typ)
- [`code/frontend/src/admin/accessrole/AccessRoleTab.tsx`](../../code/frontend/src/admin/accessrole/AccessRoleTab.tsx): (Typ)
- [`code/frontend/src/admin/fileclass/FileClassDestinationTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassDestinationTab.tsx): (Typ)
- [`code/frontend/src/admin/userarc/UsersArcMatrixTab.tsx`](../../code/frontend/src/admin/userarc/UsersArcMatrixTab.tsx): `UsersArcMatrixTab`, `getShownUsers`, `handleCellClick`, `isMarked`, `getCellLabel`, `renderRowHeader`
- [`code/frontend/src/admin/users/EditUsersForm.tsx`](../../code/frontend/src/admin/users/EditUsersForm.tsx): `EditUsersForm`, `handleUsernameChange`, `handleEmailChange`, `handleToggleAccessRole`, `handleSave`
- [`code/frontend/src/admin/users/EditUsersTab.tsx`](../../code/frontend/src/admin/users/EditUsersTab.tsx): (Typ)
- [`code/frontend/src/admin/users/NewUsersPopup.tsx`](../../code/frontend/src/admin/users/NewUsersPopup.tsx): `NewUsersPopup`, `handleCreate` (Popup „Neuer User“ der Administration; Texte in `newUsersTexts.ts`)
- [`code/frontend/src/admin/users/UsersTab.tsx`](../../code/frontend/src/admin/users/UsersTab.tsx): `UsersTab`, `getAssignedAccessRoles`, `getAccessRoleCollection`, `handleEdit`, `handleUsersCreated`
- [`code/frontend/src/admin/users/UsersTableRow.tsx`](../../code/frontend/src/admin/users/UsersTableRow.tsx): (Typ)
- [`code/frontend/src/admin/users/UsersTotpBox.tsx`](../../code/frontend/src/admin/users/UsersTotpBox.tsx): (Typ)
- [`code/frontend/src/auth/login/SessionContext.ts`](../../code/frontend/src/auth/login/SessionContext.ts): (Typ)
- [`code/frontend/src/auth/login/SessionInfo.ts`](../../code/frontend/src/auth/login/SessionInfo.ts): (Typ)
- [`code/frontend/src/auth/login/SessionProvider.tsx`](../../code/frontend/src/auth/login/SessionProvider.tsx): `applySession`, `renewSession`, `renewSessionHoldingLock`, `renewSessionAfterUnauthorized`, `restoreSession`, `acceptSession`, `logout`, `acceptOwnUsers`
- [`code/frontend/src/auth/register/useRegistration.ts`](../../code/frontend/src/auth/register/useRegistration.ts): `useRegistration`, `createRegistration`
- [`code/frontend/src/auth/totp/useUsersTotpAdmin.ts`](../../code/frontend/src/auth/totp/useUsersTotpAdmin.ts): `useUsersTotpAdmin`, `getUsersTotpStatus`
- [`code/frontend/src/components/Table.tsx`](../../code/frontend/src/components/Table.tsx): (Typ)
- [`code/frontend/src/components/TableColumn.ts`](../../code/frontend/src/components/TableColumn.ts): (Typ)
- [`code/frontend/src/components/UsersAvatar.tsx`](../../code/frontend/src/components/UsersAvatar.tsx): (Typ)
- [`code/frontend/src/components/UsersProfileLink.tsx`](../../code/frontend/src/components/UsersProfileLink.tsx): (Typ)
- [`code/frontend/src/components/VisibilityPicker.tsx`](../../code/frontend/src/components/VisibilityPicker.tsx): (Typ)
- [`code/frontend/src/file/FileSolrFieldNameSet.ts`](../../code/frontend/src/file/FileSolrFieldNameSet.ts): (Typ)
- [`code/frontend/src/file/document/FileDocumentDetailPage.tsx`](../../code/frontend/src/file/document/FileDocumentDetailPage.tsx): (Typ)
- [`code/frontend/src/file/document/removeUnsafeLinks.ts`](../../code/frontend/src/file/document/removeUnsafeLinks.ts): (Typ)
- [`code/frontend/src/file/useFileDocument.ts`](../../code/frontend/src/file/useFileDocument.ts): (Typ)
- [`code/frontend/src/file/useFileDocumentBlob.ts`](../../code/frontend/src/file/useFileDocumentBlob.ts): (Typ)
- [`code/frontend/src/gallery/Gallery.ts`](../../code/frontend/src/gallery/Gallery.ts): (Typ)
- [`code/frontend/src/gallery/GalleryEditPopup.tsx`](../../code/frontend/src/gallery/GalleryEditPopup.tsx): (Typ)
- [`code/frontend/src/gallery/GalleryListTab.tsx`](../../code/frontend/src/gallery/GalleryListTab.tsx): (Typ)
- [`code/frontend/src/gallery/galleryPaths.ts`](../../code/frontend/src/gallery/galleryPaths.ts): (Typ)
- [`code/frontend/src/guestbook/useGuestbook.ts`](../../code/frontend/src/guestbook/useGuestbook.ts): `useGuestbook`, `resolveGuestbookPage`
- [`code/frontend/src/layout/AppHeader.tsx`](../../code/frontend/src/layout/AppHeader.tsx): `AppHeader`
- [`code/frontend/src/layout/OnlineUsersCount.tsx`](../../code/frontend/src/layout/OnlineUsersCount.tsx): `OnlineUsersCount`
- [`code/frontend/src/navigation/viewCache.ts`](../../code/frontend/src/navigation/viewCache.ts): (Typ)
- [`code/frontend/src/profile/OtherUsersProfileOverview.tsx`](../../code/frontend/src/profile/OtherUsersProfileOverview.tsx): (Typ)
- [`code/frontend/src/profile/Profile.tsx`](../../code/frontend/src/profile/Profile.tsx): (Typ)
- [`code/frontend/src/profile/ProfileAccountBox.tsx`](../../code/frontend/src/profile/ProfileAccountBox.tsx): (Typ)
- [`code/frontend/src/profile/ProfileContactEditPopup.tsx`](../../code/frontend/src/profile/ProfileContactEditPopup.tsx): (Typ)
- [`code/frontend/src/profile/ProfileCover.tsx`](../../code/frontend/src/profile/ProfileCover.tsx): (Typ)
- [`code/frontend/src/profile/ProfileFriendsBox.tsx`](../../code/frontend/src/profile/ProfileFriendsBox.tsx): (Typ)
- [`code/frontend/src/profile/ProfileFriendshipButton.tsx`](../../code/frontend/src/profile/ProfileFriendshipButton.tsx): (Typ)
- [`code/frontend/src/profile/ProfileHero.tsx`](../../code/frontend/src/profile/ProfileHero.tsx): (Typ)
- [`code/frontend/src/profile/ProfileHome.tsx`](../../code/frontend/src/profile/ProfileHome.tsx): (Typ)
- [`code/frontend/src/profile/ProfileOnlineSince.tsx`](../../code/frontend/src/profile/ProfileOnlineSince.tsx): (Typ)
- [`code/frontend/src/profile/ProfilePointsBox.tsx`](../../code/frontend/src/profile/ProfilePointsBox.tsx): (Typ)
- [`code/frontend/src/profile/ProfileSettingsBox.tsx`](../../code/frontend/src/profile/ProfileSettingsBox.tsx): (Typ)
- [`code/frontend/src/solrmanager/SolrCoreFieldsTab.tsx`](../../code/frontend/src/solrmanager/SolrCoreFieldsTab.tsx): (Typ)
- [`code/frontend/src/users/UsersAvatarForClient.ts`](../../code/frontend/src/users/UsersAvatarForClient.ts): (Typ)
- [`code/frontend/src/users/UsersContact.ts`](../../code/frontend/src/users/UsersContact.ts): (Typ)
- [`code/frontend/src/users/UsersDetail.ts`](../../code/frontend/src/users/UsersDetail.ts): (Typ)
- [`code/frontend/src/users/UsersOnline.ts`](../../code/frontend/src/users/UsersOnline.ts): (Typ)
- [`code/frontend/src/users/useOwnFriends.ts`](../../code/frontend/src/users/useOwnFriends.ts): (Typ)
- [`code/frontend/src/users/useUsers.ts`](../../code/frontend/src/users/useUsers.ts): `useUsers`, `createUsers`, `getUsersForClient`, `getUsers`, `getAllUsers`, `getDeletedUsers`, `changeUsers`, `changeOwnUsersVisibility`
- [`code/frontend/src/users/useUsersAvatarForClient.ts`](../../code/frontend/src/users/useUsersAvatarForClient.ts): `useUsersAvatarForClient`, `useUsersAvatarsForClient` (mehrere in einer Sammel-Anfrage), `useUsersAvatarsPreload`
- [`code/frontend/src/users/getUsersShownName.ts`](../../code/frontend/src/users/getUsersShownName.ts): `getUsersShownName` (der Name, unter dem ein User überall steht: Username, „Anonym“, „Gelöschter User“)
- [`code/frontend/src/components/UsersGuidList.tsx`](../../code/frontend/src/components/UsersGuidList.tsx): `UsersGuidList` (Liste von Usern mit Suchfeld, z. B. im Hoverlay)
- [`code/frontend/src/users/useUsersContact.ts`](../../code/frontend/src/users/useUsersContact.ts): `useUsersContact`
- [`code/frontend/src/users/useUsersDetail.ts`](../../code/frontend/src/users/useUsersDetail.ts): `useUsersDetail`
- [`code/frontend/src/users/useUsersOnline.ts`](../../code/frontend/src/users/useUsersOnline.ts): `useUsersOnline`, `getOnlineUsersCount`, `getVisibleUsersOnlineStatus`
- [`code/frontend/src/users/usersContactTypes.ts`](../../code/frontend/src/users/usersContactTypes.ts): (Typ)
- [`code/frontend/src/users/usersProfilePath.ts`](../../code/frontend/src/users/usersProfilePath.ts): (Typ)
- [`code/frontend/src/users/visibilityLabels.ts`](../../code/frontend/src/users/visibilityLabels.ts): (Typ)
- [`code/frontend/src/userssetting/UsersSetting.ts`](../../code/frontend/src/userssetting/UsersSetting.ts): (Typ)
- [`code/frontend/src/userssetting/UsersSettingProvider.tsx`](../../code/frontend/src/userssetting/UsersSettingProvider.tsx): `UsersSettingProvider`, `loadOwnUsersSetting`, `settingValue`
