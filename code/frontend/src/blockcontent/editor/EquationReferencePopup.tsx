import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { EquationChoiceList } from '../elements/EquationChoiceList.tsx'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { useElementEditorContext } from './ElementEditorContext.ts'

type EquationReferencePopupProps = {
  /** Die Kennung der gewählten Gleichung; der Aufrufer setzt den Verweis in seinen Text und schließt. */
  onChoose: (equationGuid: string) => void
  onClose: () => void
}

/**
 * Das Popup „Verweis auf eine Gleichung“: alle Gleichungen des Inhalts mit Nummer und Formel; ein Klick wählt die, auf
 * die der Text verweisen soll.
 */
export function EquationReferencePopup({ onChoose, onClose }: EquationReferencePopupProps) {
  const elementEditorContext = useElementEditorContext()
  const title = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationReferenceTitle)
  return (
    <Modal show onHide={onClose} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <EquationChoiceList label={title} equations={elementEditorContext.equations} onChoose={onChoose} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationReferenceCancel)}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
