import { useState } from 'react'
import Form from 'react-bootstrap/Form'
import { EditValuePopup } from '../../components/EditValuePopup.tsx'
import type { FileClass } from '../../file/FileClass.ts'
import { FileClassPicker } from '../../file/FileClassPicker.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { SHOP_CATEGORY_TEXTS } from './shopCategoryTexts.ts'

type EditShopCategoryFileClassPopupProps = {
  /** z. B. „FileClass von MEMES“ */
  title: string
  /** Alle FileClasses zur Wahl. */
  fileClasses: FileClass[]
  /** Die FileClass, die die Rubrik gerade hat. */
  initialFileClassKey: string
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. Das Popup bleibt dann offen. */
  errorMessage: string | null
  /** Die gewählte FileClass; der Aufrufer speichert und schließt bei Erfolg. */
  onSave: (fileClassKey: string) => void
  onClose: () => void
}

/**
 * Das kleine Popup, in dem der Admin die FileClass einer Rubrik des Gebietermarkts ändert (Tab „Rubriken“): die
 * Auswahl der Dateiart wie überall ({@link FileClassPicker}), darunter der Hinweis, für welche Dateien die neue gilt.
 */
export function EditShopCategoryFileClassPopup({
  title,
  fileClasses,
  initialFileClassKey,
  isSaving,
  errorMessage,
  onSave,
  onClose,
}: EditShopCategoryFileClassPopupProps) {
  const [selectedFileClassKey, setSelectedFileClassKey] = useState<string>(initialFileClassKey)

  function handleSave() {
    onSave(selectedFileClassKey)
  }

  return (
    <EditValuePopup title={title} isSaving={isSaving} errorMessage={errorMessage} onSave={handleSave} onClose={onClose}>
      <FileClassPicker
        fileClasses={fileClasses}
        selectedFileClassKey={selectedFileClassKey}
        onSelectedFileClassKeyChange={setSelectedFileClassKey}
        disabled={isSaving}
      />
      <Form.Text>{getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.fileClassPopupHint)}</Form.Text>
    </EditValuePopup>
  )
}
