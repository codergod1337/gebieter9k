import { type ChangeEvent, type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { MultilingualTextInput } from '../../components/MultilingualTextInput.tsx'
import { SubmitButton } from '../../components/SubmitButton.tsx'
import type { FileExtension } from '../../file/FileExtension.ts'
import { getFilledMultilingualTextOrNull } from '../../language/getFilledMultilingualTextOrNull.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'

type FileExtensionFormProps = {
  title: string
  /** Der Startstand: beim Anlegen leer, beim Bearbeiten die gespeicherte Endung. */
  initialFileExtension: FileExtension
  /** Nur beim Anlegen: Eine bestehende Endung ändert sich nie. */
  isExtensionEditable: boolean
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  onSave: (fileExtension: FileExtension) => void
  onCancel: () => void
}

/** Der Wert der Auswahl für „ohne Gruppe“: Ein Key nach der Key-Regel ist nie leer. */
const WITHOUT_FILE_EXTENSION_GROUP_VALUE = ''

/**
 * Das Formular einer Endung für Anlegen und Bearbeiten: die Endung selbst (klein, ohne Punkt, beim Tippen klein
 * geschrieben, geprüft im Backend), Beschreibung, Übergruppe (Auswahl aus den Gruppen der Stammdaten) und ob das Backend
 * ein Vorschaubild rechnet. Den Platz ändert der Griff im Tab „Endungen“.
 */
export function FileExtensionForm({
  title,
  initialFileExtension,
  isExtensionEditable,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: FileExtensionFormProps) {
  const [enteredExtension, setEnteredExtension] = useState<string>(initialFileExtension.extension)
  const [description, setDescription] = useState<MultilingualText>(initialFileExtension.description ?? {})
  const [fileExtensionGroupKey, setFileExtensionGroupKey] = useState<string | null>(
    initialFileExtension.fileExtensionGroupKey,
  )
  const masterDataHook = useMasterData()
  const fileExtensionGroups = masterDataHook.fileExtensionGroups ?? []
  const [imagePreview, setImagePreview] = useState<boolean>(initialFileExtension.imagePreview)

  function handleExtensionChange(event: ChangeEvent<HTMLInputElement>) {
    // Endungen sind klein und ohne Punkt. Ein getippter Punkt am Anfang fällt weg, geprüft wird im Backend.
    const typedExtension = event.target.value
    const lowerCaseExtension = typedExtension.toLowerCase()
    const extensionWithoutLeadingDot = lowerCaseExtension.replace(/^\.+/, '')
    setEnteredExtension(extensionWithoutLeadingDot)
  }

  function handleFileExtensionGroupChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value
    if (selectedValue === WITHOUT_FILE_EXTENSION_GROUP_VALUE) {
      setFileExtensionGroupKey(null)
      return
    }
    setFileExtensionGroupKey(selectedValue)
  }

  function handleImagePreviewChange(event: ChangeEvent<HTMLInputElement>) {
    setImagePreview(event.target.checked)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const enteredDescription = getFilledMultilingualTextOrNull(description)
    const enteredFileExtension: FileExtension = {
      extension: enteredExtension,
      description: enteredDescription,
      fileExtensionGroupKey,
      listingPosition: initialFileExtension.listingPosition,
      imagePreview,
    }
    onSave(enteredFileExtension)
  }

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
        <Form.Group className="mb-3" controlId="fileExtensionFormExtension">
          <Form.Label>Endung</Form.Label>
          <Form.Control
            value={enteredExtension}
            onChange={handleExtensionChange}
            disabled={!isExtensionEditable}
            required
          />
          <Form.Text>Kleine Buchstaben und Ziffern ohne Punkt, z. B. jpg. Lässt sich später nicht mehr ändern.</Form.Text>
        </Form.Group>
        <MultilingualTextInput
          controlId="fileExtensionFormDescription"
          label="Beschreibung"
          value={description}
          onChange={setDescription}
          required={false}
        />
        <Form.Group className="mb-3" controlId="fileExtensionFormGroup">
          <Form.Label>Gruppe</Form.Label>
          <Form.Select
            value={fileExtensionGroupKey ?? WITHOUT_FILE_EXTENSION_GROUP_VALUE}
            onChange={handleFileExtensionGroupChange}>
            <option value={WITHOUT_FILE_EXTENSION_GROUP_VALUE}>ohne Gruppe</option>
            {fileExtensionGroups.map((fileExtensionGroup) => {
              const fileExtensionGroupName = getTextInCurrentLanguage(fileExtensionGroup.displayName)
              return (
                <option key={fileExtensionGroup.key} value={fileExtensionGroup.key}>
                  {fileExtensionGroupName}
                </option>
              )
            })}
          </Form.Select>
          <Form.Text>Für die Verwaltung: Katalog und Matrix zeigen die Endungen nach Gruppen.</Form.Text>
        </Form.Group>
        <Form.Check
          type="switch"
          id="fileExtensionFormImagePreview"
          label="Vorschaubild rechnen (PNG 200 × 200)"
          checked={imagePreview}
          onChange={handleImagePreviewChange}
        />
      </ContentBox>
    </Form>
  )
}
