import { PlayButton } from '../../components/PlayButton.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { FormulaView } from '../formula/FormulaView.tsx'
import { ANIMATION_TEXTS } from './animationTexts.ts'
import type { EquationAnimation } from './EquationAnimation.ts'
import { ANIMATION_CAUSE_ATTRIBUTE, ANIMATION_CAUSE_SOURCE_ATTRIBUTE } from './useEquationAnimationPlayer.ts'

type EquationAnimationNoteProps = {
  equationAnimation: EquationAnimation
  /** Spielt die Animation ab. */
  onPlay: () => void
}

/**
 * Was eine Animation ans Ende der Zeile ihrer Gleichung setzt: die Notiz der Umformung, wie man sie von Hand schreibt
 * (ein Strich, dahinter die Umformung, z. B. „| · r“), und daneben der Abspiel-Knopf. Beim Abspielen leuchtet die Notiz
 * zuerst auf, und was der Übergang neu bringt, kommt aus ihr. Ohne Notiz steht nur der Knopf da (Nutzer 2026-11-27:
 * Worte nur für schwierige Schritte, nicht für Kleinkram wie das Kürzen).
 */
export function EquationAnimationNote({ equationAnimation, onPlay }: EquationAnimationNoteProps) {
  const note = equationAnimation.note
  const causeAttributes = { [ANIMATION_CAUSE_ATTRIBUTE]: 'true' }
  const causeSourceAttributes = { [ANIMATION_CAUSE_SOURCE_ATTRIBUTE]: 'true' }
  return (
    <span className="equation-animation">
      {note !== null && (
        <span className="equation-animation-note" {...causeAttributes}>
          <span className="equation-animation-bar" aria-hidden="true">
            |
          </span>
          <span {...causeSourceAttributes}>
            <FormulaView latex={note} displayMode="BLOCK" />
          </span>
        </span>
      )}
      <PlayButton label={getTextInCurrentLanguage(ANIMATION_TEXTS.playAnimation)} onClick={onPlay} />
    </span>
  )
}
