# FileClass

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Dateiart, z. B. `FOTO_URLAUB` oder `VIDEO_GAMEPLAY` (bei der Vorlage FileSubClass). Jede Datei im Solr-Kern `FILE` gehört zu genau einer FileClass. Die FileClass bestimmt, wer die Datei lesen und schreiben darf (`FileClassAccessRole`) und welche Endungen sie annimmt (`FileClassFileExtension`).

- **Tabelle:** `file_class`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/file/model/FileClass.java`](../../code/backend/src/main/java/de/gebiter/file/model/FileClass.java)
- **Frontend-Typ:** [`code/frontend/src/file/FileClass.ts`](../../code/frontend/src/file/FileClass.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "key": "BEISPIEL_KEY",
  "displayName": {
    "de": "Beispiel"
  },
  "description": {
    "de": "Beispiel"
  },
  "listingPosition": 0,
  "badgeLook": {
    "gradient": "Beispieltext",
    "structure": "Beispieltext",
    "effects": [
      "Beispieltext"
    ],
    "symbolPack": "Beispieltext",
    "symbolName": "Beispielname",
    "gradientStartColor": "#e9ff3b",
    "gradientEndColor": "#e9ff3b",
    "textColor": "#e9ff3b",
    "textShadowColor": "#e9ff3b",
    "borderColor": "#e9ff3b",
    "shadowColor": "#e9ff3b",
    "structureColor": "#e9ff3b"
  }
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `file_class_key`, unveränderlich | ja | Fester technischer Schlüssel nach der Key-Regel. Spaltenname mit Präfix, weil `key` in SQL ein Schlüsselwort ist. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename als JSON, z. B. `{"de": "Urlaubsbilder"`}. |
| `description` | `Map<String, String>` | jsonb | ja | Mehrsprachige Beschreibung: was in diese Dateiart gehört. Optional. |
| `listingPosition` | `int` | Pflicht | ja | Platz in der Anzeige, von oben nach unten ab 1. Neue kommen ans Ende. |
| `badgeLook` | `BadgeLook` | eingebettet | ja | Das Aussehen als Badge (Kachel), samt Symbol. `null`: der Standard aus base.css. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/file-class` | [`FileClassAdminController.createFileClass`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAdminController.java) | `FileClass` |
| GET | `/api/admin/file-class/{fileClassKey}` | [`FileClassAdminController.getFileClass`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAdminController.java) | `FileClass` |
| PUT | `/api/admin/file-class` | [`FileClassAdminController.changeFileClass`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAdminController.java) | `FileClass` |
| GET | `/api/file-class` | [`FileClassController.getAllFileClass`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassController.java) | `FileClass` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/controller/FileClassAdminController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassAdminController.java): `createFileClass`, `getFileClass`, `changeFileClass`
- [`code/backend/src/main/java/de/gebiter/file/controller/FileClassController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassController.java): `getAllFileClass`
- [`code/backend/src/main/java/de/gebiter/file/repository/FileClassRepository.java`](../../code/backend/src/main/java/de/gebiter/file/repository/FileClassRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/file/service/FileClassAccessRoleService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileClassAccessRoleService.java): `createFileClassAccessRole`
- [`code/backend/src/main/java/de/gebiter/file/service/FileClassDestinationAssignmentService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileClassDestinationAssignmentService.java): `createFileClassDestinationAssignment`
- [`code/backend/src/main/java/de/gebiter/file/service/FileClassFileExtensionService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileClassFileExtensionService.java): `createFileClassFileExtension`
- [`code/backend/src/main/java/de/gebiter/file/service/FileClassService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileClassService.java): `createFileClass`, `getFileClass`, `getAllFileClass`, `changeFileClass`, `doCreateFileClass`, `doGetFileClass`
- [`code/backend/src/main/java/de/gebiter/file/service/FileUploadService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileUploadService.java): `doUploadFromMultipart`, `doCheckInFile`, `getRequiredFileClassKey`, `requireCurrentUsersHasOneOf`

## Verwendung im Frontend

- [`code/frontend/src/admin/Admin.tsx`](../../code/frontend/src/admin/Admin.tsx): (Typ)
- [`code/frontend/src/admin/fileclass/EditFileClassTab.tsx`](../../code/frontend/src/admin/fileclass/EditFileClassTab.tsx): `EditFileClassTab`, `loadFileClass`, `handleSave`, `handleCancel`
- [`code/frontend/src/admin/fileclass/FileClassAccessRoleMatrixTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassAccessRoleMatrixTab.tsx): `getServerCellValue`, `reloadServerFileClassAccessRoles`, `saveFileClassAccessCell`, `saveFileClassAccessRoleChanges`, `handleCellClick`, `handleCellPaint`, `getShownCellValue`, `isShownMarked`, `getShownMarkText`, `getCellClassName`, `getCellLabel`
- [`code/frontend/src/admin/fileclass/FileClassDestinationTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassDestinationTab.tsx): `getFileClassKey`, `FileClassDestinationTab`, `toggleAssignment`
- [`code/frontend/src/admin/fileclass/FileClassFileExtensionMatrixTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassFileExtensionMatrixTab.tsx): `getFileClassKey`, `FileClassFileExtensionMatrixTab`, `isEnabledInBackend`, `reloadServerFileClassFileExtensions`, `saveFileClassFileExtensionChanges`, `isShownEnabled`, `isPending`, `getShownEnabledCount`, `handleCellClick`, `handleCellPaint`, `isMarked`, `getCellContent`, `getCellClassName`, `getRowClassName`, `getCellLabel`, `renderRowHeader`, `renderColumnHeader`
- [`code/frontend/src/admin/fileclass/FileClassForm.tsx`](../../code/frontend/src/admin/fileclass/FileClassForm.tsx): `FileClassForm`, `createEnteredFileClass`
- [`code/frontend/src/admin/fileclass/FileClassTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassTab.tsx): `FileClassTab`, `handleNewFileClass`, `handleEdit`, `renderAccessRoleBadges`, `renderFileExtensionBadges`
- [`code/frontend/src/admin/fileclass/NewFileClassTab.tsx`](../../code/frontend/src/admin/fileclass/NewFileClassTab.tsx): `NewFileClassTab`, `handleSave`, `handleCancel`
- [`code/frontend/src/admin/fileclass/fileClassPaths.ts`](../../code/frontend/src/admin/fileclass/fileClassPaths.ts): (Typ)
- [`code/frontend/src/admin/fileextension/FileExtensionTab.tsx`](../../code/frontend/src/admin/fileextension/FileExtensionTab.tsx): (Typ)
- [`code/frontend/src/badge/LookBadge.tsx`](../../code/frontend/src/badge/LookBadge.tsx): (Typ)
- [`code/frontend/src/components/NewEntityButton.tsx`](../../code/frontend/src/components/NewEntityButton.tsx): (Typ)
- [`code/frontend/src/file/FileClassAccessRole.ts`](../../code/frontend/src/file/FileClassAccessRole.ts): (Typ)
- [`code/frontend/src/file/FileClassBadge.tsx`](../../code/frontend/src/file/FileClassBadge.tsx): (Typ)
- [`code/frontend/src/file/FileClassDestination.ts`](../../code/frontend/src/file/FileClassDestination.ts): (Typ)
- [`code/frontend/src/file/FileClassFileExtension.ts`](../../code/frontend/src/file/FileClassFileExtension.ts): (Typ)
- [`code/frontend/src/file/FileClassHint.tsx`](../../code/frontend/src/file/FileClassHint.tsx): (Typ)
- [`code/frontend/src/file/FileClassPicker.tsx`](../../code/frontend/src/file/FileClassPicker.tsx): `getDisplayNameOrKey`, `compareFileClassesByListingPosition`
- [`code/frontend/src/file/document/FileDocumentDetailPage.tsx`](../../code/frontend/src/file/document/FileDocumentDetailPage.tsx): `FileDocumentDetailPage`, `labelOf`, `findSolrField`, `isFieldEditable`, `handleConfirmDelete`, `handleVisibilityChange`, `renderEditors`, `renderAccessRoles`
- [`code/frontend/src/file/document/FileDocumentFieldValue.tsx`](../../code/frontend/src/file/document/FileDocumentFieldValue.tsx): (Typ)
- [`code/frontend/src/file/isFileDocumentChangeableByCurrentUsers.ts`](../../code/frontend/src/file/isFileDocumentChangeableByCurrentUsers.ts): (Typ)
- [`code/frontend/src/file/upload/FileUploadForm.tsx`](../../code/frontend/src/file/upload/FileUploadForm.tsx): `FileUploadForm`, `handleUpload`
- [`code/frontend/src/file/upload/FileUploadRowStatus.tsx`](../../code/frontend/src/file/upload/FileUploadRowStatus.tsx): (Typ)
- [`code/frontend/src/file/useFileClass.ts`](../../code/frontend/src/file/useFileClass.ts): `useFileClass`, `createFileClass`, `getFileClass`, `getAllFileClass`, `changeFileClass`
- [`code/frontend/src/file/useFileClassAccessRole.ts`](../../code/frontend/src/file/useFileClassAccessRole.ts): `useFileClassAccessRole`, `createFileClassAccessRole`, `getAllFileClassAccessRole`, `changeFileClassAccessRole`
- [`code/frontend/src/file/useFileClassDestinationAssignment.ts`](../../code/frontend/src/file/useFileClassDestinationAssignment.ts): `useFileClassDestinationAssignment`
- [`code/frontend/src/file/useFileClassFileExtension.ts`](../../code/frontend/src/file/useFileClassFileExtension.ts): `useFileClassFileExtension`
- [`code/frontend/src/file/useFileDocument.ts`](../../code/frontend/src/file/useFileDocument.ts): `useFileDocument`, `uploadFile`, `getFileDocumentExistence`, `searchFileFieldValues`, `resolveFileAnalysisProgress`, `getFileDocumentForClient`
- [`code/frontend/src/filemanager/fileManagerPaths.ts`](../../code/frontend/src/filemanager/fileManagerPaths.ts): (Typ)
- [`code/frontend/src/filemanager/files/FileDocumentListTab.tsx`](../../code/frontend/src/filemanager/files/FileDocumentListTab.tsx): `FileDocumentListTab`, `loadFileDocumentPage`, `handleFileClassChange`, `changePage`
- [`code/frontend/src/filemanager/upload/FileUploadTab.tsx`](../../code/frontend/src/filemanager/upload/FileUploadTab.tsx): `FileUploadTab`
- [`code/frontend/src/gallery/GalleryUploadBox.tsx`](../../code/frontend/src/gallery/GalleryUploadBox.tsx): `GalleryUploadBox`, `uploadFileIntoThisGallery`
- [`code/frontend/src/gallery/useGallery.ts`](../../code/frontend/src/gallery/useGallery.ts): `useGallery`, `createOwnGallery`
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
- [`code/frontend/src/solrmanager/solrFieldColumnHints.tsx`](../../code/frontend/src/solrmanager/solrFieldColumnHints.tsx): (Typ)
