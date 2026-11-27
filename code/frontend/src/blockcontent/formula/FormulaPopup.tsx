import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { FormulaField } from './FormulaField.tsx'
import { FORMULA_TEXTS } from './formulaTexts.ts'

type FormulaPopupProps = {
  /** Die Formel, mit der das Feld beginnt; leer für eine neue. */
  initialLatex: string
  /** Die fertige Formel als LaTeX; der Aufrufer setzt sie ein und schließt. */
  onConfirm: (latex: string) => void
  onClose: () => void
}

/**
 * Ein Popup mit dem Formelfeld, z. B. für eine Formel mitten im Satz: tippen, „Einfügen“. Das Popup hält den Fokus nicht
 * fest: Die Tastatur und die Menüs des Formelfelds liegen außerhalb und müssen bedienbar bleiben.
 */
export function FormulaPopup({ initialLatex, onConfirm, onClose }: FormulaPopupProps) {
  const [latex, setLatex] = useState(initialLatex)
  const title = getTextInCurrentLanguage(FORMULA_TEXTS.popupTitle)
  return (
    <Modal show onHide={onClose} centered size="lg" enforceFocus={false}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FormulaField label={title} latex={latex} onLatexChange={setLatex} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {getTextInCurrentLanguage(FORMULA_TEXTS.popupCancel)}
        </Button>
        <Button variant="primary" disabled={latex.trim() === ''} onClick={() => onConfirm(latex)}>
          {getTextInCurrentLanguage(FORMULA_TEXTS.popupConfirm)}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
