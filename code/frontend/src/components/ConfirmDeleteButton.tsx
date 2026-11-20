import { useState } from 'react'
import { ConfirmDeletePopup } from './ConfirmDeletePopup.tsx'
import { DeleteButton } from './DeleteButton.tsx'

type ConfirmDeleteButtonProps = {
  /** Für Screenreader und als Titel der Sicherheitsabfrage, z. B. „Eintrag löschen“. */
  label: string
  /** Die Frage der Sicherheitsabfrage. */
  question: string
  isDeleting: boolean
  /** Fehler des Löschens, `null` wenn keiner. */
  errorMessage: string | null
  /** Löscht; liefert, ob es geklappt hat. Dann schließt die Abfrage. */
  onDelete: () => Promise<boolean>
}

/**
 * Der Mülleimer samt Sicherheitsabfrage in einem Stück, überall gleich: an einem Eintrag oder Kommentar im Gästebuch,
 * an einem Kommentar zu einem Bild. Gelöscht wird erst nach der Abfrage ({@link ConfirmDeletePopup}).
 */
export function ConfirmDeleteButton({ label, question, isDeleting, errorMessage, onDelete }: ConfirmDeleteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)

  async function handleConfirm() {
    const deleted = await onDelete()
    if (deleted) {
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <DeleteButton label={label} onClick={() => setConfirmOpen(true)} />
      {confirmOpen && (
        <ConfirmDeletePopup
          title={label}
          isDeleting={isDeleting}
          errorMessage={errorMessage}
          onConfirm={() => void handleConfirm()}
          onClose={() => setConfirmOpen(false)}>
          {question}
        </ConfirmDeletePopup>
      )}
    </>
  )
}
