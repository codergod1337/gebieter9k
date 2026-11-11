/**
 * Der Solr-Kern der Dateien aus der Vite-Umgebung (`VITE_FILE_SOLR_CORE_KEY`), nie aus dem Code. Muss zu
 * `gebiter.file.solr-core-key` im Backend passen. Die Masken holen damit die Felder des Kerns.
 */
const fileSolrCoreKeyFromEnvironment = import.meta.env.VITE_FILE_SOLR_CORE_KEY
if (fileSolrCoreKeyFromEnvironment === undefined || fileSolrCoreKeyFromEnvironment === '') {
  throw new Error('VITE_FILE_SOLR_CORE_KEY fehlt in der Vite-Umgebung (.env.development / .env.production).')
}

export const fileSolrCoreKey: string = fileSolrCoreKeyFromEnvironment
