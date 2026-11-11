import Button from 'react-bootstrap/Button'
import { ContentBox } from '../components/ContentBox.tsx'
import { CopyButton } from '../components/CopyButton.tsx'
import { SymbolGlyph } from '../symbol/SymbolGlyph.tsx'
import type { SymbolEntry } from '../symbol/symbolCatalog.ts'
import { getSymbolClassName, getSymbolKey, SYMBOL_PACK_OPTIONS } from '../symbol/symbolCatalog.ts'

type SymbolDetailBoxProps = {
  symbolEntry: SymbolEntry
  /** Position im gefilterten Katalog, ab 0. */
  position: number
  totalCount: number
  /** Ist das Symbol gelöscht (ausgeblendet)? */
  discarded: boolean
  isSaving: boolean
  onPrevious: () => void
  onNext: () => void
  /** Löschen bzw. bei einem gelöschten Symbol wiederherstellen. */
  onToggleDiscarded: () => void
}

/**
 * Das gewählte Symbol groß, mit Paket, Name, CSS-Klasse bzw. Schlüssel und Stichwörtern. Vor und Zurück gehen durch den
 * Filter; Löschen blendet es aus, Wiederherstellen holt es zurück.
 */
export function SymbolDetailBox({
  symbolEntry,
  position,
  totalCount,
  discarded,
  isSaving,
  onPrevious,
  onNext,
  onToggleDiscarded,
}: SymbolDetailBoxProps) {
  const symbolClassName = getSymbolClassName(symbolEntry)
  const symbolKey = getSymbolKey(symbolEntry)
  let packLabel: string = symbolEntry.pack
  for (const packOption of SYMBOL_PACK_OPTIONS) {
    if (packOption.pack === symbolEntry.pack) {
      packLabel = packOption.label
    }
  }
  const positionNumberText = (position + 1).toLocaleString('de-DE')
  const totalCountText = totalCount.toLocaleString('de-DE')
  const positionText = 'Icon ' + positionNumberText + ' von ' + totalCountText
  let toggleButton = (
    <Button variant="outline-danger" size="sm" className="control-button control-button-delete" onClick={onToggleDiscarded} disabled={isSaving}>
      <i className="bi bi-trash me-1" aria-hidden="true"></i>
      Löschen
    </Button>
  )
  if (discarded) {
    toggleButton = (
      <Button variant="outline-secondary" size="sm" onClick={onToggleDiscarded} disabled={isSaving}>
        <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
        Wiederherstellen
      </Button>
    )
  }
  const footer = (
    <div className="d-flex align-items-center justify-content-between gap-2">
      <Button variant="outline-secondary" size="sm" onClick={onPrevious} disabled={position <= 0}>
        <i className="bi bi-chevron-left me-1" aria-hidden="true"></i>
        Zurück
      </Button>
      <span>{positionText}</span>
      <Button variant="outline-secondary" size="sm" onClick={onNext} disabled={position >= totalCount - 1}>
        Weiter
        <i className="bi bi-chevron-right ms-1" aria-hidden="true"></i>
      </Button>
    </div>
  )

  return (
    <ContentBox title={symbolEntry.name} actions={toggleButton} footer={footer}>
      <div className="d-flex flex-wrap align-items-center gap-4">
        <SymbolGlyph symbolEntry={symbolEntry} className="symbol-preview" />
        <dl className="row mb-0 flex-grow-1">
          <dt className="col-sm-3">Paket</dt>
          <dd className="col-sm-9">{packLabel}</dd>
          <dt className="col-sm-3">Schlüssel</dt>
          <dd className="col-sm-9">
            <code className="me-2">{symbolKey}</code>
            <CopyButton label="Schlüssel kopieren" value={symbolKey} />
          </dd>
          {symbolClassName !== null && (
            <>
              <dt className="col-sm-3">CSS-Klasse</dt>
              <dd className="col-sm-9">
                <code className="me-2">{symbolClassName}</code>
                <CopyButton label="CSS-Klasse kopieren" value={symbolClassName} />
              </dd>
            </>
          )}
          {symbolEntry.tags.length > 0 && (
            <>
              <dt className="col-sm-3">Stichwörter</dt>
              <dd className="col-sm-9">{symbolEntry.tags.join(', ')}</dd>
            </>
          )}
          {discarded && (
            <>
              <dt className="col-sm-3">Status</dt>
              <dd className="col-sm-9">gelöscht, nirgends zur Auswahl</dd>
            </>
          )}
        </dl>
      </div>
    </ContentBox>
  )
}
