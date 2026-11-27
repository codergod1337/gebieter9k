import { type ChangeEvent, type ReactNode, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { EditValuePopup } from './EditValuePopup.tsx'

type EditTextPopupProps = {
  /** z. B. „Bezeichnung von „für Oma““ */
  title: string
  /** Die Beschriftung über dem Eingabefeld, z. B. „Bezeichnung“. */
  inputLabel: string
  initialText: string
  /** Höchstlänge der Eingabe; ohne Angabe unbegrenzt. */
  maxLength?: number
  /** Erklärung unter dem Eingabefeld. */
  hint?: ReactNode
  /**
   * Ob auch ein leerer Text gespeichert werden darf, z. B. um einen freiwilligen Wert herauszunehmen. Standard `false`:
   * Ohne Text ist Speichern gesperrt.
   */
  emptyAllowed?: boolean
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. Das Popup bleibt dann offen. */
  errorMessage: string | null
  /** Der geänderte Text, ohne Leerzeichen außen; der Aufrufer speichert und schließt bei Erfolg. */
  onSave: (changedText: string) => void
  onClose: () => void
}

/**
 * Einen einzeiligen Pflicht-Text direkt aus der Tabellenzeile ändern, z. B. die Bezeichnung einer Galerie-Freigabe: ein
 * Eingabefeld im {@link EditValuePopup}. Solange das Feld leer ist, ist „Speichern“ gesperrt. Global, weil jede Tabelle
 * so einen Text haben kann.
 */
export function EditTextPopup({
  title,
  inputLabel,
  initialText,
  maxLength,
  hint,
  emptyAllowed = false,
  isSaving,
  errorMessage,
  onSave,
  onClose,
}: EditTextPopupProps) {
  const [enteredText, setEnteredText] = useState<string>(initialText)
  const trimmedText = enteredText.trim()

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    setEnteredText(event.target.value)
  }

  function handleSave() {
    onSave(trimmedText)
  }

  return (
    <EditValuePopup
      title={title}
      isSaving={isSaving}
      errorMessage={errorMessage}
      saveDisabled={trimmedText === '' && !emptyAllowed}
      onSave={handleSave}
      onClose={onClose}>
      <Form.Group controlId="editText">
        <Form.Label>{inputLabel}</Form.Label>
        <Form.Control
          type="text"
          autoFocus
          maxLength={maxLength}
          value={enteredText}
          disabled={isSaving}
          onChange={handleTextChange}
        />
        {hint !== undefined && <Form.Text>{hint}</Form.Text>}
      </Form.Group>
    </EditValuePopup>
  )
}
