import { useCallback } from 'react'
import type { ValueSuggestion } from '../components/ValuesInput.tsx'
import { useMasterData } from '../masterdata/useMasterData.ts'
import type { SolrField } from '../solr/SolrField.ts'
import { normalizeTag } from './normalizeTag.ts'
import { useFileDocument } from './useFileDocument.ts'

/** Was die Eingabe eines Feldes im File-Kern zusätzlich bekommt: Vervollständigung und einheitliche Form je Wert. */
export type FileFieldInputHelpers = {
  /** Bei mehrwertigen Feldern mit Suggest-Zwilling (z. B. Tags): vorhandene Werte zum Getippten, sonst `undefined`. */
  getSearchSuggestions: (solrField: SolrField) => ((typedText: string) => Promise<ValueSuggestion[]>) | undefined
  /** Bei den Tags: ohne Raute, wie das Backend sie speichert; sonst `undefined`. */
  getNormalizeValue: (solrField: SolrField) => ((value: string) => string) | undefined
}

/**
 * Die Hilfen für Eingaben von Feldern des File-Kerns, an einer Stelle für Upload-Liste und Bearbeiten-Maske: Tags (und
 * jedes andere mehrwertige Feld mit Suggest-Zwilling) bekommen die Vorschläge aus der Feldwert-Suche, Tags dazu ihre
 * einheitliche Form ohne Raute.
 */
export function useFileFieldInputHelpers(): FileFieldInputHelpers {
  const { fileSolrFieldNameSet } = useMasterData()
  const searchHook = useFileDocument()
  const searchFileFieldValues = searchHook.searchFileFieldValues

  const getSearchSuggestions = useCallback(
    (solrField: SolrField) => {
      if (!solrField.suggestTwin || !solrField.multiValued) {
        return undefined
      }
      return async (typedText: string): Promise<ValueSuggestion[]> => {
        const fieldValueSuggestions = await searchFileFieldValues(solrField.name, typedText)
        return (fieldValueSuggestions ?? []).map((fieldValueSuggestion) => {
          let hint = fieldValueSuggestion.fileCount + ' Dateien'
          if (fieldValueSuggestion.fileCount === 1) {
            hint = '1 Datei'
          }
          return { value: fieldValueSuggestion.value, hint }
        })
      }
    },
    [searchFileFieldValues],
  )

  const getNormalizeValue = useCallback(
    (solrField: SolrField) => {
      if (fileSolrFieldNameSet === null || solrField.name !== fileSolrFieldNameSet.tags) {
        return undefined
      }
      return normalizeTag
    },
    [fileSolrFieldNameSet],
  )

  return { getSearchSuggestions, getNormalizeValue }
}
