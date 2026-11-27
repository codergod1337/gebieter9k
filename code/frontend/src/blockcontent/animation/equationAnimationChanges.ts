import type { AnimationActionJson, EquationAnimationJson } from './EquationAnimationJson.ts'

/**
 * Kleine Helfer für das Popup „Animationen“: Jede Änderung liefert NEUES JSON, das alte bleibt, wie es ist.
 */

/** Was mit einem Teil der Gleichung geschieht, von der der Übergang ausgeht. */
export type SourcePartBehaviour = { does: 'STAYS' } | { does: 'CANCELLED' } | { does: 'MOVES_TO'; target: string }

/** Die Animation des Übergangs, der von dieser Gleichung ausgeht; `null`, wenn es keine gibt. */
export function findAnimationFrom(animations: EquationAnimationJson[], fromEquationId: string): EquationAnimationJson | null {
  const animation = animations.find((candidate) => candidate.from === fromEquationId)
  if (animation === undefined) {
    return null
  }
  return animation
}

/** Die Animation zum Ändern: die vorhandene oder eine neue, noch leere für diesen Übergang. */
function getAnimationToChange(animation: EquationAnimationJson | null, fromEquationId: string): EquationAnimationJson {
  if (animation !== null) {
    return animation
  }
  return { from: fromEquationId, note: null, actions: [] }
}

/** Was die Animation mit diesem Teil der Ausgangs-Gleichung tut. */
export function getSourcePartBehaviour(animation: EquationAnimationJson | null, formulaId: string): SourcePartBehaviour {
  if (animation === null) {
    return { does: 'STAYS' }
  }
  for (const action of animation.actions) {
    if (action.id !== formulaId) {
      continue
    }
    if (action.does === 'CANCELLED') {
      return { does: 'CANCELLED' }
    }
    if (action.does === 'MOVES_TO') {
      return { does: 'MOVES_TO', target: action.target }
    }
  }
  return { does: 'STAYS' }
}

/** Die Animation, in der dieser Teil der Ausgangs-Gleichung sich so verhält. */
export function changeSourcePartBehaviour(
  animation: EquationAnimationJson | null,
  fromEquationId: string,
  formulaId: string,
  behaviour: SourcePartBehaviour,
): EquationAnimationJson {
  const animationToChange = getAnimationToChange(animation, fromEquationId)
  // was bisher für diesen Teil galt, fällt weg (APPEARS meint einen Teil der NÄCHSTEN Gleichung und bleibt)
  const otherActions = animationToChange.actions.filter((action) => action.does === 'APPEARS' || action.id !== formulaId)
  if (behaviour.does === 'STAYS') {
    return { ...animationToChange, actions: otherActions }
  }
  let changedAction: AnimationActionJson = { id: formulaId, does: 'CANCELLED' }
  if (behaviour.does === 'MOVES_TO') {
    changedAction = { id: formulaId, does: 'MOVES_TO', target: behaviour.target }
  }
  return { ...animationToChange, actions: [...otherActions, changedAction] }
}

/** Ob dieser Teil der NÄCHSTEN Gleichung aus der Notiz kommt. */
export function isTargetPartAppearing(animation: EquationAnimationJson | null, formulaId: string): boolean {
  if (animation === null) {
    return false
  }
  return animation.actions.some((action) => action.does === 'APPEARS' && action.id === formulaId)
}

/** Von welchem Teil der Ausgangs-Gleichung dieser Teil der nächsten das Ziel ist; `null`, wenn von keinem. */
export function findSourceOfTargetPart(animation: EquationAnimationJson | null, targetFormulaId: string): string | null {
  if (animation === null) {
    return null
  }
  for (const action of animation.actions) {
    if (action.does === 'MOVES_TO' && action.target === targetFormulaId) {
      return action.id
    }
  }
  return null
}

/** Die Animation, in der dieser Teil der NÄCHSTEN Gleichung aus der Notiz kommt oder einfach dasteht. */
export function changeTargetPartAppearing(
  animation: EquationAnimationJson | null,
  fromEquationId: string,
  formulaId: string,
  appearing: boolean,
): EquationAnimationJson {
  const animationToChange = getAnimationToChange(animation, fromEquationId)
  const otherActions = animationToChange.actions.filter((action) => !(action.does === 'APPEARS' && action.id === formulaId))
  if (!appearing) {
    return { ...animationToChange, actions: otherActions }
  }
  return { ...animationToChange, actions: [...otherActions, { id: formulaId, does: 'APPEARS' }] }
}

/** Die Animation mit dieser Notiz; ein leerer Text heißt: keine Notiz. */
export function changeAnimationNote(animation: EquationAnimationJson | null, fromEquationId: string, note: string): EquationAnimationJson {
  const animationToChange = getAnimationToChange(animation, fromEquationId)
  let changedNote: string | null = note
  if (note.trim() === '') {
    changedNote = null
  }
  return { ...animationToChange, note: changedNote }
}

/** Ob die Animation nichts mehr sagt (keine Notiz, kein Verhalten): Dann gibt es sie nicht mehr. */
function isEmptyAnimation(animation: EquationAnimationJson): boolean {
  const noteGiven = animation.note !== undefined && animation.note !== null && animation.note !== ''
  return !noteGiven && animation.actions.length === 0
}

/**
 * Die Liste der Animationen mit dieser Animation für ihren Übergang: ersetzt, neu angehängt oder, wenn sie nichts mehr
 * sagt (oder `null` ist), herausgenommen.
 */
export function replaceAnimationFrom(
  animations: EquationAnimationJson[],
  fromEquationId: string,
  changedAnimation: EquationAnimationJson | null,
): EquationAnimationJson[] {
  const otherAnimations = animations.filter((animation) => animation.from !== fromEquationId)
  if (changedAnimation === null || isEmptyAnimation(changedAnimation)) {
    return otherAnimations
  }
  const existingIndex = animations.findIndex((animation) => animation.from === fromEquationId)
  if (existingIndex < 0) {
    return [...animations, changedAnimation]
  }
  const changedAnimations = [...animations]
  changedAnimations[existingIndex] = changedAnimation
  return changedAnimations
}

/**
 * Die Animationen ohne die, deren Gleichung es nicht mehr gibt: Wird im Editor eine Gleichung entfernt, verschwindet
 * die Animation, die von ihr ausging.
 */
export function removeAnimationsOfMissingEquations(animations: EquationAnimationJson[], equationIds: string[]): EquationAnimationJson[] {
  return animations.filter((animation) => equationIds.includes(animation.from))
}
