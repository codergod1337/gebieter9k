import { type ChangeEvent, type ReactNode, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { EditValuePopup } from '../components/EditValuePopup.tsx'
import { RangeSlider } from '../components/RangeSlider.tsx'
import { MultilingualTextInput } from '../components/MultilingualTextInput.tsx'
import type { MultilingualText } from '../language/MultilingualText.ts'
import {
  describeSolrFieldSearchWeight,
  isNgramTwinAllowed,
  isSuggestTwinAllowed,
  SOLR_FIELD_SEARCH_WEIGHT_MAX,
  SOLR_FIELD_SEARCH_WEIGHT_MIN,
  SOLR_FIELD_TYPE_OPTIONS,
  type SolrField,
  type SolrFieldType,
} from '../solr/SolrField.ts'

/** Die Zellen eines Feldes, die sich per Popup ändern lassen. Checkboxen und „Wer liest“ haben ihre eigene Bedienung. */
export type SolrFieldEditableCell = 'name' | 'displayName' | 'type' | 'searchWeight' | 'description'

type SolrFieldCellEditPopupProps = {
  solrField: SolrField
  editableCell: SolrFieldEditableCell
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  /** Das Feld mit dem geänderten Wert; der Aufrufer speichert und schließt bei Erfolg. */
  onSave: (changedSolrField: SolrField) => void
  onClose: () => void
}

/**
 * Das kleine Popup zu einer Zelle der Feldtabelle: genau ein Wert, Enter oder „Speichern“ speichert. Es ersetzt die
 * frühere Seite „Feld bearbeiten“. Ein Typ, der einen Zwilling nicht erlaubt, schaltet ihn mit aus, wie es das Backend
 * verlangt.
 */
export function SolrFieldCellEditPopup({
  solrField,
  editableCell,
  isSaving,
  errorMessage,
  onSave,
  onClose,
}: SolrFieldCellEditPopupProps) {
  const [draftSolrField, setDraftSolrField] = useState<SolrField>(solrField)

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredName = event.target.value
    setDraftSolrField((currentSolrField) => ({ ...currentSolrField, name: enteredName }))
  }

  function handleDisplayNameChange(changedDisplayName: MultilingualText) {
    setDraftSolrField((currentSolrField) => ({ ...currentSolrField, displayName: changedDisplayName }))
  }

  function handleDescriptionChange(changedDescription: MultilingualText) {
    setDraftSolrField((currentSolrField) => ({ ...currentSolrField, description: changedDescription }))
  }

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedType = event.target.value as SolrFieldType
    const suggestTwinAllowed = isSuggestTwinAllowed(selectedType)
    const ngramTwinAllowed = isNgramTwinAllowed(selectedType)
    setDraftSolrField((currentSolrField) => ({
      ...currentSolrField,
      type: selectedType,
      suggestTwin: currentSolrField.suggestTwin && suggestTwinAllowed,
      ngramTwin: currentSolrField.ngramTwin && ngramTwinAllowed,
    }))
  }

  function handleSearchWeightChange(changedSearchWeight: number) {
    setDraftSolrField((currentSolrField) => ({ ...currentSolrField, searchWeight: changedSearchWeight }))
  }

  const searchedWithoutIndex = draftSolrField.searchWeight >= 0 && !solrField.indexed

  function handleSave() {
    onSave(draftSolrField)
  }

  let popupTitle = ''
  let editor: ReactNode = null
  let saveDisabled = false
  if (editableCell === 'name') {
    popupTitle = 'Name in Solr'
    saveDisabled = draftSolrField.name.trim() === ''
    editor = (
      <Form.Group controlId="solrFieldCellName">
        <Form.Label>Name von {solrField.name}</Form.Label>
        <Form.Control autoFocus value={draftSolrField.name} onChange={handleNameChange} disabled={isSaving} />
        <Form.Text>Anfang ein kleiner Buchstabe, dann Buchstaben und Ziffern, z. B. authorUsersGuid.</Form.Text>
      </Form.Group>
    )
  } else if (editableCell === 'displayName') {
    popupTitle = 'Anzeigename von ' + solrField.name
    editor = (
      <MultilingualTextInput
        controlId="solrFieldCellDisplayName"
        label="Anzeigename"
        value={draftSolrField.displayName}
        onChange={handleDisplayNameChange}
        disabled={isSaving}
      />
    )
  } else if (editableCell === 'description') {
    popupTitle = 'Beschreibung von ' + solrField.name
    let description: MultilingualText = {}
    if (draftSolrField.description !== null) {
      description = draftSolrField.description
    }
    editor = (
      <MultilingualTextInput
        controlId="solrFieldCellDescription"
        label="Wozu das Feld da ist"
        value={description}
        onChange={handleDescriptionChange}
        required={false}
        disabled={isSaving}
      />
    )
  } else if (editableCell === 'type') {
    popupTitle = 'Typ von ' + solrField.name
    editor = (
      <Form.Group controlId="solrFieldCellType">
        <Form.Label>Typ</Form.Label>
        <Form.Select autoFocus value={draftSolrField.type} onChange={handleTypeChange} disabled={isSaving}>
          {SOLR_FIELD_TYPE_OPTIONS.map((typeOption) => (
            <option key={typeOption.type} value={typeOption.type}>
              {typeOption.label}
            </option>
          ))}
        </Form.Select>
        <Form.Text>Ein Zwilling, den der neue Typ nicht erlaubt, geht dabei aus.</Form.Text>
      </Form.Group>
    )
  } else {
    popupTitle = 'Suchgewicht von ' + solrField.name
    saveDisabled = searchedWithoutIndex
    editor = (
      <>
        <RangeSlider
          id="solrFieldCellSearchWeight"
          label="Gewicht in der Suche"
          value={draftSolrField.searchWeight}
          min={SOLR_FIELD_SEARCH_WEIGHT_MIN}
          max={SOLR_FIELD_SEARCH_WEIGHT_MAX}
          onChange={handleSearchWeightChange}
          describeValue={describeSolrFieldSearchWeight}
          disabled={isSaving}
        />
        {searchedWithoutIndex && (
          <p className="text-danger small mb-0 mt-2">Durchsucht werden kann nur ein Feld mit indexed.</p>
        )}
      </>
    )
  }

  return (
    <EditValuePopup
      title={popupTitle}
      isSaving={isSaving}
      errorMessage={errorMessage}
      saveDisabled={saveDisabled}
      onSave={handleSave}
      onClose={onClose}>
      {editor}
    </EditValuePopup>
  )
}
