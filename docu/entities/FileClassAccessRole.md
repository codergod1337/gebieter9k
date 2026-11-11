# FileClassAccessRole

> Von Hand im Format von `docu/tools/generate_entity_docs.py` nachgezogen (2026-11-11), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Welche `de.gebiter.access.model.AccessRole` an den Dateien einer `FileClass` was darf, als drei eigene Schalter (Nutzer 2026-11-11: lesen, editieren und hochladen als Felder): `readGranted`, `editGranted` und `uploadGranted`. So hängt an der FileClass, ob z. B. jeder User hochladen darf. Bis 2026-11-11 gab es nur die eine Stufe Lesen oder Schreiben (`accessLevel`, Enum `FileClassAccessLevel`; beides gelöscht). Je FileClass hat jedes Recht höchstens einen Eintrag, und nur, wenn mindestens ein Schalter an ist. Lose gekoppelt über die Keys, ohne JPA-Beziehung. Eine Zelle der Matrix „FileClass × AR“.

## Regeln (Nutzer 2026-11-11)

- **Lesen** (`readGranted`): suchen, auflösen, ansehen, herunterladen. Diese Rechte stehen in jedem neuen Dokument in `readerAccessRoleKeys`.
- **Hochladen** (`uploadGranted`): Dateien dieser FileClass hochladen, über einen Upload-Weg, an dem sie angeboten wird (Galerie, später eine Rubrik des Markts). Das prüft der Upload (`FileUploadService`, Schritt 4).
- **Bearbeiten** (`editGranted`): die Metadaten von Dateien dieser FileClass ändern. Wird gespeichert, aber **noch nicht ausgewertet** (Nutzer: erst hochladen und kaufen, dann festlegen, wer wo standardmäßig bearbeitet). Bis dahin bearbeitet wie bisher der Autor seine eigene Datei, wer von ihm freigegeben ist, FILE_MANAGER und ADMIN.
- Bearbeiten und Hochladen schließen Lesen ein: Der Service setzt `readGranted` dann immer mit. Sonst könnte jemand eine Datei hochladen, die er danach selbst nicht sieht.
- Im Solr-Dokument bleiben die Schreibrollen (`writerAccessRoleKeys`) vorerst die Rechte mit „Hochladen“: Damit ändert und löscht der Autor seine eigene Datei wie bisher.
- Matrix „FileClass-AR“: je Schalter ein Buchstabe, L lesen, B bearbeiten, H hochladen; Pinsel ·, L, LH, LB, LBH.

Beispiel: An `MEME` steht bei `USER` „LH“: Jeder User liest Memes und lädt welche hoch. An `DOKUMENT` steht bei `USER` „L“: lesen ja, hochladen nein.

Umstellung der Pi-DB am 2026-11-11: `READER` wurde zu lesen, `WRITER` zu lesen + hochladen, bearbeiten überall aus; die Spalte `access_level` ist gelöscht.

- **Tabelle:** `file_class_access_role`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/file/model/FileClassAccessRole.java`](../../code/backend/src/main/java/de/gebiter/file/model/FileClassAccessRole.java)
- **Frontend-Typ:** [`code/frontend/src/file/FileClassAccessRole.ts`](../../code/frontend/src/file/FileClassAccessRole.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "fileClassKey": "FOTO_URLAUB",
  "accessRoleKey": "USER",
  "readGranted": true,
  "editGranted": false,
  "uploadGranted": true
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `fileClassKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Key der FileClass. |
| `accessRoleKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Key des Rechts (AccessRole), das an der FileClass etwas darf. |
| `readGranted` | `boolean` | Pflicht | ja | Lesen: suchen, auflösen, ansehen, herunterladen. Bearbeiten und Hochladen schließen Lesen ein. |
| `editGranted` | `boolean` | Pflicht | ja | Bearbeiten: die Metadaten von Dateien dieser FileClass ändern. Wird noch nicht ausgewertet. |
| `uploadGranted` | `boolean` | Pflicht | ja | Hochladen: Dateien dieser FileClass hochladen, über einen Upload-Weg, an dem sie angeboten wird. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/file-class-access-role` | [`FileClassAccessRoleAdminController.createFileClassAccessRole`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleAdminController.java) | `FileClassAccessRole` |
| GET | `/api/admin/file-class-access-role/{id}` | [`FileClassAccessRoleAdminController.getFileClassAccessRole`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleAdminController.java) | `FileClassAccessRole` |
| PUT | `/api/admin/file-class-access-role` | [`FileClassAccessRoleAdminController.changeFileClassAccessRole`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleAdminController.java) | `FileClassAccessRole` |
| DELETE | `/api/admin/file-class-access-role` | [`FileClassAccessRoleAdminController.deleteFileClassAccessRole`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleAdminController.java) | `FileClassAccessRole` |
| GET | `/api/file-class-access-role` | [`FileClassAccessRoleController.getAllFileClassAccessRole`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleController.java) | `FileClassAccessRole` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleAdminController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleAdminController.java): `createFileClassAccessRole`, `getFileClassAccessRole`, `changeFileClassAccessRole`, `deleteFileClassAccessRole`
- [`code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAccessRoleController.java): `getAllFileClassAccessRole`
- [`code/backend/src/main/java/de/gebiter/file/repository/FileClassAccessRoleRepository.java`](../../code/backend/src/main/java/de/gebiter/file/repository/FileClassAccessRoleRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/file/service/FileClassAccessRoleService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileClassAccessRoleService.java): `createFileClassAccessRole`, `getFileClassAccessRole`, `getAllFileClassAccessRole`, `getReaderAccessRoleKeysByFileClassKey`, `getUploaderAccessRoleKeysByFileClassKey`, `changeFileClassAccessRole`, `deleteFileClassAccessRole`, `requireAnythingGranted`, `doGetFileClassAccessRole`

## Verwendung im Frontend

- [`code/frontend/src/admin/fileclass/FileClassAccessRoleMatrixTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassAccessRoleMatrixTab.tsx): `getCellValueOfGrants`, `getGrantsOfCellValue`, `findFileClassAccessRole`, `getCellValue`, `FileClassAccessRoleMatrixTab`, `getServerCellValue`, `reloadServerFileClassAccessRoles`
- [`code/frontend/src/admin/fileclass/FileClassTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassTab.tsx): `getAccessRolesWithFileClassGrant` (Spalten Lesen, Bearbeiten, Hochladen)
- [`code/frontend/src/file/FileClassAccessRole.ts`](../../code/frontend/src/file/FileClassAccessRole.ts): `hasFileClassGrant`, `getUploadableFileClassKeys` (Upload-Masken), `getReadableFileClassKeys` (Dateiliste)
- [`code/frontend/src/file/useFileClassAccessRole.ts`](../../code/frontend/src/file/useFileClassAccessRole.ts): `useFileClassAccessRole`, `createFileClassAccessRole`, `getAllFileClassAccessRole`, `changeFileClassAccessRole`
- [`code/frontend/src/filemanager/files/FileDocumentListTab.tsx`](../../code/frontend/src/filemanager/files/FileDocumentListTab.tsx): (Typ)
- [`code/frontend/src/filemanager/upload/FileUploadTab.tsx`](../../code/frontend/src/filemanager/upload/FileUploadTab.tsx): (Typ)
- [`code/frontend/src/gallery/GalleryUploadBox.tsx`](../../code/frontend/src/gallery/GalleryUploadBox.tsx): (Typ)
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
