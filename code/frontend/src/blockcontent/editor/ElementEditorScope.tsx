import { type ReactNode, useMemo } from 'react'
import { collectElementIds, collectEquationJsons, type ElementJson } from '../elements/ElementJson.ts'
import { ElementEditorContext, type ElementEditorContextValue } from './ElementEditorContext.ts'

type ElementEditorScopeProps = {
  /** Die Elemente der obersten Ebene des ganzen Inhalts. */
  elements: ElementJson[]
  /** Alles, womit der Inhalt bearbeitet wird. */
  children: ReactNode
}

/**
 * Der Rahmen um alles, womit EIN Inhalt bearbeitet wird. Er kennt als Einziger alle Elemente: Er vergibt die festen
 * Kennungen neuer Gleichungen und Aufklapper und weiß, welche Nummer eine Gleichung im Inhalt hat
 * ({@link ElementEditorContext}).
 */
export function ElementEditorScope({ elements, children }: ElementEditorScopeProps) {
  const elementEditorContext = useMemo((): ElementEditorContextValue => {
    const takenIds = collectElementIds(elements)
    const equations = collectEquationJsons(elements)
    return {
      createFreeId: (prefix) => {
        let number = 1
        while (takenIds.includes(prefix + number)) {
          number = number + 1
        }
        return prefix + number
      },
      getEquationNumber: (equationId) => {
        const equationIndex = equations.findIndex((equation) => equation.id === equationId)
        if (equationIndex < 0) {
          return null
        }
        return equationIndex + 1
      },
    }
  }, [elements])

  return <ElementEditorContext value={elementEditorContext}>{children}</ElementEditorContext>
}
