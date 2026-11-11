import Button from 'react-bootstrap/Button'

type EditButtonProps = {
  /** Für Screenreader, z. B. „alice bearbeiten“. */
  label: string
  onClick: () => void
}

/** Der Bearbeiten-Knopf in der Aktionsspalte einer Tabelle: Bleistift, gelb. Global: von mehreren Tabs genutzt. */
export function EditButton({ label, onClick }: EditButtonProps) {
  return (
    <Button variant="outline-warning" size="sm" className="control-button control-button-edit me-1" onClick={onClick} aria-label={label}>
      <i className="bi bi-pencil"></i>
    </Button>
  )
}
