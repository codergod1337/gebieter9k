import { useState } from 'react'
import { type BadgeLook, EMPTY_BADGE_LOOK } from '../../badge/BadgeLook.ts'
import { BadgeLookFields } from '../../badge/BadgeLookFields.tsx'
import { BadgeLookPreview } from '../../badge/BadgeLookPreview.tsx'
import { type KeyAndDisplayName, KeyDisplayNameForm } from '../../components/KeyDisplayNameForm.tsx'
import { MultilingualTextInput } from '../../components/MultilingualTextInput.tsx'
import type { FileClass } from '../../file/FileClass.ts'
import { FileClassBadge } from '../../file/FileClassBadge.tsx'
import { DEFAULT_LANGUAGE } from '../../language/activeLanguages.ts'
import { getFilledMultilingualTextOrNull } from '../../language/getFilledMultilingualTextOrNull.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'

type FileClassFormProps = {
  title: string
  /** Der Startstand: beim Anlegen leer, beim Bearbeiten die gespeicherte FileClass. */
  initialFileClass: FileClass
  /** Nur beim Anlegen: Der Key einer bestehenden FileClass ändert sich nie. */
  isKeyEditable: boolean
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  onSave: (fileClass: FileClass) => void
  onCancel: () => void
}

/**
 * Das Formular einer FileClass für Anlegen und Bearbeiten: Key, Anzeigename, Beschreibung und das Aussehen ihrer Kachel
 * (Symbol, Verlauf, Struktur, Effekte, Farben) mit Live-Vorschau, wie beim Achievement. Welche Endungen sie annimmt und
 * wer lesen oder schreiben darf, steht in den beiden Matrizen.
 */
export function FileClassForm({
  title,
  initialFileClass,
  isKeyEditable,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: FileClassFormProps) {
  const [description, setDescription] = useState<MultilingualText>(initialFileClass.description ?? {})
  const [badgeLook, setBadgeLook] = useState<BadgeLook>(initialFileClass.badgeLook ?? EMPTY_BADGE_LOOK)

  function createEnteredFileClass(enteredKeyAndDisplayName: KeyAndDisplayName): FileClass {
    // Ohne Text in der Standardsprache gibt es keine Beschreibung.
    const enteredDescription = getFilledMultilingualTextOrNull(description)
    return {
      key: enteredKeyAndDisplayName.key,
      displayName: enteredKeyAndDisplayName.displayName,
      description: enteredDescription,
      listingPosition: initialFileClass.listingPosition,
      badgeLook,
    }
  }

  function handleSave(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const enteredFileClass = createEnteredFileClass(enteredKeyAndDisplayName)
    onSave(enteredFileClass)
  }

  /** Die Kachel mit den gerade eingegebenen Werten, auf hellem und dunklem Grund; ohne Namen ein Platzhalter. */
  function renderPreview(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const previewFileClass = createEnteredFileClass(enteredKeyAndDisplayName)
    const previewText = getTextInCurrentLanguage(previewFileClass.displayName)
    if (previewText.trim() === '') {
      previewFileClass.displayName = { [DEFAULT_LANGUAGE.code]: 'Anzeigename' }
    }
    return (
      <BadgeLookPreview>
        <FileClassBadge fileClass={previewFileClass} />
      </BadgeLookPreview>
    )
  }

  const extraFields = (
    <>
      <MultilingualTextInput
        controlId="fileClassFormDescription"
        label="Beschreibung: was gehört in diese Dateiart?"
        value={description}
        onChange={setDescription}
        required={false}
      />
      <BadgeLookFields controlId="fileClassBadgeLook" value={badgeLook} onChange={setBadgeLook} />
    </>
  )
  return (
    <KeyDisplayNameForm
      title={title}
      initialKey={initialFileClass.key}
      initialDisplayName={initialFileClass.displayName}
      isKeyEditable={isKeyEditable}
      isSaving={isSaving}
      errorMessage={errorMessage}
      extraFields={extraFields}
      renderPreview={renderPreview}
      onSave={handleSave}
      onCancel={onCancel}
    />
  )
}
