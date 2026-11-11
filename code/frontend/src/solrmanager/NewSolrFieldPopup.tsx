import { type ChangeEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { EditValuePopup } from '../components/EditValuePopup.tsx'
import { MultilingualTextInput } from '../components/MultilingualTextInput.tsx'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { type NewSolrField, SOLR_FIELD_TYPE_OPTIONS, type SolrFieldType } from '../solr/SolrField.ts'

type NewSolrFieldPopupProps = {
  solrCoreKey: string
  isSaving: boolean
  /** Fehler des Anlegens, `null` wenn keiner. */
  errorMessage: string | null
  /** Das neue Feld; der Aufrufer legt es an und schließt bei Erfolg. */
  onCreate: (newSolrField: NewSolrField) => void
  onClose: () => void
}

/**
 * Ein neues Feld anlegen, im kleinen Popup statt auf eigener Seite: nur Name, Typ und Anzeigename. Alles andere hat
 * Startwerte (indexed und stored an, nicht vom Client, nicht durchsucht, niemand liest) und wird danach direkt in
 * der Zeile geändert.
 */
export function NewSolrFieldPopup({ solrCoreKey, isSaving, errorMessage, onCreate, onClose }: NewSolrFieldPopupProps) {
  const [name, setName] = useState<string>('')
  const [type, setType] = useState<SolrFieldType>('STRING')
  const [displayName, setDisplayName] = useState<MultilingualText>({})

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredName = event.target.value
    setName(enteredName)
  }

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedType = event.target.value as SolrFieldType
    setType(selectedType)
  }

  function handleCreate() {
    const newSolrField: NewSolrField = {
      solrCoreKey,
      name,
      // Die Zeile einer Referenz legt nur das Backend an
      solrReferenceKey: null,
      type,
      indexed: true,
      stored: true,
      multiValued: false,
      docValues: false,
      required: false,
      suggestTwin: false,
      ngramTwin: false,
      clientValueAccepted: false,
      searchWeight: -1,
      readerAccessRoleKey: null,
      displayName,
      description: null,
      listingPosition: 0,
    }
    onCreate(newSolrField)
  }

  const popupTitle = 'Neues Feld in ' + solrCoreKey
  const saveDisabled = name.trim() === ''

  return (
    <EditValuePopup
      title={popupTitle}
      isSaving={isSaving}
      errorMessage={errorMessage}
      saveDisabled={saveDisabled}
      onSave={handleCreate}
      onClose={onClose}>
      <Form.Group className="mb-3" controlId="newSolrFieldName">
        <Form.Label>Name in Solr</Form.Label>
        <Form.Control autoFocus value={name} onChange={handleNameChange} disabled={isSaving} />
        <Form.Text>Anfang ein kleiner Buchstabe, dann Buchstaben und Ziffern, z. B. authorUsersGuid.</Form.Text>
      </Form.Group>
      <Form.Group className="mb-3" controlId="newSolrFieldType">
        <Form.Label>Typ</Form.Label>
        <Form.Select value={type} onChange={handleTypeChange} disabled={isSaving}>
          {SOLR_FIELD_TYPE_OPTIONS.map((typeOption) => (
            <option key={typeOption.type} value={typeOption.type}>
              {typeOption.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <MultilingualTextInput
        controlId="newSolrFieldDisplayName"
        label="Anzeigename"
        value={displayName}
        onChange={setDisplayName}
        disabled={isSaving}
      />
    </EditValuePopup>
  )
}
