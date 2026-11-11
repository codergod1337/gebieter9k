# FileClassFileExtension

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Welche `FileExtension` eine `FileClass` annimmt: Eine Datei lässt sich nur hochladen, wenn ihre Endung für die gewählte FileClass freigeschaltet ist. Je Paar höchstens ein Eintrag, lose gekoppelt über die Keys. Eine Zelle der Matrix „FileClass × Endung“.

- **Tabelle:** `file_class_file_extension`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/file/model/FileClassFileExtension.java`](../../code/backend/src/main/java/de/gebiter/file/model/FileClassFileExtension.java)
- **Frontend-Typ:** [`code/frontend/src/file/FileClassFileExtension.ts`](../../code/frontend/src/file/FileClassFileExtension.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "fileClassKey": "FOTO_URLAUB",
  "fileExtension": "jpg"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `fileClassKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Key der FileClass. |
| `fileExtension` | `String` | Pflicht, max. 20 Zeichen, unveränderlich | ja | Die Endung, die die FileClass annimmt (Key der FileExtension). |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/file-class-file-extension` | [`FileClassFileExtensionAdminController.createFileClassFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassFileExtensionAdminController.java) | `FileClassFileExtension` |
| GET | `/api/admin/file-class-file-extension/{id}` | [`FileClassFileExtensionAdminController.getFileClassFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassFileExtensionAdminController.java) | `FileClassFileExtension` |
| DELETE | `/api/admin/file-class-file-extension` | [`FileClassFileExtensionAdminController.deleteFileClassFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassFileExtensionAdminController.java) | `FileClassFileExtension` |
| GET | `/api/file-class-file-extension` | [`FileClassFileExtensionController.getAllFileClassFileExtension`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassFileExtensionController.java) | `FileClassFileExtension` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/controller/FileClassFileExtensionAdminController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassFileExtensionAdminController.java): `createFileClassFileExtension`, `getFileClassFileExtension`, `deleteFileClassFileExtension`
- [`code/backend/src/main/java/de/gebiter/file/controller/FileClassFileExtensionController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassFileExtensionController.java): `getAllFileClassFileExtension`
- [`code/backend/src/main/java/de/gebiter/file/repository/FileClassFileExtensionRepository.java`](../../code/backend/src/main/java/de/gebiter/file/repository/FileClassFileExtensionRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/file/service/FileClassFileExtensionService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileClassFileExtensionService.java): `createFileClassFileExtension`, `getFileClassFileExtension`, `getAllFileClassFileExtension`, `deleteFileClassFileExtension`, `deleteFileClassFileExtensionsOfDeletedFileExtension`, `doGetFileClassFileExtension`

## Verwendung im Frontend

- [`code/frontend/src/admin/fileclass/FileClassFileExtensionMatrixTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassFileExtensionMatrixTab.tsx): `findFileClassFileExtension`, `FileClassFileExtensionMatrixTab`, `isEnabledInBackend`, `reloadServerFileClassFileExtensions`
- [`code/frontend/src/admin/fileclass/FileClassTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassTab.tsx): (Typ)
- [`code/frontend/src/file/upload/FileUploadForm.tsx`](../../code/frontend/src/file/upload/FileUploadForm.tsx): (Typ)
- [`code/frontend/src/file/useFileClassFileExtension.ts`](../../code/frontend/src/file/useFileClassFileExtension.ts): `useFileClassFileExtension`, `createFileClassFileExtension`, `getAllFileClassFileExtension`
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
