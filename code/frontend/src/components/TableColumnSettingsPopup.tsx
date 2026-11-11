import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

/** Eine Spalte, die der User ausblenden darf. */
export type HideableColumn = {
  key: string
  header: string
}

type TableColumnSettingsPopupProps = {
  onClose: () => void
  /** der Schlüssel der Einstellung dieser Tabelle, z. B. `TABLE_SOLR_FIELD`, zum Ablesen und Nennen */
  settingName: string
  /** die Spalten, die der User ausblenden darf: die unwichtigen */
  hideableColumns: HideableColumn[]
  hidden: string[]
  hasWidths: boolean
  onToggleHidden: (columnKey: string) => void
  onResetWidths: () => void
  onResetAll: () => void
}

/** Das Popup zu den Spalten einer Tabelle, wie in der Vorlage: unwichtige Spalten an- und abhaken, Breiten oder alles zurücksetzen. */
export function TableColumnSettingsPopup({
  onClose,
  settingName,
  hideableColumns,
  hidden,
  hasWidths,
  onToggleHidden,
  onResetWidths,
  onResetAll,
}: TableColumnSettingsPopupProps) {
  const nothingSet = !hasWidths && hidden.length === 0
  return (
    <Modal show onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>Spalten</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small">
          Die Breite einer Spalte ziehst du am rechten Rand ihres Kopfs. Eine gezogene Spalte trägt einen Stern, alle
          anderen teilen sich den Rest. Gespeichert wird für dich als <code>{settingName}</code>.
        </p>
        <h3 className="h6 mb-1">Spalten zeigen</h3>
        {hideableColumns.length === 0 && <p className="small mb-0">Hier gibt es nichts auszublenden.</p>}
        {hideableColumns.map((hideableColumn) => {
          const checkId = 'tableColumnShown-' + hideableColumn.key
          const shown = !hidden.includes(hideableColumn.key)
          return (
            <Form.Check
              key={hideableColumn.key}
              type="checkbox"
              id={checkId}
              label={hideableColumn.header}
              checked={shown}
              onChange={() => onToggleHidden(hideableColumn.key)}
            />
          )
        })}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" disabled={!hasWidths} onClick={onResetWidths}>
          Breiten zurücksetzen
        </Button>
        <Button variant="secondary" size="sm" disabled={nothingSet} onClick={onResetAll}>
          Alles zurücksetzen
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
