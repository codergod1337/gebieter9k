import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

type SymbolMarkBarProps = {
  /** Im Markier-Modus markiert ein Klick auf eine Kachel, statt sie groß zu zeigen. */
  markMode: boolean
  markedCount: number
  /** In der Ansicht „Gelöschte“ heißt die Aktion Wiederherstellen, sonst Löschen. */
  discardedView: boolean
  isSaving: boolean
  onMarkModeChange: (changedMarkMode: boolean) => void
  onMarkPage: () => void
  onClearMarks: () => void
  onApplyToMarked: () => void
}

/** Die Leiste zum Markieren: Modus an oder aus, ganze Seite markieren, Markierung aufheben, Markierte löschen. */
export function SymbolMarkBar({
  markMode,
  markedCount,
  discardedView,
  isSaving,
  onMarkModeChange,
  onMarkPage,
  onClearMarks,
  onApplyToMarked,
}: SymbolMarkBarProps) {
  const markedCountText = markedCount.toLocaleString('de-DE') + ' markiert'
  let applyButton = (
    <Button
      variant="outline-danger"
      size="sm"
      className="control-button control-button-delete"
      onClick={onApplyToMarked}
      disabled={markedCount === 0 || isSaving}>
      <i className="bi bi-trash me-1" aria-hidden="true"></i>
      Markierte löschen
    </Button>
  )
  if (discardedView) {
    applyButton = (
      <Button variant="outline-secondary" size="sm" onClick={onApplyToMarked} disabled={markedCount === 0 || isSaving}>
        <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
        Markierte wiederherstellen
      </Button>
    )
  }

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      <Form.Check
        type="switch"
        id="symbolMarkMode"
        label="Markieren: ein Klick markiert die Kachel"
        checked={markMode}
        onChange={() => onMarkModeChange(!markMode)}
        className="me-auto"
      />
      <span className="small">{markedCountText}</span>
      <Button variant="outline-secondary" size="sm" onClick={onMarkPage} disabled={isSaving}>
        <i className="bi bi-check2-all me-1" aria-hidden="true"></i>
        Seite markieren
      </Button>
      <Button variant="outline-secondary" size="sm" onClick={onClearMarks} disabled={markedCount === 0 || isSaving}>
        Markierung aufheben
      </Button>
      {applyButton}
    </div>
  )
}
