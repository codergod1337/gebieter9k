import type { CSSProperties, ReactNode } from 'react'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { getSymbolClassNameByPackAndName } from '../symbol/symbolCatalog.ts'
import type { BadgeLook } from './BadgeLook.ts'

/**
 * Die Form eines Badges: `pill` für die Position (ARC), `tag` für den Rang (Schild mit Stufe), `medal` für ein
 * Achievement (rundes Medaillon mit Symbol), `tile` für eine Dateiart (FileClass: Kachel mit großem Symbol).
 */
export type BadgeShape = 'pill' | 'tag' | 'medal' | 'tile'

type LookBadgeProps = {
  /** das Aussehen, `null`: Standard aus base.css */
  look: BadgeLook | null
  shape: BadgeShape
  /** der Text, z. B. der Anzeigename; beim Medaillon nur, wenn es kein Symbol hat */
  children?: ReactNode
  /** nur bei `tag`: die Stufe in der Plakette links */
  level?: number
  /** Name für Screenreader und Hoverlay, beim Medaillon Pflicht, weil dort kein Text steht */
  title?: string
}

/** Die CSS-Variablen der gesetzten Farben; fehlt eine, greift der Standard aus base.css. */
function createLookStyle(look: BadgeLook | null): CSSProperties {
  if (look === null) {
    return {}
  }
  const style: Record<string, string> = {}
  if (look.gradientStartColor !== null) {
    style['--badge-look-start'] = look.gradientStartColor
  }
  if (look.gradientEndColor !== null) {
    style['--badge-look-end'] = look.gradientEndColor
  }
  if (look.textColor !== null) {
    style['--badge-look-text'] = look.textColor
  }
  if (look.textShadowColor !== null) {
    style['--badge-look-text-shadow'] = look.textShadowColor
  }
  if (look.borderColor !== null) {
    style['--badge-look-border'] = look.borderColor
  }
  if (look.shadowColor !== null) {
    style['--badge-look-shadow'] = look.shadowColor
  }
  if (look.structureColor !== null) {
    style['--badge-look-structure'] = look.structureColor
  }
  return style as CSSProperties
}

/**
 * Ein Badge mit seinem Aussehen ({@link BadgeLook}), gleich für Position, Rang und Achievement. Gezeichnet wird ganz in
 * base.css (in jedem Theme gleich): der Verlauf als Hintergrund, darüber die Struktur, darüber je Effekt eine Ebene,
 * ganz oben Symbol und Text. Die Klassen heißen `badge-look-*`, nie `icon-*` (die greift Lucide ab). Gleich für
 * Position, Rang, Achievement und Dateiart.
 */
export function LookBadge({ look, shape, children, level, title }: LookBadgeProps) {
  const classNames = ['badge-look', 'badge-look-' + shape]
  let gradient = 'LINEAR'
  if (look !== null && look.gradient !== null) {
    gradient = look.gradient
  }
  classNames.push('badge-look-gradient-' + gradient.toLowerCase())
  const effects = look?.effects ?? []
  for (const effect of effects) {
    classNames.push('badge-look-effect-' + effect.toLowerCase())
  }
  const badgeClassName = classNames.join(' ')
  const lookStyle = createLookStyle(look)

  let structureLayer: ReactNode = null
  if (look !== null && look.structure !== null) {
    const structureClassName = 'badge-look-layer badge-look-structure badge-look-structure-' + look.structure.toLowerCase()
    structureLayer = <span className={structureClassName} aria-hidden="true" />
  }

  let symbolClassName: string | null = null
  if (look !== null && look.symbolPack !== null && look.symbolName !== null) {
    symbolClassName = getSymbolClassNameByPackAndName(look.symbolPack, look.symbolName)
  }
  const hasSymbol = symbolClassName !== null
  const showText = shape !== 'medal' || !hasSymbol

  const badge = (
    <span className={badgeClassName} style={lookStyle} aria-label={title}>
      {structureLayer}
      {effects.map((effect) => {
        const layerClassName = 'badge-look-layer badge-look-layer-' + effect.toLowerCase()
        return <span key={effect} className={layerClassName} aria-hidden="true" />
      })}
      <span className="badge-look-content">
        {shape === 'tag' && level !== undefined && <span className="badge-look-level">{level}</span>}
        {hasSymbol && <i className={symbolClassName + ' badge-look-symbol'} aria-hidden="true"></i>}
        {showText && <span className="badge-look-text">{children}</span>}
      </span>
    </span>
  )
  if (title === undefined) {
    return badge
  }
  // der Name im Hoverlay wie überall, nicht im Kästchen des Browsers (title-Attribut)
  return <Hoverlay text={title}>{badge}</Hoverlay>
}
