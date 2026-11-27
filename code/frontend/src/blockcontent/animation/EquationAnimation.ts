/** Was mit einem Teil beim Übergang geschieht, fertig gelesen (siehe {@link AnimationActionJson}). */
export type AnimationAction =
  | { does: 'MOVES_TO'; formulaId: string; targetFormulaId: string }
  | { does: 'CANCELLED'; formulaId: string }
  | { does: 'APPEARS'; formulaId: string }

/** Die Animation eines Übergangs: von einer Gleichung zur nächsten im Inhalt. */
export type EquationAnimation = {
  /** Die feste Kennung der Gleichung, von der der Übergang ausgeht. */
  fromEquationId: string
  /** Die Notiz der Umformung als LaTeX; `null` ohne. */
  note: string | null
  actions: AnimationAction[]
}

/** Die ids der Teile, die diese Animation durchstreicht. */
export function getCancelledFormulaIds(equationAnimation: EquationAnimation): string[] {
  const cancelledFormulaIds: string[] = []
  for (const action of equationAnimation.actions) {
    if (action.does === 'CANCELLED') {
      cancelledFormulaIds.push(action.formulaId)
    }
  }
  return cancelledFormulaIds
}
