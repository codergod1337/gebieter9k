import Dropdown from 'react-bootstrap/Dropdown'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { ElementJson, ElementType } from '../elements/ElementJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { ELEMENT_KIND_ORDER, ELEMENT_KINDS } from './elementKinds.ts'

type AddElementDropdownProps = {
  /** Ob das neue Element auf die oberste Ebene des Inhalts kommt: Nur dort gibt es ContentBoxen. */
  onTopLevel: boolean
  /** Das neue, noch leere Element; der Aufrufer hängt es an. */
  onAdd: (newElement: ElementJson) => void
}

/** Der Knopf „+ Element“: bietet die Arten an, die an dieser Stelle stehen dürfen ({@link ELEMENT_KINDS}). */
export function AddElementDropdown({ onTopLevel, onAdd }: AddElementDropdownProps) {
  const offeredElementTypes = ELEMENT_KIND_ORDER.filter((elementType) => onTopLevel || !ELEMENT_KINDS[elementType].topLevelOnly)

  function addElement(elementType: ElementType) {
    const elementKind = ELEMENT_KINDS[elementType]
    const newElement = elementKind.createElement()
    onAdd(newElement)
  }

  return (
    <Dropdown>
      <Dropdown.Toggle size="sm" variant="outline-primary" className="blockcontent-editor-add">
        <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
        {getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addElement)}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {offeredElementTypes.map((elementType) => (
          <Dropdown.Item key={elementType} onClick={() => addElement(elementType)}>
            {getTextInCurrentLanguage(ELEMENT_KINDS[elementType].label)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
