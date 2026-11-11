import { type ChangeEvent, type ReactNode, useState } from 'react'
import Form from 'react-bootstrap/Form'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { EditValuePopup } from './EditValuePopup.tsx'
import type { KeyAndDisplayName } from './KeyDisplayNameForm.tsx'
import { MultilingualTextInput } from './MultilingualTextInput.tsx'

type NewKeyDisplayNamePopupProps = {
  /** z. B. „Neues Recht“ */
  title: string
  isSaving: boolean
  /** Fehler des Anlegens, `null` wenn keiner. Das Popup bleibt dann offen. */
  errorMessage: string | null
  /** Der neue Key und Anzeigename; der Aufrufer legt an und schließt bei Erfolg. */
  onCreate: (enteredKeyAndDisplayName: KeyAndDisplayName) => void
  onClose: () => void
  /** Ein Hinweis unter dem Key, z. B. wofür er steht. */
  keyHint?: ReactNode
  /**
   * Optional unter dem Anzeigenamen: weitere Felder, deren Stand der Aufrufer selbst führt, z. B. die FileClass einer
   * Rubrik des Gebietermarkts.
   */
  extraFields?: ReactNode
  /** Solange in `extraFields` eine Pflichtangabe fehlt: „Speichern“ bleibt gesperrt. */
  extraFieldsIncomplete?: boolean
}

/**
 * Anlegen von allem, was einen Key und einen mehrsprachigen Anzeigenamen hat (Recht, Position, Rang …), im kleinen
 * Popup statt auf eigener Seite. Der Key wird beim Tippen groß geschrieben, geprüft wird im Backend. Weitere Felder
 * kommen über `extraFields` dazu. Global, weil mehrere Tabellen es nutzen.
 */
export function NewKeyDisplayNamePopup({
  title,
  isSaving,
  errorMessage,
  onCreate,
  onClose,
  keyHint,
  extraFields,
  extraFieldsIncomplete = false,
}: NewKeyDisplayNamePopupProps) {
  const [enteredKey, setEnteredKey] = useState<string>('')
  const [displayName, setDisplayName] = useState<MultilingualText>({})

  function handleKeyChange(event: ChangeEvent<HTMLInputElement>) {
    // Keys bestehen nur aus Großbuchstaben, Ziffern und Unterstrichen. Geprüft wird im Backend.
    const typedKey = event.target.value
    const upperCaseKey = typedKey.toUpperCase()
    setEnteredKey(upperCaseKey)
  }

  function handleCreate() {
    onCreate({ key: enteredKey, displayName })
  }

  const saveDisabled = enteredKey.trim() === '' || extraFieldsIncomplete
  let shownKeyHint: ReactNode = 'Großbuchstaben, Ziffern und Unterstriche, Anfang und Ende ein Buchstabe. Ändert sich nie.'
  if (keyHint !== undefined) {
    shownKeyHint = keyHint
  }

  return (
    <EditValuePopup
      title={title}
      isSaving={isSaving}
      errorMessage={errorMessage}
      saveDisabled={saveDisabled}
      onSave={handleCreate}
      onClose={onClose}>
      <Form.Group className="mb-3" controlId="newKeyDisplayNameKey">
        <Form.Label>Key</Form.Label>
        <Form.Control autoFocus value={enteredKey} onChange={handleKeyChange} disabled={isSaving} />
        <Form.Text>{shownKeyHint}</Form.Text>
      </Form.Group>
      <MultilingualTextInput
        controlId="newKeyDisplayNameDisplayName"
        label="Anzeigename"
        value={displayName}
        onChange={setDisplayName}
        disabled={isSaving}
      />
      {extraFields}
    </EditValuePopup>
  )
}
