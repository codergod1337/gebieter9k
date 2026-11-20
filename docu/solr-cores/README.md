# Solr-Kerne

Je Kern eine Doku mit allen Feldern (Regel des Nutzers vom 2026-11-09), erzeugt aus einem Export des Kerns:

- [FILE](FILE.md): die Dateien (Upload, Galerie, File-Manager).

Die Kerne selbst stehen in der `application.yaml` (`gebiter.solr.core-keys`), ihre Felder in Postgres (`solr_field`,
gepflegt im Solr-Manager). Solr baut sein Schema daraus (`SolrSchemaSyncService`).

## Abgleich des Schemas

Solr baut sein Schema aus `solr_field`. Der Abgleich läuft beim Start des Backends; der Admin kann ihn auch von
Hand anstoßen (Solr-Manager). Beide Endpunkte nur für ADMIN
([`SolrSyncAdminController`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrSyncAdminController.java),
[`SolrSchemaSyncService`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrSchemaSyncService.java)):

- `GET /api/admin/solr-sync`: die letzten Berichte je Kern. Fehlt ein Kern, lief sein Abgleich noch nicht.
- `POST /api/admin/solr-sync`: jetzt abgleichen. Body `{"solrCoreKey": "FILE"}` für einen Kern, `{}` für alle;
  zurück kommen alle Berichte.

## Export (Backup)

- **Endpunkt:** `GET /api/admin/solr-core/export/<KERN>`, nur ADMIN
  ([`SolrCoreAdminController.exportSolrCore`](../../code/backend/src/main/java/de/gebiter/solr/controller/SolrCoreAdminController.java),
  [`SolrCoreExportService`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrCoreExportService.java)).
  Im Solr-Manager der Knopf „Exportieren“ am Kern.
- **Datei:** `solr-core-<KERN>-<Zeitpunkt>.json`:

```json
{
  "formatVersion": 1,
  "solrCoreKey": "FILE",
  "exportedAt": "2026-11-09T15:39:15.027Z",
  "solrFields": [ { "name": "id", "type": "STRING", "indexed": true, "...": "..." } ],
  "solrReferences": [ { "key": "wtf", "...": "..." } ],
  "documents": [ { "id": "dd1c42…", "fileName": "DSC09158.jpg", "tags": ["beach", "sky"], "...": "..." } ]
}
```

- Die Dokumente kommen mit allen Feldern, die eine Definition haben, ohne Zwillinge und `_version_` (die baut Solr
  beim Einspielen selbst). Zeitpunkte als ISO-Text. Gelesen wird seitenweise mit Cursor
  (`gebiter.solr.export.batch-size`), der Speicher hängt nicht an der Größe des Kerns.
- **Einspielen (Recovery):** kommt später; das Format trägt dafür `formatVersion`
  (`gebiter.solr.export.format-version`).

## Doku neu erzeugen

Export herunterladen, dann:

```
python3 docu/tools/generate_entity_docs.py --solr-export FILE=/pfad/zum/solr-core-FILE-….json
```
