# FileExtensionGroup

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Übergruppe der Endungen, z. B. Bilder, Videos oder Dokumente (bei der Vorlage FileExtensionCollection). Sie dient der Verwaltung: Der Tab „Endungen“ und die Matrix FileClass × Endung zeigen die Endungen nach Gruppen, mit Zwischenüberschrift. Welche Gruppe eine Endung hat, steht an der `FileExtension`.

- **Tabelle:** `file_extension_group`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/file/model/FileExtensionGroup.java`](../../code/backend/src/main/java/de/gebiter/file/model/FileExtensionGroup.java)
- **Frontend-Typ:** [`code/frontend/src/file/FileExtensionGroup.ts`](../../code/frontend/src/file/FileExtensionGroup.ts)
- **DTOs:** `FileExtensionGroupDeletedEvent`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "key": "BEISPIEL_KEY",
  "displayName": {
    "de": "Beispiel"
  },
  "listingPosition": 0
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `file_extension_group_key`, unveränderlich | ja | Fester technischer Schlüssel nach der Key-Regel, z. B. `BILD`. Spaltenname mit Präfix, `key` ist SQL. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename als JSON, z. B. `{"de": "Bilder"`}. |
| `listingPosition` | `int` | Pflicht | ja | Platz der Gruppe in Katalog und Matrix, von oben nach unten ab 1. Neue kommen ans Ende. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/file-extension-group` | [`FileExtensionGroupAdminController.createFileExtensionGroup`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupAdminController.java) | `FileExtensionGroup` |
| GET | `/api/admin/file-extension-group/{fileExtensionGroupKey}` | [`FileExtensionGroupAdminController.getFileExtensionGroup`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupAdminController.java) | `FileExtensionGroup` |
| PUT | `/api/admin/file-extension-group` | [`FileExtensionGroupAdminController.changeFileExtensionGroup`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupAdminController.java) | `FileExtensionGroup` |
| PUT | `/api/admin/file-extension-group/listing-position` | [`FileExtensionGroupAdminController.changeFileExtensionGroupListingPositions`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupAdminController.java) | `FileExtensionGroup` |
| DELETE | `/api/admin/file-extension-group` | [`FileExtensionGroupAdminController.deleteFileExtensionGroup`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupAdminController.java) | `FileExtensionGroup` |
| GET | `/api/file-extension-group` | [`FileExtensionGroupController.getAllFileExtensionGroup`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupController.java) | `FileExtensionGroup` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupAdminController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupAdminController.java): `createFileExtensionGroup`, `getFileExtensionGroup`, `changeFileExtensionGroup`, `changeFileExtensionGroupListingPositions`, `deleteFileExtensionGroup`
- [`code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileExtensionGroupController.java): `getAllFileExtensionGroup`
- [`code/backend/src/main/java/de/gebiter/file/repository/FileExtensionGroupRepository.java`](../../code/backend/src/main/java/de/gebiter/file/repository/FileExtensionGroupRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/file/service/FileExtensionGroupService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileExtensionGroupService.java): `createFileExtensionGroup`, `getFileExtensionGroup`, `getAllFileExtensionGroup`, `changeFileExtensionGroup`, `changeFileExtensionGroupListingPositions`, `deleteFileExtensionGroup`, `doCreateFileExtensionGroup`, `doGetAllFileExtensionGroup`, `doGetFileExtensionGroup`

## Verwendung im Frontend

- [`code/frontend/src/admin/fileextension/EditFileExtensionGroupTab.tsx`](../../code/frontend/src/admin/fileextension/EditFileExtensionGroupTab.tsx): `EditFileExtensionGroupTab`, `loadFileExtensionGroup`, `handleSave`
- [`code/frontend/src/admin/fileextension/FileExtensionGroupForm.tsx`](../../code/frontend/src/admin/fileextension/FileExtensionGroupForm.tsx): `FileExtensionGroupForm`, `handleSave`
- [`code/frontend/src/admin/fileextension/FileExtensionGroupTableRow.tsx`](../../code/frontend/src/admin/fileextension/FileExtensionGroupTableRow.tsx): (Typ)
- [`code/frontend/src/admin/fileextension/FileExtensionTab.tsx`](../../code/frontend/src/admin/fileextension/FileExtensionTab.tsx): `getFileExtensionGroupKey`, `FileExtensionTab`, `saveFileExtensionGroupOrder`, `saveFileExtensionOrder`, `handleFileExtensionBlockReorder`, `getFileExtensionCountOfGroup`, `handleNewFileExtensionGroup`, `handleEditFileExtensionGroup`
- [`code/frontend/src/admin/fileextension/NewFileExtensionGroupTab.tsx`](../../code/frontend/src/admin/fileextension/NewFileExtensionGroupTab.tsx): `NewFileExtensionGroupTab`, `handleSave`
- [`code/frontend/src/file/getFileExtensionBlocks.ts`](../../code/frontend/src/file/getFileExtensionBlocks.ts): `getFileExtensionBlocks`
- [`code/frontend/src/file/useFileExtensionGroup.ts`](../../code/frontend/src/file/useFileExtensionGroup.ts): `useFileExtensionGroup`, `createFileExtensionGroup`, `getFileExtensionGroup`, `getAllFileExtensionGroup`, `changeFileExtensionGroup`, `changeFileExtensionGroupListingPositions`
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
