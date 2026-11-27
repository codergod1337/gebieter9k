import { useMemo } from 'react'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { EquationAnimationProvider } from './animation/EquationAnimationProvider.tsx'
import { getVisibleEquationIds, useCollapsibleOpenState } from './elements/collapsibleState.ts'
import { ElementListView } from './elements/ElementListView.tsx'
import { useFormulaRenderer } from './formula/useFormulaRenderer.ts'
import type { BlockContent } from './BlockContent.ts'

type BlockContentViewProps = {
  content: BlockContent
}

/**
 * Zeichnet einen Inhalt: seine Elemente von oben nach unten, und um sie herum der Rahmen, der die Animationen an die
 * Gleichungen hängt. Gezeichnet wird erst, wenn der Setzer der Formeln geladen ist: So erscheint die Seite in einem
 * Stück und nicht erst der Text und dann die Formeln.
 */
export function BlockContentView({ content }: BlockContentViewProps) {
  const formulaRendererState = useFormulaRenderer()
  const collapsibleOpenState = useCollapsibleOpenState()
  const openCollapsibleIds = collapsibleOpenState.openCollapsibleIds
  const openCollapsibleIdsText = openCollapsibleIds.join(',')
  const visibleEquationIds = useMemo(
    () => getVisibleEquationIds(content.elements, openCollapsibleIdsText.split(',')),
    [content.elements, openCollapsibleIdsText],
  )

  if (formulaRendererState.formulaRenderer === null) {
    return <LoadStatus errorMessage={formulaRendererState.errorMessage} isLoading={formulaRendererState.errorMessage === null} />
  }
  return (
    <EquationAnimationProvider animations={content.animations} equations={content.equations} visibleEquationIds={visibleEquationIds}>
      <ElementListView elements={content.elements} />
    </EquationAnimationProvider>
  )
}
