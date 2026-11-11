import { type KeyAndDisplayName, KeyDisplayNameForm } from '../../components/KeyDisplayNameForm.tsx'
import type { FileExtensionGroup } from '../../file/FileExtensionGroup.ts'

type FileExtensionGroupFormProps = {
  /** Titel der ContentBox, z. B. „neue Gruppe“. */
  title: string
  /** Der Startstand: beim Anlegen leer, beim Bearbeiten die gespeicherte Gruppe. */
  initialFileExtensionGroup: FileExtensionGroup
  /** Nur beim Anlegen: Der Key einer bestehenden Gruppe ändert sich nie. */
  isKeyEditable: boolean
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  onSave: (fileExtensionGroup: FileExtensionGroup) => void
  onCancel: () => void
}

/** Das Formular einer Gruppe für Anlegen und Bearbeiten: Key und Anzeigename. Den Platz ändert der Griff im Tab. */
export function FileExtensionGroupForm({
  title,
  initialFileExtensionGroup,
  isKeyEditable,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: FileExtensionGroupFormProps) {
  function handleSave(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const enteredFileExtensionGroup: FileExtensionGroup = {
      key: enteredKeyAndDisplayName.key,
      displayName: enteredKeyAndDisplayName.displayName,
      listingPosition: initialFileExtensionGroup.listingPosition,
    }
    onSave(enteredFileExtensionGroup)
  }

  return (
    <KeyDisplayNameForm
      title={title}
      initialKey={initialFileExtensionGroup.key}
      initialDisplayName={initialFileExtensionGroup.displayName}
      isKeyEditable={isKeyEditable}
      isSaving={isSaving}
      errorMessage={errorMessage}
      onSave={handleSave}
      onCancel={onCancel}
    />
  )
}
