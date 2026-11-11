import { useState } from 'react'
import { EditValuePopup } from '../../components/EditValuePopup.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { SolrField } from '../../solr/SolrField.ts'
import {
  getClearingSolrClientValue,
  getSolrFieldLabel,
  type SolrFieldInputValue,
  toSolrClientValue,
  toSolrFieldInputValue,
} from '../../solr/solrFieldInputValue.ts'
import { SolrFieldValueInput } from '../../solr/SolrFieldValueInput.tsx'
import type { FileDocument } from '../FileDocument.ts'
import { useFileDocument } from '../useFileDocument.ts'
import { useFileFieldInputHelpers } from '../useFileFieldInputHelpers.ts'
import { useFileManagerOrAdmin } from '../useFileManagerOrAdmin.ts'

type FileFieldEditPopupProps = {
  fileDocumentId: string
  solrField: SolrField
  /** Der gespeicherte Wert im Dokument. */
  storedValue: unknown
  /** Nach dem Speichern: Der Aufrufer lädt die Datei neu. */
  onSaved: () => Promise<void>
  onClose: () => void
}

/**
 * Ein einzelnes Feld einer Datei bearbeiten, als kleines Popup (Nutzer 2026-11-09: statt einer Bearbeiten-Seite): ein
 * Klick auf Tags, Beschreibung, Dateiname oder ein anderes Feld öffnet es nur für dieses Feld. Tags (und jedes
 * mehrwertige Feld mit Suggest-Zwilling, z. B. `wtf`) mit Vervollständigung, Tags ohne Raute. Gespeichert wird nur
 * dieses Feld, leer heißt herausnehmen; FILE_MANAGER und ADMIN über ihren Endpunkt, sonst über den eigenen (Autor oder
 * freigegebener Bearbeiter).
 */
export function FileFieldEditPopup({ fileDocumentId, solrField, storedValue, onSaved, onClose }: FileFieldEditPopupProps) {
  const changeHook = useFileDocument()
  const fileManagerOrAdmin = useFileManagerOrAdmin()
  const fileFieldInputHelpers = useFileFieldInputHelpers()
  const [inputValue, setInputValue] = useState<SolrFieldInputValue>(() => toSolrFieldInputValue(solrField, storedValue))
  const displayNameText = getTextInCurrentLanguage(solrField.displayName)
  const fieldLabel = getSolrFieldLabel(solrField, displayNameText)
  const controlId = 'fileFieldEdit-' + solrField.name
  let saveErrorMessage: string | null = null
  if (changeHook.error !== null) {
    saveErrorMessage = changeHook.error.detail
  }

  async function handleSave() {
    let clientValue = toSolrClientValue(solrField, inputValue)
    if (clientValue === undefined) {
      clientValue = getClearingSolrClientValue(solrField)
    }
    const fieldValuesByFieldName = { [solrField.name]: clientValue }
    let changedFileDocument: FileDocument | null
    if (fileManagerOrAdmin) {
      changedFileDocument = await changeHook.changeFileDocument(fileDocumentId, fieldValuesByFieldName)
    } else {
      changedFileDocument = await changeHook.changeOwnFileDocument(fileDocumentId, fieldValuesByFieldName)
    }
    if (changedFileDocument === null) {
      return
    }
    await onSaved()
    onClose()
  }

  return (
    <EditValuePopup
      title={fieldLabel + ' bearbeiten'}
      isSaving={changeHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={() => void handleSave()}
      onClose={onClose}>
      <SolrFieldValueInput
        controlId={controlId}
        solrField={solrField}
        value={inputValue}
        disabled={changeHook.isLoading}
        searchSuggestions={fileFieldInputHelpers.getSearchSuggestions(solrField)}
        normalizeValue={fileFieldInputHelpers.getNormalizeValue(solrField)}
        onChange={setInputValue}
      />
    </EditValuePopup>
  )
}
