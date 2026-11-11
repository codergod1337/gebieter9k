import { useState } from 'react'
import { ConfirmDeletePopup } from '../components/ConfirmDeletePopup.tsx'
import { DeleteButton } from '../components/DeleteButton.tsx'

type GuestbookDeleteButtonProps = {
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

/** Der Mülleimer an einem Eintrag oder Kommentar, gelöscht wird erst nach der Sicherheitsabfrage. */
export function GuestbookDeleteButton({ label, question, isDeleting, errorMessage, onDelete }: GuestbookDeleteButtonProps) {
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
