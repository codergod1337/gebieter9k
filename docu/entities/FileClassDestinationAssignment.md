# FileClassDestinationAssignment

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Welche `FileClass` an welchem Ziel (`FileClassDestination`) angeboten wird, z. B. „Urlaub“ beim Hochladen in eine Galerie. Je Paar höchstens ein Eintrag, lose gekoppelt über den Key. Eine Zelle der Matrix „FileClass × Ziel“.

- **Tabelle:** `file_class_destination_assignment`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/file/model/FileClassDestinationAssignment.java`](../../code/backend/src/main/java/de/gebiter/file/model/FileClassDestinationAssignment.java)
- **Frontend-Typ:** [`code/frontend/src/file/FileClassDestination.ts`](../../code/frontend/src/file/FileClassDestination.ts)

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "fileClassKey": "FOTO_URLAUB",
  "destination": "GALLERY"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `fileClassKey` | `String` | Pflicht, max. 100 Zeichen, unveränderlich | ja | Key der FileClass. |
| `destination` | `FileClassDestination` | Enum als Text, Pflicht, max. 30 Zeichen, unveränderlich | ja | Das Ziel, an dem die FileClass angeboten wird, z. B. die Galerie. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/file-class-destination-assignment` | [`FileClassDestinationAssignmentAdminController.createFileClassDestinationAssignment`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassDestinationAssignmentAdminController.java) | `FileClassDestinationAssignment` |
| GET | `/api/admin/file-class-destination-assignment/{id}` | [`FileClassDestinationAssignmentAdminController.getFileClassDestinationAssignment`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassDestinationAssignmentAdminController.java) | `FileClassDestinationAssignment` |
| DELETE | `/api/admin/file-class-destination-assignment` | [`FileClassDestinationAssignmentAdminController.deleteFileClassDestinationAssignment`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassDestinationAssignmentAdminController.java) | `FileClassDestinationAssignment` |
| GET | `/api/file-class-destination-assignment` | [`FileClassDestinationAssignmentController.getAllFileClassDestinationAssignment`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassDestinationAssignmentController.java) | `FileClassDestinationAssignment` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/controller/FileClassDestinationAssignmentAdminController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassDestinationAssignmentAdminController.java): `createFileClassDestinationAssignment`, `getFileClassDestinationAssignment`, `deleteFileClassDestinationAssignment`
- [`code/backend/src/main/java/de/gebiter/file/controller/FileClassDestinationAssignmentController.java`](../../code/backend/src/main/java/de/gebiter/file/controller/FileClassDestinationAssignmentController.java): `getAllFileClassDestinationAssignment`
- [`code/backend/src/main/java/de/gebiter/file/repository/FileClassDestinationAssignmentRepository.java`](../../code/backend/src/main/java/de/gebiter/file/repository/FileClassDestinationAssignmentRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/file/service/FileClassDestinationAssignmentService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileClassDestinationAssignmentService.java): `createFileClassDestinationAssignment`, `getFileClassDestinationAssignment`, `getAllFileClassDestinationAssignment`, `deleteFileClassDestinationAssignment`, `doGetFileClassDestinationAssignment`

## Verwendung im Frontend

- [`code/frontend/src/admin/fileclass/FileClassDestinationTab.tsx`](../../code/frontend/src/admin/fileclass/FileClassDestinationTab.tsx): `findAssignment`
- [`code/frontend/src/file/useFileClassDestinationAssignment.ts`](../../code/frontend/src/file/useFileClassDestinationAssignment.ts): `useFileClassDestinationAssignment`, `createFileClassDestinationAssignment`, `getAllFileClassDestinationAssignment`
