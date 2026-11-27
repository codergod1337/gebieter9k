import { createContext, useContext } from 'react'

/**
 * Die Gleichung, die die Adresse gerade meint (ihr Anker `#eq-<guid>`): ihre Kennung, oder `null`. Der Rahmen des
 * Inhalts setzt sie ({@link useEquationTarget}), die Anzeige der Gleichung hebt sich daran hervor.
 */
export const EquationTargetContext = createContext<string | null>(null)

export function useTargetedEquationGuid(): string | null {
  return useContext(EquationTargetContext)
}
