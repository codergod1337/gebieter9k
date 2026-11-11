import type { SymbolEntry } from './symbolCatalog.ts'
import { getSymbolClassName } from './symbolCatalog.ts'

type SymbolGlyphProps = {
  symbolEntry: SymbolEntry
  /** zusätzliche Klassen, z. B. `symbol-preview` für die Großansicht */
  className?: string
}

/**
 * Zeichnet ein Symbol, egal aus welchem Paket: Schrift-Symbole über ihre CSS-Klasse, SVG-Symbole als `<svg>`. Beide
 * sind so groß wie die Schrift (1em) und nehmen die Schriftfarbe an, so färbt das Theme sie mit.
 */
export function SymbolGlyph({ symbolEntry, className = '' }: SymbolGlyphProps) {
  const glyphClassName = ('symbol-glyph ' + className).trim()
  const svg = symbolEntry.svg
  if (svg !== null) {
    // Der Inhalt stammt aus dem installierten Icon-Paket, nie vom Client oder Backend.
    return (
      <svg
        className={glyphClassName}
        viewBox={svg.viewBox}
        width="1em"
        height="1em"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg.body }}
      />
    )
  }
  const symbolClassName = getSymbolClassName(symbolEntry) ?? ''
  return <i className={symbolClassName + ' ' + glyphClassName} aria-hidden="true"></i>
}
