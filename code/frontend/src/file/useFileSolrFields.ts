import { useCallback } from 'react'
import { useLoadedData } from '../api/useLoadedData.ts'
import type { SolrField } from '../solr/SolrField.ts'
import { useSolrField } from '../solr/useSolrField.ts'
import { fileSolrCoreKey } from './fileSolrCoreKey.ts'

/** Die Felddefinitionen des File-Kerns: `null`, solange sie laden; dazu ein Fehler, `null` wenn keiner. */
export type FileSolrFieldsHook = {
  fileSolrFields: SolrField[] | null
  errorMessage: string | null
}

/**
 * Lädt die Felder des File-Kerns (Typ, mehrwertig, wer setzt, Anzeigename) einmal beim Anzeigen. Masken und Ansichten
 * bauen sich daraus, kein Feld steht fest im Frontend.
 */
export function useFileSolrFields(): FileSolrFieldsHook {
  const solrFieldHook = useSolrField()
  const getSolrFieldBySolrCoreKey = solrFieldHook.getSolrFieldBySolrCoreKey
  const loadFileSolrFields = useCallback(() => getSolrFieldBySolrCoreKey(fileSolrCoreKey), [getSolrFieldBySolrCoreKey])
  const loadedFileSolrFields = useLoadedData(loadFileSolrFields)
  let errorMessage: string | null = null
  if (solrFieldHook.error !== null) {
    errorMessage = solrFieldHook.error.detail
  }
  return { fileSolrFields: loadedFileSolrFields.data, errorMessage }
}
