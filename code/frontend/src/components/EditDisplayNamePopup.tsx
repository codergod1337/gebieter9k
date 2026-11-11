import { useState } from 'react'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { EditValuePopup } from './EditValuePopup.tsx'
import { MultilingualTextInput } from './MultilingualTextInput.tsx'

type EditDisplayNamePopupProps = {
  /** z. B. „Anzeigename von ADMIN“ */
  title: string
  initialDisplayName: MultilingualText
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. Das Popup bleibt dann offen. */
  errorMessage: string | null
  /** Der geänderte Anzeigename; der Aufrufer speichert und schließt bei Erfolg. */
  onSave: (changedDisplayName: MultilingualText) => void
  onClose: () => void
}

/** Den mehrsprachigen Anzeigenamen eines Eintrags direkt aus der Tabellenzeile ändern. Global, weil viele Tabellen ihn haben. */
export function EditDisplayNamePopup({ title, initialDisplayName, isSaving, errorMessage, onSave, onClose }: EditDisplayNamePopupProps) {
  const [displayName, setDisplayName] = useState<MultilingualText>(initialDisplayName)

  function handleSave() {
    onSave(displayName)
  }

  return (
    <EditValuePopup title={title} isSaving={isSaving} errorMessage={errorMessage} onSave={handleSave} onClose={onClose}>
      <MultilingualTextInput
        controlId="editDisplayName"
        label="Anzeigename"
        value={displayName}
        onChange={setDisplayName}
        disabled={isSaving}
      />
    </EditValuePopup>
  )
}
