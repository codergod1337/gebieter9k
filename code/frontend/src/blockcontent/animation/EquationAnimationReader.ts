import { BlockContentError } from '../BlockContentError.ts'
import { readOptionalText, requireList, requireObject, requireText } from '../elements/jsonValues.ts'
import type { AnimationAction, EquationAnimation } from './EquationAnimation.ts'

/**
 * Liest die Animationen eines Inhalts aus ihrem JSON ({@link EquationAnimationJson}). Geprüft wird die Form. Ob es die
 * genannte Gleichung und die genannten ids (noch) gibt, prüft der Leser NICHT: Eine Animation, deren Gleichung oder Teil
 * im Editor gelöscht wurde, soll die Seite nicht unlesbar machen; beim Abspielen wird übersprungen, was fehlt.
 */
export class EquationAnimationReader {
  /** Die Animationen; ohne Angabe hat der Inhalt keine. */
  readAnimations(animationsValue: unknown, animationsPath: string): EquationAnimation[] {
    if (animationsValue === undefined || animationsValue === null) {
      return []
    }
    const animationValues = requireList(animationsValue, animationsPath)
    const animations: EquationAnimation[] = []
    animationValues.forEach((animationValue, animationIndex) => {
      const animationPath = animationsPath + '[' + animationIndex + ']'
      const animation = this.readAnimation(animationValue, animationPath)
      animations.push(animation)
    })
    return animations
  }

  private readAnimation(animationValue: unknown, animationPath: string): EquationAnimation {
    const animationObject = requireObject(animationValue, animationPath)
    const fromEquationId = requireText(animationObject.from, animationPath + '.from')
    const note = readOptionalText(animationObject.note, animationPath + '.note')
    const actionValues = requireList(animationObject.actions, animationPath + '.actions')
    const actions: AnimationAction[] = []
    actionValues.forEach((actionValue, actionIndex) => {
      const action = this.readAction(actionValue, animationPath + '.actions[' + actionIndex + ']')
      actions.push(action)
    })
    return { fromEquationId, note, actions }
  }

  private readAction(actionValue: unknown, actionPath: string): AnimationAction {
    const actionObject = requireObject(actionValue, actionPath)
    const formulaId = requireText(actionObject.id, actionPath + '.id')
    const does = requireText(actionObject.does, actionPath + '.does')
    if (does === 'MOVES_TO') {
      const targetFormulaId = requireText(actionObject.target, actionPath + '.target')
      return { does: 'MOVES_TO', formulaId, targetFormulaId }
    }
    if (does === 'CANCELLED') {
      return { does: 'CANCELLED', formulaId }
    }
    if (does === 'APPEARS') {
      return { does: 'APPEARS', formulaId }
    }
    throw new BlockContentError(actionPath + '.does: unbekanntes Verhalten "' + does + '"')
  }
}
