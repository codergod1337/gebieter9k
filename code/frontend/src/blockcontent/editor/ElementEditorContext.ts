import { createContext, useContext } from 'react'
import type { EquationJson } from '../elements/ElementJson.ts'

/** Was jeder Teil des Editors über den ganzen Inhalt wissen darf, ohne ihn zu kennen. */
export type ElementEditorContextValue = {
  /** Alle Gleichungen des Inhalts in ihrer Reihenfolge; ihre Stelle + 1 ist ihre Nummer. */
  equations: EquationJson[]
  /** Die laufende Nummer einer Gleichung im Inhalt; `null`, wenn es die Kennung nicht gibt. */
  getEquationNumber: (equationGuid: string) => number | null
}

const NO_ELEMENT_EDITOR_CONTEXT: ElementEditorContextValue = {
  equations: [],
  getEquationNumber: () => null,
}

export const ElementEditorContext = createContext<ElementEditorContextValue>(NO_ELEMENT_EDITOR_CONTEXT)

export function useElementEditorContext(): ElementEditorContextValue {
  return useContext(ElementEditorContext)
}
