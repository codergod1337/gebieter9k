import { type ReactNode, useMemo } from 'react'
// Aussehen und Maße des Animations-Moduls: alles in einer eigenen Datei, nichts davon in base.css oder im Theme
import '../../styles/animation.css'
import type { EquationElement } from '../elements/ContentElement.ts'
import { type EquationAddition, EquationAdditionContext } from '../elements/EquationAddition.ts'
import { type EquationAnimation, getCancelledFormulaIds } from './EquationAnimation.ts'
import { EquationAnimationNote } from './EquationAnimationNote.tsx'
import { useEquationAnimationPlayer } from './useEquationAnimationPlayer.ts'

type EquationAnimationProviderProps = {
  /** Die Animationen des Inhalts. */
  animations: EquationAnimation[]
  /** Die Gleichungen des Inhalts in ihrer Reihenfolge: Die „nächste“ ist die mit der nächsten Nummer. */
  equations: EquationElement[]
  /** Die Kennungen der Gleichungen, die gerade zu sehen sind (nicht in einem geschlossenen Aufklapper). */
  visibleEquationGuids: string[]
  /** Der gezeichnete Inhalt. */
  children: ReactNode
}

const NO_CANCELLED_FORMULA_IDS: string[] = []

/** Was die Animationen an eine Gleichung hängen, je Kennung der Gleichung vorbereitet. */
type PreparedAnimation = {
  equationAnimation: EquationAnimation
  /** Die Kennung der nächsten Gleichung im Inhalt. */
  nextEquationGuid: string
  /** Die ids der Teile, die die Animation durchstreicht: immer dieselbe Liste, solange sich der Inhalt nicht ändert. */
  cancelledFormulaIds: string[]
}

/**
 * Hängt die Animationen an die Gleichungen eines Inhalts, ohne dass deren Anzeige etwas von Animationen weiß: Dieser
 * Rahmen ist die Ebene, in der die Teile wandern, und er gibt jeder Gleichung über den {@link EquationAdditionContext}
 * ihren Zusatz: die Notiz mit dem Abspiel-Knopf und die Teile, die durchgestrichen stehen. Der Knopf steht nur da, wenn
 * die Gleichung UND die nächste zu sehen sind; sonst gäbe es nichts abzuspielen.
 */
export function EquationAnimationProvider({ animations, equations, visibleEquationGuids, children }: EquationAnimationProviderProps) {
  const equationAnimationPlayer = useEquationAnimationPlayer()

  const preparedAnimationsByEquationGuid = useMemo(() => {
    const preparedAnimations = new Map<string, PreparedAnimation>()
    for (const equationAnimation of animations) {
      const fromEquationIndex = equations.findIndex((equation) => equation.guid === equationAnimation.fromEquationGuid)
      const nextEquationIndex = fromEquationIndex + 1
      const hasNextEquation = fromEquationIndex >= 0 && nextEquationIndex < equations.length
      if (!hasNextEquation) {
        continue
      }
      const nextEquationGuid = equations[nextEquationIndex].guid
      const cancelledFormulaIds = getCancelledFormulaIds(equationAnimation)
      preparedAnimations.set(equationAnimation.fromEquationGuid, { equationAnimation, nextEquationGuid, cancelledFormulaIds })
    }
    return preparedAnimations
  }, [animations, equations])

  const equationAddition: EquationAddition = {
    getCancelledFormulaIds: (equationGuid) => {
      const preparedAnimation = preparedAnimationsByEquationGuid.get(equationGuid)
      if (preparedAnimation === undefined || !equationAnimationPlayer.isCancellationShown(equationGuid)) {
        return NO_CANCELLED_FORMULA_IDS
      }
      return preparedAnimation.cancelledFormulaIds
    },
    renderAddition: (equation) => {
      const preparedAnimation = preparedAnimationsByEquationGuid.get(equation.guid)
      if (preparedAnimation === undefined) {
        return null
      }
      const bothVisible = visibleEquationGuids.includes(equation.guid) && visibleEquationGuids.includes(preparedAnimation.nextEquationGuid)
      if (!bothVisible) {
        return null
      }
      return (
        <EquationAnimationNote
          equationAnimation={preparedAnimation.equationAnimation}
          onPlay={() => equationAnimationPlayer.playAnimation(preparedAnimation.equationAnimation, preparedAnimation.nextEquationGuid)}
        />
      )
    },
  }

  return (
    <EquationAdditionContext value={equationAddition}>
      <div ref={equationAnimationPlayer.flightLayerRef} className="equation-animation-layer">
        {children}
      </div>
    </EquationAdditionContext>
  )
}
