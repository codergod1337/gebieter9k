import { createContext, type ReactNode, useContext } from 'react'
import type { EquationElement } from './ContentElement.ts'

/**
 * Was ein anderes Paket an eine Gleichung hängen kann, ohne dass die Anzeige der Gleichung es kennt: Das Paket
 * `blockcontent/animation` setzt hier die Notiz der Umformung mit ihrem Abspiel-Knopf ans Zeilenende und sagt, welche
 * Teile durchgestrichen stehen. Ohne Zusatz steht die Gleichung für sich.
 */
export type EquationAddition = {
  /** Die ids der Teile dieser Gleichung, die durchgestrichen stehen. */
  getCancelledFormulaIds: (equationId: string) => string[]
  /** Was am Ende der Zeile dieser Gleichung zusätzlich steht; `null` ohne. */
  renderAddition: (equation: EquationElement) => ReactNode
}

const NO_CANCELLED_FORMULA_IDS: string[] = []

/** Die Vorgabe: kein Zusatz. */
const NO_EQUATION_ADDITION: EquationAddition = {
  getCancelledFormulaIds: () => NO_CANCELLED_FORMULA_IDS,
  renderAddition: () => null,
}

export const EquationAdditionContext = createContext<EquationAddition>(NO_EQUATION_ADDITION)

/** Der Zusatz für die Gleichungen des Inhalts, in dem die Komponente steht. */
export function useEquationAddition(): EquationAddition {
  return useContext(EquationAdditionContext)
}
