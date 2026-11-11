import Button from 'react-bootstrap/Button'

type DeleteButtonProps = {
  /** Für Screenreader, z. B. „alice löschen“. */
  label: string
  onClick: () => void
}

/**
 * Der Löschen-Knopf in der Aktionsspalte einer Tabelle: Mülleimer, rot. Gelöscht wird immer erst nach der
 * Sicherheitsabfrage (`ConfirmDeletePopup`). Global: von mehreren Tabs genutzt.
 */
export function DeleteButton({ label, onClick }: DeleteButtonProps) {
  return (
    <Button variant="outline-danger" size="sm" className="control-button control-button-delete" onClick={onClick} aria-label={label}>
      <i className="bi bi-trash"></i>
    </Button>
  )
}
