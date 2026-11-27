import { type ReactNode, useMemo } from 'react'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { EquationAnimationProvider } from './animation/EquationAnimationProvider.tsx'
import { getVisibleEquationGuids, useCollapsibleOpenState } from './elements/collapsibleState.ts'
import { EquationTargetContext } from './elements/EquationTargetContext.ts'
import { useEquationTarget } from './elements/useEquationTarget.ts'
import { useFormulaRenderer } from './formula/useFormulaRenderer.ts'
import { InlineReferenceContext, type InlineReferences } from './inline/InlineReferenceContext.ts'
import type { BlockContent } from './BlockContent.ts'

type BlockContentFrameProps = {
  content: BlockContent
  /**
   * Optional: die Adresse, die zu einer Gleichung springt, die NICHT in diesem Inhalt steht (z. B. auf einer anderen
   * Wissensseite). Ohne Angabe bleibt ein Verweis auf eine fremde Gleichung ein „(?)“.
   */
  getForeignEquationPath?: (equationGuid: string) => string
  /** Die gezeichneten Elemente des Inhalts, in welcher Anordnung auch immer. */
  children: ReactNode
}

/**
 * Der Rahmen, in dem die Elemente EINES Inhalts gezeichnet werden: Er wartet, bis der Setzer der Formeln geladen ist (so
 * erscheint alles in einem Stück und nicht erst der Text und dann die Formeln), er hängt die Animationen an die
 * Gleichungen, er sagt den Texten, welche Nummer eine Gleichung trägt (für Verweise), und er führt zu der Gleichung,
 * die der Anker der Adresse meint. Wie die Elemente darin angeordnet sind, bestimmt der Aufrufer: die Seite zeichnet sie untereinander
 * ({@link BlockContentView}), der Editor jedes neben seiner Definition.
 */
export function BlockContentFrame({ content, getForeignEquationPath, children }: BlockContentFrameProps) {
  const formulaRendererState = useFormulaRenderer()
  const collapsibleOpenState = useCollapsibleOpenState()
  const openCollapsibleGuids = collapsibleOpenState.openCollapsibleGuids
  const openCollapsibleGuidsText = openCollapsibleGuids.join(',')
  const visibleEquationGuids = useMemo(
    () => getVisibleEquationGuids(content.elements, openCollapsibleGuidsText.split(',')),
    [content.elements, openCollapsibleGuidsText],
  )

  const contentDrawn = formulaRendererState.formulaRenderer !== null
  const targetedEquationGuid = useEquationTarget(content.elements, content.equations, contentDrawn)
  const inlineReferences = useMemo((): InlineReferences => {
    const equations = content.equations
    return {
      getEquationNumber: (equationGuid) => {
        const equation = equations.find((candidate) => candidate.guid === equationGuid)
        if (equation === undefined) {
          return null
        }
        return equation.number
      },
      getForeignEquationPath: (equationGuid) => {
        if (getForeignEquationPath === undefined) {
          return null
        }
        return getForeignEquationPath(equationGuid)
      },
    }
  }, [content.equations, getForeignEquationPath])

  if (!contentDrawn) {
    return <LoadStatus errorMessage={formulaRendererState.errorMessage} isLoading={formulaRendererState.errorMessage === null} />
  }
  return (
    <InlineReferenceContext value={inlineReferences}>
      <EquationTargetContext value={targetedEquationGuid}>
        <EquationAnimationProvider animations={content.animations} equations={content.equations} visibleEquationGuids={visibleEquationGuids}>
          {children}
        </EquationAnimationProvider>
      </EquationTargetContext>
    </InlineReferenceContext>
  )
}
