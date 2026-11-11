import { defaultApiClient } from '../api/defaultApiClient.ts'

/**
 * Der Download des ganzen Kerns als JSON (Backup, nur ADMIN): Felddefinitionen, Referenzen und alle Dokumente.
 * Doku: `docu/solr-cores/README.md`.
 */
export function getSolrCoreExportUrl(solrCoreKey: string): string {
  const exportPath = '/api/admin/solr-core/export/' + solrCoreKey
  return defaultApiClient.createUrl(exportPath)
}
