import { createContext, useContext } from 'react'

/** Was jeder Teil des Editors über den ganzen Inhalt wissen darf, ohne ihn zu kennen. */
export type ElementEditorContextValue = {
  /** Eine feste Kennung, die es im Inhalt noch nicht gibt: Vorsilbe und die kleinste freie Zahl, z. B. `e3`. */
  createFreeId: (prefix: string) => string
  /** Die laufende Nummer einer Gleichung im Inhalt; `null`, wenn es die Kennung nicht gibt. */
  getEquationNumber: (equationId: string) => number | null
}

const NO_ELEMENT_EDITOR_CONTEXT: ElementEditorContextValue = {
  createFreeId: (prefix) => prefix + '1',
  getEquationNumber: () => null,
}

export const ElementEditorContext = createContext<ElementEditorContextValue>(NO_ELEMENT_EDITOR_CONTEXT)

export function useElementEditorContext(): ElementEditorContextValue {
  return useContext(ElementEditorContext)
}
