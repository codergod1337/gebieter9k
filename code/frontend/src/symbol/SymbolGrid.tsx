import { SymbolGlyph } from './SymbolGlyph.tsx'
import type { SymbolEntry } from './symbolCatalog.ts'
import { getSymbolKey } from './symbolCatalog.ts'

type SymbolGridProps = {
  /** Die Symbole dieser Seite. */
  symbolEntries: SymbolEntry[]
  /** Der Schlüssel des gewählten Symbols, `null` wenn keins. */
  selectedSymbolKey: string | null
  /** Die Schlüssel der markierten Symbole. */
  markedSymbolKeys: Set<string>
  onTileClick: (symbolEntry: SymbolEntry) => void
}

/** Die Symbole einer Seite als Kacheln: Symbol und Name. Gewählte und markierte Kacheln zeichnet das Theme. */
export function SymbolGrid({ symbolEntries, selectedSymbolKey, markedSymbolKeys, onTileClick }: SymbolGridProps) {
  return (
    <div className="symbol-grid">
      {symbolEntries.map((symbolEntry) => {
        const symbolKey = getSymbolKey(symbolEntry)
        const tileClassNames = ['symbol-tile']
        if (symbolKey === selectedSymbolKey) {
          tileClassNames.push('symbol-tile-selected')
        }
        const marked = markedSymbolKeys.has(symbolKey)
        if (marked) {
          tileClassNames.push('symbol-tile-marked')
        }
        const tileClassName = tileClassNames.join(' ')
        return (
          <button
            key={symbolKey}
            type="button"
            className={tileClassName}
            aria-pressed={marked}
            onClick={() => onTileClick(symbolEntry)}>
            <SymbolGlyph symbolEntry={symbolEntry} />
            <span className="symbol-tile-name">{symbolEntry.name}</span>
          </button>
        )
      })}
    </div>
  )
}
