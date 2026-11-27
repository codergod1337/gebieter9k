import { createContext, useContext } from 'react'

/**
 * Worauf ein Text verweisen kann, ohne den Inhalt um sich herum zu kennen: Der Rahmen des Inhalts
 * ({@link BlockContentFrame}) sagt hier, welche Nummer eine Gleichung trägt.
 */
export type InlineReferences = {
  /** Die laufende Nummer der Gleichung mit dieser Kennung; `null`, wenn es sie im Inhalt nicht gibt. */
  getEquationNumber: (equationGuid: string) => number | null
  /**
   * Die Adresse, die zu einer Gleichung springt, die NICHT in diesem Inhalt steht (auf einer anderen Seite); `null`,
   * wenn es dort, wo der Inhalt gezeigt wird, keinen solchen Sprung gibt.
   */
  getForeignEquationPath: (equationGuid: string) => string | null
}

/** Die Vorgabe außerhalb eines Inhalts: Es gibt keine Gleichungen. */
const NO_INLINE_REFERENCES: InlineReferences = {
  getEquationNumber: () => null,
  getForeignEquationPath: () => null,
}

export const InlineReferenceContext = createContext<InlineReferences>(NO_INLINE_REFERENCES)

export function useInlineReferences(): InlineReferences {
  return useContext(InlineReferenceContext)
}
