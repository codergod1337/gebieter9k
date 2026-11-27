import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
// Aussehen und Maße des Animations-Moduls: alles in einer eigenen Datei, nichts davon in base.css oder im Theme
import '../../styles/animation.css'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { EquationJson } from '../elements/ElementJson.ts'
import { FormulaView } from '../formula/FormulaView.tsx'
import { ANIMATION_TEXTS } from './animationTexts.ts'
import { findAnimationFrom, replaceAnimationFrom } from './equationAnimationChanges.ts'
import { EquationAnimationEditor } from './EquationAnimationEditor.tsx'
import type { EquationAnimationJson } from './EquationAnimationJson.ts'

type EquationAnimationPopupProps = {
  /** Die Gleichungen des Inhalts in ihrer Reihenfolge; ihre Stelle + 1 ist ihre Nummer. */
  equations: EquationJson[]
  animations: EquationAnimationJson[]
  /** Die geänderten Animationen, nach jeder Eingabe. Gespeichert wird mit dem Inhalt. */
  onAnimationsChange: (changedAnimations: EquationAnimationJson[]) => void
  onClose: () => void
}

/**
 * Das Popup „Animationen“ (Nutzer 2026-11-27: „animationen stelle ich mir in einem popup vor“, „das hat aber nichts im
 * editor zu suchen“): links die Übersicht aller Gleichungen des Inhalts mit ihrer Nummer, rechts der Übergang der
 * gewählten Gleichung zur nächsten ({@link EquationAnimationEditor}). Das Popup ändert nur den Teil `animations` des
 * Inhalts; die Elemente fasst es nicht an. Es hält den Fokus nicht fest: Die Tastatur und die Menüs des Formelfelds
 * liegen außerhalb.
 */
export function EquationAnimationPopup({ equations, animations, onAnimationsChange, onClose }: EquationAnimationPopupProps) {
  const [selectedEquationId, setSelectedEquationId] = useState<string | null>(null)

  // gewählt ist die angeklickte Gleichung; ohne Klick (oder wenn es sie nicht mehr gibt) die erste
  let selectedEquationIndex = equations.findIndex((equation) => equation.id === selectedEquationId)
  if (selectedEquationIndex < 0 && equations.length > 0) {
    selectedEquationIndex = 0
  }
  let selectedEquation: EquationJson | null = null
  let nextEquation: EquationJson | null = null
  if (selectedEquationIndex >= 0) {
    selectedEquation = equations[selectedEquationIndex]
    const nextEquationIndex = selectedEquationIndex + 1
    if (nextEquationIndex < equations.length) {
      nextEquation = equations[nextEquationIndex]
    }
  }

  return (
    <Modal show onHide={onClose} size="xl" scrollable enforceFocus={false}>
      <Modal.Header closeButton>
        <Modal.Title>{getTextInCurrentLanguage(ANIMATION_TEXTS.popupTitle)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="equation-animation-editor-hint">{getTextInCurrentLanguage(ANIMATION_TEXTS.popupIntro)}</p>
        {equations.length === 0 && <p>{getTextInCurrentLanguage(ANIMATION_TEXTS.noEquations)}</p>}
        {selectedEquation !== null && (
          <div className="equation-animation-popup">
            <div className="equation-animation-popup-equations" role="listbox" aria-label={getTextInCurrentLanguage(ANIMATION_TEXTS.equationsLabel)}>
              {equations.map((equation, equationIndex) => {
                const selected = equationIndex === selectedEquationIndex
                const hasAnimation = findAnimationFrom(animations, equation.id) !== null
                let rowClassName = 'equation-animation-popup-equation'
                if (selected) {
                  rowClassName = 'equation-animation-popup-equation equation-animation-popup-equation-selected'
                }
                return (
                  <button
                    key={equation.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={rowClassName}
                    onClick={() => setSelectedEquationId(equation.id)}>
                    <span className="equation-animation-popup-number">({equationIndex + 1})</span>
                    <FormulaView latex={equation.latex} displayMode="INLINE" />
                    {hasAnimation && (
                      <i
                        className="bi bi-play-circle equation-animation-popup-mark"
                        role="img"
                        aria-label={getTextInCurrentLanguage(ANIMATION_TEXTS.hasAnimation)}></i>
                    )}
                  </button>
                )
              })}
            </div>
            <EquationAnimationEditor
              key={selectedEquation.id}
              equation={selectedEquation}
              equationNumber={selectedEquationIndex + 1}
              nextEquation={nextEquation}
              animation={findAnimationFrom(animations, selectedEquation.id)}
              onAnimationChange={(changedAnimation) => {
                const fromEquationId = equations[selectedEquationIndex].id
                onAnimationsChange(replaceAnimationFrom(animations, fromEquationId, changedAnimation))
              }}
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {getTextInCurrentLanguage(ANIMATION_TEXTS.popupClose)}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
