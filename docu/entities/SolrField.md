# SolrField

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Ein Feld eines Solr-Kerns, so wie wir es in Postgres definieren: Name, Typ, die Schalter für Solr, die Zwillinge, wer das Feld in einer Antwort bekommt, wer es setzen darf und wie schwer es in der Suche wiegt. Je Kern ist jeder Name nur einmal vergeben. Den Kern nennt `solrCoreKey`, einer der Kerne aus `gebiter.solr.core-keys`.

- **Tabelle:** `solr_field`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/solr/model/SolrField.java`](../../code/backend/src/main/java/de/gebiter/solr/model/SolrField.java)
- **Frontend-Typ:** [`code/frontend/src/solr/SolrField.ts`](../../code/frontend/src/solr/SolrField.ts)
- **DTOs:** `FileSolrFieldNameSet`, `SolrFieldListingOrder`

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.

```json
{
  "id": 1,
  "solrCoreKey": "BEISPIEL_KEY",
  "name": "Beispielname",
  "type": "STRING",
  "indexed": false,
  "stored": false,
  "multiValued": false,
  "docValues": false,
  "required": false,
  "suggestTwin": false,
  "ngramTwin": false,
  "clientValueAccepted": false,
  "searchWeight": 0,
  "readerAccessRoleKey": "USER",
  "displayName": {
    "de": "Beispiel"
  },
  "description": {
    "de": "Beispiel"
  },
  "listingPosition": 0,
  "solrReferenceKey": "BEISPIEL_KEY"
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, automatisch | ja |  |
| `solrCoreKey` | `String` | Pflicht, max. 100 Zeichen, Spalte `solr_core_key`, unveränderlich | ja | Zu welchem Kern das Feld gehört. |
| `name` | `String` | Pflicht, max. 100 Zeichen | ja | Der Feldname in Solr, nach der Feldnamen-Regel (`Helper.requireValidSolrFieldName`), z. B. `authorUsersGuid`. |
| `type` | `SolrFieldType` | Enum als Text, Pflicht, max. 30 Zeichen | ja | Der Feldtyp in Solr aus dem Katalog `SolrFieldType`, z. B. STRING oder TEXT_SUCHE. |
| `indexed` | `boolean` | Pflicht | ja | Solr: Kann man nach dem Feld suchen, filtern, sortieren? |
| `stored` | `boolean` | Pflicht | ja | Solr: Liefert Solr den Wert zurück? |
| `multiValued` | `boolean` | Pflicht | ja | Solr: Darf das Feld mehrere Werte haben? |
| `docValues` | `boolean` | Pflicht | ja | Solr: Spaltenspeicher für schnelles Sortieren und Facetten. |
| `required` | `boolean` | Pflicht | ja | Solr: Muss jedes Dokument das Feld haben? |
| `suggestTwin` | `boolean` | Pflicht | ja | Zwilling `<name>Suggest` für die Vervollständigung beim Tippen, Solr füllt ihn per copyField. Nur bei Typen, die ihn erlauben (`SolrFieldType.isSuggestTwinAllowed()`). |
| `ngramTwin` | `boolean` | Pflicht | ja | Zwilling `<name>Ngram`, in dem jedes Stück ab 3 Zeichen trifft, an jeder Stelle des Werts. Das Feld selbst bleibt, wie es ist. Nur bei Werten mit Text (`SolrFieldType.isNgramTwinAllowed()`). |
| `clientValueAccepted` | `boolean` | Pflicht | ja | Vom Client übernehmbar: Schickt der Client beim Upload oder Bearbeiten einen Wert für das Feld mit, nimmt das Backend ihn an. Ein Kann, kein Muss: Ohne Wert bleibt das Feld leer oder bekommt den Wert des Backends. Aus heißt: Der Wert kommt nie vom Client, er fällt still weg; das Backend oder die Auswertung (Tika) ist Herr der Information. Nur in Postgres, nie in Solr. |
| `searchWeight` | `int` | Pflicht | ja | Gewicht in der Freitextsuche: -1 nicht durchsucht, 0 durchsucht ohne Punkte (ein Treffer zählt, ordnet aber nicht), ab 1 das Gewicht. Ab 0 nur mit `indexed`. Nur in Postgres, nie in Solr. |
| `readerAccessRoleKey` | `String` |  | ja | Der Key des einen Rechts, mit dem man das Feld in einer Antwort des Backends bekommt („Wer liest“). Wer es nicht hat, bekommt das Feld nicht. `null` heißt: kein User bekommt es (nur das Backend selbst nutzt es, z. B. `sftpPath`). |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename als JSON, z. B. `{"de": "Besitzer"`}. |
| `description` | `Map<String, String>` | jsonb | ja | Mehrsprachige Beschreibung als JSON: wozu das Feld da ist und was hineingehört. |
| `listingPosition` | `int` | Pflicht | ja | Reihenfolge in der Feldtabelle des Kerns, nicht eindeutig. |
| `solrReferenceKey` | `String` | max. 100 Zeichen | ja | Gesetzt nur an der Zeile einer Referenz: ihr Key. `null` bei einem normalen Feld. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| GET | `/api/file-document/field-name-set` | [`FileDocumentController.getFileSolrFieldNameSet`](../../code/backend/src/main/java/de/gebiter/file/controller/FileDocumentController.java) | `FileSolrFieldNameSet` |
| POST | `/api/admin/solr-field` | [`SolrFieldAdminController.createSolrField`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldAdminController.java) | `SolrField` |
| GET | `/api/admin/solr-field/{id}` | [`SolrFieldAdminController.getSolrField`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldAdminController.java) | `SolrField` |
| GET | `/api/admin/solr-field` | [`SolrFieldAdminController.getAllSolrField`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldAdminController.java) | `SolrField` |
| PUT | `/api/admin/solr-field` | [`SolrFieldAdminController.changeSolrField`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldAdminController.java) | `SolrField` |
| PUT | `/api/admin/solr-field/listing-position` | [`SolrFieldAdminController.changeSolrFieldListingPositions`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldAdminController.java) | `SolrField`, `SolrFieldListingOrder` |
| DELETE | `/api/admin/solr-field` | [`SolrFieldAdminController.deleteSolrField`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldAdminController.java) | `SolrField` |
| GET | `/api/solr-field/solr-core/{solrCoreKey}` | [`SolrFieldController.getSolrFieldBySolrCoreKey`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldController.java) | `SolrField` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/file/service/FileDocumentSearchService.java`](../../code/backend/src/main/java/de/gebiter/file/service/FileDocumentSearchService.java): `requireSearchableField`
- [`code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldAdminController.java`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldAdminController.java): `createSolrField`, `getSolrField`, `getAllSolrField`, `changeSolrField`, `changeSolrFieldListingPositions`, `deleteSolrField`
- [`code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldController.java`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrFieldController.java): `getSolrFieldBySolrCoreKey`
- [`code/backend/src/main/java/de/gebiter/solr/repository/SolrFieldRepository.java`](../../code/backend/src/main/java/de/gebiter/solr/repository/SolrFieldRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/solr/service/SolrCoreExportService.java`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrCoreExportService.java): `doExportSolrCore`
- [`code/backend/src/main/java/de/gebiter/solr/service/SolrDocumentFieldService.java`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrDocumentFieldService.java): `convertClientFieldValues`, `getReadableSolrFieldNames`, `getSolrReferenceFieldNames`, `getClientValueAcceptedSolrFieldNames`, `getResolvableSolrFieldNames`, `getClientValueAcceptedSolrFieldsByName`, `convertFieldValue`, `convertSingleValue`
- [`code/backend/src/main/java/de/gebiter/solr/service/SolrFieldService.java`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrFieldService.java): `createSolrField`, `getSolrField`, `getSolrFieldBySolrCoreKey`, `getAllSolrField`, `changeSolrField`, `changeSolrFieldListingPositions`, `deleteSolrField`, `createMissingSolrReferenceFields`, `changeSolrReferenceFields`, `deleteSolrReferenceFields`, `createSolrReferenceField`, `doChangeSolrReferenceFieldReadersAndSearchWeight`, `copyChangeableValues`, `reloadSolrFields`, `doGetSolrField`
- [`code/backend/src/main/java/de/gebiter/solr/service/SolrSchemaSyncService.java`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrSchemaSyncService.java): `doSyncSolrCore`, `planExpectedSolrField`

