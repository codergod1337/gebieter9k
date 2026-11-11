# SolrReference

> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.

Eine Referenz, bei uns der Name für die Hooks der Vorlage: ein Feld mit festem Aufbau (exakter Wert, mehrfach, filterbar, Vervollständigung), das in JEDEM Kern gleich heißt und so über Kerne hinweg auffindbar macht. Erste Referenz ist `wtf`: beliebige Markierungen an einem Dokument, z. B. `PROFILE_BANNER`.

- **Tabelle:** `solr_reference`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/solr/model/SolrReference.java`](../../code/backend/src/main/java/de/gebiter/solr/model/SolrReference.java)

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
  "listingPosition": 0
}
```

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `key` | `String` | Primärschlüssel, Pflicht, max. 100 Zeichen, Spalte `solr_reference_key`, unveränderlich | ja | Der Name des Feldes in Solr (Feldnamen-Regel), z. B. `wtf`. Ändert sich nie. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename als JSON, z. B. `{"de": "WTF"`}. |
| `description` | `Map<String, String>` | jsonb | ja | Mehrsprachige Beschreibung: wofür die Referenz da ist und welche Werte hineingehören. |
| `listingPosition` | `int` | Pflicht | ja | Platz in Listen und in der Feldtabelle jedes Kerns (unter den Feldern), ab 1. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/solr-reference` | [`SolrReferenceAdminController.createSolrReference`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrReferenceAdminController.java) | `SolrReference` |
| GET | `/api/admin/solr-reference/{solrReferenceKey}` | [`SolrReferenceAdminController.getSolrReference`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrReferenceAdminController.java) | `SolrReference` |
| GET | `/api/admin/solr-reference` | [`SolrReferenceAdminController.getAllSolrReference`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrReferenceAdminController.java) | `SolrReference` |
| PUT | `/api/admin/solr-reference` | [`SolrReferenceAdminController.changeSolrReference`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrReferenceAdminController.java) | `SolrReference` |
| DELETE | `/api/admin/solr-reference` | [`SolrReferenceAdminController.deleteSolrReference`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrReferenceAdminController.java) | `SolrReference` |

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/solr/controller/SolrReferenceAdminController.java`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrReferenceAdminController.java): `createSolrReference`, `getSolrReference`, `getAllSolrReference`, `changeSolrReference`, `deleteSolrReference`
- [`code/backend/src/main/java/de/gebiter/solr/repository/SolrReferenceRepository.java`](../../code/backend/src/main/java/de/gebiter/solr/repository/SolrReferenceRepository.java): (Import, Felder)
- [`code/backend/src/main/java/de/gebiter/solr/service/SolrCoreExportService.java`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrCoreExportService.java): `doExportSolrCore`
- [`code/backend/src/main/java/de/gebiter/solr/service/SolrFieldService.java`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrFieldService.java): `createMissingSolrReferenceFields`, `changeSolrReferenceFields`, `createSolrReferenceField`
- [`code/backend/src/main/java/de/gebiter/solr/service/SolrReferenceService.java`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrReferenceService.java): `createSolrReference`, `getSolrReference`, `getAllSolrReference`, `changeSolrReference`, `deleteSolrReference`, `createMissingSolrReferenceFieldsOfAllSolrReferences`, `doGetSolrReference`

## Verwendung im Frontend

Keine: Das Frontend kennt die Entity nicht.
