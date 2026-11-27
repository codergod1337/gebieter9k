import { useMemo } from 'react'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import type { FormulaDisplayMode } from './FormulaRenderer.ts'
import { markCancelledFormulaIds } from './formulaIds.ts'
import { useFormulaRenderer } from './useFormulaRenderer.ts'

type FormulaViewProps = {
  /** Die Formel als LaTeX, so wie sie gespeichert ist. */
  latex: string
  displayMode: FormulaDisplayMode
  /** Die ids der Teile, die durchgestrichen stehen (von einer Animation gekürzt); ohne Angabe keiner. */
  cancelledFormulaIds?: string[]
}

/** Ohne gekürzte Teile: immer dieselbe leere Liste, damit sich das gesetzte Bild nicht ohne Grund neu berechnet. */
const NO_CANCELLED_FORMULA_IDS: string[] = []

/**
 * Zeigt eine Formel gesetzt: DIE Anzeige jeder Formel der App, als eigene Zeile oder mitten im Satz. Ein Teil mit id
 * (`\htmlData{id=r1}{…}`) ist im Bild ein eigenes Element mit `data-id`; daran findet ihn eine Animation. Solange der
 * Setzer noch lädt, steht nichts da; lässt sich das LaTeX nicht setzen, steht es als Text da und nennt beim Zeigen den
 * Grund, der Rest der Seite bleibt lesbar.
 */
export function FormulaView({ latex, displayMode, cancelledFormulaIds = NO_CANCELLED_FORMULA_IDS }: FormulaViewProps) {
  const formulaRendererState = useFormulaRenderer()
  const formulaRenderer = formulaRendererState.formulaRenderer

  const renderedFormula = useMemo(() => {
    if (formulaRenderer === null) {
      return null
    }
    const renderedByLibrary = formulaRenderer.renderFormula(latex, displayMode)
    if (renderedByLibrary.markup === null) {
      return renderedByLibrary
    }
    const markedMarkup = markCancelledFormulaIds(renderedByLibrary.markup, cancelledFormulaIds)
    return { markup: markedMarkup, problem: null }
  }, [formulaRenderer, latex, displayMode, cancelledFormulaIds])

  let className = 'formula formula-block'
  if (displayMode === 'INLINE') {
    className = 'formula formula-inline'
  }
  if (renderedFormula === null) {
    return <span className={className} aria-busy="true"></span>
  }
  if (renderedFormula.markup === null) {
    return (
      <Hoverlay text={renderedFormula.problem}>
        <span className="formula-problem">{latex}</span>
      </Hoverlay>
    )
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderedFormula.markup }}></span>
}