## Verwendung im Frontend

- [`code/frontend/src/file/FileSolrFieldNameSet.ts`](../../code/frontend/src/file/FileSolrFieldNameSet.ts): (Typ)
- [`code/frontend/src/file/document/FileDocumentDetailPage.tsx`](../../code/frontend/src/file/document/FileDocumentDetailPage.tsx): `FileDocumentDetailPage`, `labelOf`, `findSolrField`, `isFieldEditable`, `renderAccessRoles`, `getHandledFieldNames`
- [`code/frontend/src/file/document/FileDocumentFieldValue.tsx`](../../code/frontend/src/file/document/FileDocumentFieldValue.tsx): `formatSingleValue`
- [`code/frontend/src/file/document/FileFieldEditPopup.tsx`](../../code/frontend/src/file/document/FileFieldEditPopup.tsx): (Typ)
- [`code/frontend/src/file/getFileDocumentHeading.ts`](../../code/frontend/src/file/getFileDocumentHeading.ts): `getFileDocumentTags`, `getFileDocumentHeading`
- [`code/frontend/src/file/isFileDocumentChangeableByCurrentUsers.ts`](../../code/frontend/src/file/isFileDocumentChangeableByCurrentUsers.ts): `isFileDocumentChangeableByCurrentUsers`
- [`code/frontend/src/file/upload/FileAnalysisHoverlayContent.tsx`](../../code/frontend/src/file/upload/FileAnalysisHoverlayContent.tsx): (Typ)
- [`code/frontend/src/file/upload/FileUploadForm.tsx`](../../code/frontend/src/file/upload/FileUploadForm.tsx): `getSolrFieldLabelInCurrentLanguage`, `FileUploadForm`
- [`code/frontend/src/file/upload/FileUploadListRow.tsx`](../../code/frontend/src/file/upload/FileUploadListRow.tsx): (Typ)
- [`code/frontend/src/file/useFileFieldInputHelpers.ts`](../../code/frontend/src/file/useFileFieldInputHelpers.ts): `useFileFieldInputHelpers`, `getSearchSuggestions`, `getNormalizeValue`
- [`code/frontend/src/file/useFileSolrFields.ts`](../../code/frontend/src/file/useFileSolrFields.ts): (Typ)
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts): (Typ)
- [`code/frontend/src/masterdata/useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): `useMasterData`, `reload`
- [`code/frontend/src/solr/SolrFieldValueInput.tsx`](../../code/frontend/src/solr/SolrFieldValueInput.tsx): (Typ)
- [`code/frontend/src/solr/solrFieldInputValue.ts`](../../code/frontend/src/solr/solrFieldInputValue.ts): `getEmptySolrFieldInputValue`, `toSingleSolrClientValue`, `toSolrClientValue`, `createSolrClientFieldValues`, `getSolrFieldLabel`, `toSolrFieldInputValue`, `getClearingSolrClientValue`
- [`code/frontend/src/solr/useSolrField.ts`](../../code/frontend/src/solr/useSolrField.ts): `useSolrField`, `createSolrField`, `getSolrField`, `getSolrFieldBySolrCoreKey`, `getAllSolrField`, `changeSolrField`, `changeSolrFieldListingPositions`
- [`code/frontend/src/solrmanager/NewSolrFieldPopup.tsx`](../../code/frontend/src/solrmanager/NewSolrFieldPopup.tsx): (Typ)
- [`code/frontend/src/solrmanager/SolrCoreFieldsTab.tsx`](../../code/frontend/src/solrmanager/SolrCoreFieldsTab.tsx): `getSolrFieldName`, `SolrCoreFieldsTab`, `loadSolrFields`, `getShownSolrField`, `getShownSolrFields`, `saveSolrFieldOrder`, `findShownSolrField`, `getReaderAccessRole`, `putShownSolrField`, `markSolrFieldSaving`, `saveChangedSolrField`, `handleSwitchChange`, `handleClientValueAcceptedChange`, `openCellEditPopup`, `handleCloseCellEditPopup`, `handleSaveCell`, `handleReaderAccessRolePick`, `handleCloseReadersPopup`, `handleNewSolrFieldOpen`, `handleNewSolrFieldClose`, `handleCreateSolrField`, `handleConfirmDelete`, `handleCloseDeletePopup`, `renderEditableCell`, `renderNameCell`, `renderSwitchCell`, `renderClientValueAcceptedCell`, `renderSearchWeightCell`, `renderReaderCell`, `renderDescriptionCell`, `renderActions`
- [`code/frontend/src/solrmanager/SolrFieldCellEditPopup.tsx`](../../code/frontend/src/solrmanager/SolrFieldCellEditPopup.tsx): `SolrFieldCellEditPopup`
- [`code/frontend/src/solrmanager/solrFieldColumnHints.tsx`](../../code/frontend/src/solrmanager/solrFieldColumnHints.tsx): (Typ)
