import { type ReactNode, useMemo } from 'react'
import { collectEquationJsons, type ElementJson } from '../elements/ElementJson.ts'
import { ElementEditorContext, type ElementEditorContextValue } from './ElementEditorContext.ts'

type ElementEditorScopeProps = {
  /** Die Elemente der obersten Ebene des ganzen Inhalts. */
  elements: ElementJson[]
  /** Alles, womit der Inhalt bearbeitet wird. */
  children: ReactNode
}

/**
 * Der Rahmen um alles, womit EIN Inhalt bearbeitet wird. Er kennt als Einziger alle Elemente: Er weiß, welche
 * Gleichungen der Inhalt hat und welche Nummer jede trägt ({@link ElementEditorContext}).
 */
export function ElementEditorScope({ elements, children }: ElementEditorScopeProps) {
  const elementEditorContext = useMemo((): ElementEditorContextValue => {
    const equations = collectEquationJsons(elements)
    return {
      equations,
      getEquationNumber: (equationGuid) => {
        const equationIndex = equations.findIndex((equation) => equation.guid === equationGuid)
        if (equationIndex < 0) {
          return null
        }
        return equationIndex + 1
      },
    }
  }, [elements])

  return <ElementEditorContext value={elementEditorContext}>{children}</ElementEditorContext>
}
