# FileExtension

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Dateiendung, die das System kennt, wie in der Vorlage jede einzeln angelegt. Welche FileClass sie annimmt, steht in `FileClassFileExtension`. Die Endung selbst ist der Schlüssel, nach der Endungs-Regel (`jpg`, `mp4`). Für die Verwaltung gehört sie zu einer Übergruppe (`FileExtensionGroup`, z. B. Bilder) und hat darin einen Platz: Die wichtigen stehen vorn, nicht das Alphabet entscheidet.

- **Tabelle:** `file_extension`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/file/model/FileExtension.java`](../../code/backend/src/main/java/de/gebiter/file/model/FileExtension.java)
- **Frontend-Typ:** [`code/frontend/src/file/FileExtension.ts`](../../code/frontend/src/file/FileExtension.ts)
- **DTOs:** `FileExtensionDeletedEvent`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "extension": "jpg",
  "description": {
    "de": "Beispiel"
  },
  "fileExtensionGroupKey": "BEISPIEL_KEY",
  "listingPosition": 0,
  "imagePreview": false
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `extension` | `String` | Primärschlüssel, Pflicht, max. 20 Zeichen, Spalte `file_extension`, unveränderlich | ja | Die Endung, klein, ohne Punkt. Ändert sich nie. |
| `description` | `Map<String, String>` | jsonb | ja | Mehrsprachige Beschreibung, z. B. `{"de": "JPEG-Bild"`}. Optional. |
| `fileExtensionGroupKey` | `String` | max. 100 Zeichen, Spalte `file_extension_group_key` | ja | Verweis auf `FileExtensionGroup.getKey()`, z. B. `BILD`. `null`: ohne Gruppe. |
| `listingPosition` | `int` | Pflicht | ja | Platz in der Anzeige, von oben nach unten ab 1, über alle Endungen. Innerhalb einer Gruppe bestimmt er die Reihenfolge. Neue kommen ans Ende. |
| `imagePreview` | `boolean` | Pflicht | ja | Rechnet das Backend beim Upload ein Vorschaubild (PNG 200 × 200) für Dateien mit dieser Endung? |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/file-extension` | [`FileExtensionAdminController.createFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionAdminController.java) | `FileExtension` |
| GET | `/api/admin/file-extension/{fileExtension}` | [`FileExtensionAdminController.getFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionAdminController.java) | `FileExtension` |
| PUT | `/api/admin/file-extension` | [`FileExtensionAdminController.changeFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionAdminController.java) | `FileExtension` |
| PUT | `/api/admin/file-extension/listing-position` | [`FileExtensionAdminController.changeFileExtensionListingPositions`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionAdminController.java) | `FileExtension` |
| DELETE | `/api/admin/file-extension` | [`FileExtensionAdminController.deleteFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionAdminController.java) | `FileExtension` |
| GET | `/api/file-extension` | [`FileExtensionController.getAllFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionController.java) | `FileExtension` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/controller/FileExtensionAdminController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionAdminController.java): `createFileExtension`, `getFileExtension`, `changeFileExtension`, `changeFileExtensionListingPositions`, `deleteFileExtension`
- [`code/backend/src/main/java/de/gebiter/file/controller/FileExtensionController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionController.java): `getAllFileExtension`
- [`code/backend/src/main/java/de/gebiter/file/repository/FileExtensionRepository.java`](../../code/backend/src/main/java/de/gebiter/file/repository/FileExtensionRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/file/service/FileAnalysisService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileAnalysisService.java): `isImagePreviewWanted`
- [`code/backend/src/main/java/de/gebiter/file/service/FileExtensionService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileExtensionService.java): `createFileExtension`, `getFileExtension`, `getAllFileExtension`, `changeFileExtension`, `changeFileExtensionListingPositions`, `deleteFileExtension`, `removeFileExtensionGroupFromFileExtensions`, `doCreateFileExtension`, `doGetAllFileExtension`, `doGetFileExtension`

## Verwendung im Frontend

- [`code/frontend/src/admin/fileclass/FileClassFileExtensionMatrixTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassFileExtensionMatrixTab.tsx): `isEnabledInBackend`, `reloadServerFileClassFileExtensions`, `saveFileClassFileExtensionChanges`, `isShownEnabled`
- [`code/frontend/src/admin/fileextension/EditFileExtensionTab.tsx`](../../code/frontend/src/admin/fileextension/EditFileExtensionTab.tsx): `EditFileExtensionTab`, `loadFileExtension`, `handleSave`
- [`code/frontend/src/admin/fileextension/FileExtensionForm.tsx`](../../code/frontend/src/admin/fileextension/FileExtensionForm.tsx): `FileExtensionForm`, `handleExtensionChange`, `handleFileExtensionGroupChange`, `handleImagePreviewChange`, `handleSubmit`
- [`code/frontend/src/admin/fileextension/FileExtensionTab.tsx`](../../code/frontend/src/admin/fileextension/FileExtensionTab.tsx): `getFileExtensionKey`, `FileExtensionTab`, `saveFileExtensionGroupOrder`, `saveFileExtensionOrder`, `handleFileExtensionBlockReorder`, `getFileExtensionCountOfGroup`, `handleNewFileExtensionGroup`, `handleEditFileExtensionGroup`, `handleNewFileExtension`, `handleEditFileExtension`
- [`code/frontend/src/admin/fileextension/FileExtensionTableRow.tsx`](../../code/frontend/src/admin/fileextension/FileExtensionTableRow.tsx): (Typ)
- [`code/frontend/src/admin/fileextension/NewFileExtensionTab.tsx`](../../code/frontend/src/admin/fileextension/NewFileExtensionTab.tsx): `NewFileExtensionTab`, `handleSave`
- [`code/frontend/src/file/getFileExtensionBlocks.ts`](../../code/frontend/src/file/getFileExtensionBlocks.ts): `getFileExtensionBlocks`
- [`code/frontend/src/file/upload/useFileUploadList.ts`](../../code/frontend/src/file/upload/useFileUploadList.ts): (Typ)
- [`code/frontend/src/file/useFileExtension.ts`](../../code/frontend/src/file/useFileExtension.ts): `useFileExtension`, `createFileExtension`, `getFileExtension`, `getAllFileExtension`, `changeFileExtension`, `changeFileExtensionListingPositions`
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
