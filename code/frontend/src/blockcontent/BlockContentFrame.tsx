import { type ReactNode, useMemo } from 'react'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { EquationAnimationProvider } from './animation/EquationAnimationProvider.tsx'
import { getVisibleEquationIds, useCollapsibleOpenState } from './elements/collapsibleState.ts'
import { useFormulaRenderer } from './formula/useFormulaRenderer.ts'
import type { BlockContent } from './BlockContent.ts'

type BlockContentFrameProps = {
  content: BlockContent
  /** Die gezeichneten Elemente des Inhalts, in welcher Anordnung auch immer. */
  children: ReactNode
}

/**
 * Der Rahmen, in dem die Elemente EINES Inhalts gezeichnet werden: Er wartet, bis der Setzer der Formeln geladen ist (so
 * erscheint alles in einem Stück und nicht erst der Text und dann die Formeln), und er hängt die Animationen an die
 * Gleichungen. Wie die Elemente darin angeordnet sind, bestimmt der Aufrufer: die Seite zeichnet sie untereinander
 * ({@link BlockContentView}), der Editor jedes neben seiner Definition.
 */
export function BlockContentFrame({ content, children }: BlockContentFrameProps) {
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
      {children}
    </EquationAnimationProvider>
  )
}
