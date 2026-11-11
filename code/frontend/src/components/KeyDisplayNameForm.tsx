import { type ChangeEvent, type FormEvent, type ReactNode, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { ContentBox } from './ContentBox.tsx'
import { ErrorAlert } from './ErrorAlert.tsx'
import { MultilingualTextInput } from './MultilingualTextInput.tsx'
import { SubmitButton } from './SubmitButton.tsx'

/** Was das Formular beim Speichern liefert. */
export type KeyAndDisplayName = {
  key: string
  displayName: MultilingualText
}

type KeyDisplayNameFormProps = {
  /** Titel der ContentBox, z. B. „neues Recht“. */
  title: string
  initialKey: string
  initialDisplayName: MultilingualText
  /** Nur beim Anlegen: Ein Key ändert sich nie. */
  isKeyEditable: boolean
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  /**
   * Optional unter dem Anzeigenamen: weitere Felder, deren Stand der Aufrufer selbst führt, z. B. Mindestpunkte oder
   * das Aussehen eines Badges.
   */
  extraFields?: ReactNode
  /** Optional unter den Feldern, z. B. die Vorschau eines Badges, mit den gerade eingegebenen Werten. */
  renderPreview?: (enteredKeyAndDisplayName: KeyAndDisplayName) => ReactNode
  onSave: (enteredKeyAndDisplayName: KeyAndDisplayName) => void
  onCancel: () => void
}

/**
 * Das Formular für alles, was einen Key und einen mehrsprachigen Anzeigenamen hat, z. B. ein Recht. Weitere Felder
 * kommen über `extraFields` dazu (Position, Rang, Achievement). Der Key wird beim Tippen groß geschrieben, geprüft wird
 * im Backend. Es speichert nichts selbst, das macht der Aufrufer in
 * `onSave`.
 */
export function KeyDisplayNameForm({
  title,
  initialKey,
  initialDisplayName,
  isKeyEditable,
  isSaving,
  errorMessage,
  extraFields,
  renderPreview,
  onSave,
  onCancel,
}: KeyDisplayNameFormProps) {
  const [enteredKey, setEnteredKey] = useState<string>(initialKey)
  const [displayName, setDisplayName] = useState<MultilingualText>(initialDisplayName)

  function handleKeyChange(event: ChangeEvent<HTMLInputElement>) {
    // Keys bestehen nur aus Großbuchstaben, Ziffern und Unterstrichen. Geprüft wird im Backend.
    const typedKey = event.target.value
    const upperCaseKey = typedKey.toUpperCase()
    setEnteredKey(upperCaseKey)
  }

  function handleDisplayNameChange(changedDisplayName: MultilingualText) {
    setDisplayName(changedDisplayName)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const enteredKeyAndDisplayName: KeyAndDisplayName = { key: enteredKey, displayName }
    onSave(enteredKeyAndDisplayName)
  }

  const currentKeyAndDisplayName: KeyAndDisplayName = { key: enteredKey, displayName }
  const footer = (
    <div className="d-flex justify-content-end gap-2">
      <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
        Abbrechen
      </Button>
      <SubmitButton isSubmitting={isSaving} fullWidth={false}>
        Speichern
      </SubmitButton>
    </div>
  )

  return (
    <Form onSubmit={handleSubmit}>
      <ContentBox title={title} footer={footer}>
        <ErrorAlert message={errorMessage} />
        <Form.Group className="mb-3" controlId="keyDisplayNameFormKey">
          <Form.Label>Key</Form.Label>
          <Form.Control value={enteredKey} onChange={handleKeyChange} disabled={!isKeyEditable} required />
          <Form.Text>
            Großbuchstaben, Ziffern und Unterstriche, Anfang und Ende ein Großbuchstabe. Lässt sich später nicht mehr
            ändern.
          </Form.Text>
        </Form.Group>
        <MultilingualTextInput
          controlId="keyDisplayNameFormDisplayName"
          label="Anzeigename"
          value={displayName}
          onChange={handleDisplayNameChange}
        />
        {extraFields}
        {renderPreview !== undefined && renderPreview(currentKeyAndDisplayName)}
      </ContentBox>
    </Form>
  )
}
