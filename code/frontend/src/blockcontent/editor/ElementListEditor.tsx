import type { ComponentType, ReactNode } from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { ElementJson, ElementType } from '../elements/ElementJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { EditorCard } from './EditorCard.tsx'
import { useElementEditorContext } from './ElementEditorContext.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'
import { ELEMENT_KIND_ORDER, ELEMENT_KINDS } from './elementKinds.ts'
import { moveListItem, removeListItem, replaceListItem } from './listChanges.ts'

type ElementListEditorProps = {
  elements: ElementJson[]
  onChange: (changedElements: ElementJson[]) => void
  /** Ob das die oberste Ebene des Inhalts ist: Nur dort gibt es Kästen. */
  onTopLevel: boolean
}

/**
 * Eine Liste von Elementen im Editor: je Element eine Karte mit seiner Art, den Knöpfen zum Verschieben und Entfernen
 * und darin dem Bearbeiten-Teil seiner Art ({@link ELEMENT_KINDS}); unten hängt man ein neues Element an. Enthält ein
 * Element selbst Elemente (Kasten, Aufklapper), bekommt sein Bearbeiten-Teil deren Liste als fertigen Editor mit. Jede
 * Änderung liefert die ganze Liste neu.
 */
export function ElementListEditor({ elements, onChange, onTopLevel }: ElementListEditorProps) {
  const elementEditorContext = useElementEditorContext()

  function addElement(elementType: ElementType) {
    const elementKind = ELEMENT_KINDS[elementType]
    const newElement = elementKind.createElement(elementEditorContext.createFreeId)
    onChange([...elements, newElement])
  }

  function renderElementCard(element: ElementJson, elementIndex: number): ReactNode {
    const elementKind = ELEMENT_KINDS[element.type]
    // die Liste ordnet jeder Art ihren eigenen Bearbeiten-Teil zu; hier steht nur fest, dass es einen für diese Art gibt
    const ElementEditorOfType = elementKind.Editor as ComponentType<ElementEditorProps<ElementType>>
    let kindLabel = getTextInCurrentLanguage(elementKind.label)
    if (element.type === 'EQUATION') {
      const equationNumber = elementEditorContext.getEquationNumber(element.id)
      if (equationNumber !== null) {
        const numberText = getTextInCurrentLanguageWithValues(BLOCK_CONTENT_EDITOR_TEXTS.equationNumber, { number: String(equationNumber) })
        kindLabel = kindLabel + ' ' + numberText
      }
    }
    let nestedListEditor: ReactNode = null
    if (element.type === 'BOX' || element.type === 'COLLAPSIBLE') {
      nestedListEditor = (
        <ElementListEditor
          elements={element.elements}
          onTopLevel={false}
          onChange={(changedNestedElements) => {
            const changedElement = { ...element, elements: changedNestedElements }
            onChange(replaceListItem(elements, elementIndex, changedElement))
          }}
        />
      )
    }
    return (
      <EditorCard
        key={elementIndex}
        kindLabel={kindLabel}
        onMoveUp={() => onChange(moveListItem(elements, elementIndex, -1))}
        onMoveDown={() => onChange(moveListItem(elements, elementIndex, 1))}
        onRemove={() => onChange(removeListItem(elements, elementIndex))}>
        <ElementEditorOfType element={element} onChange={(changedElement) => onChange(replaceListItem(elements, elementIndex, changedElement))}>
          {nestedListEditor}
        </ElementEditorOfType>
      </EditorCard>
    )
  }

  const offeredElementTypes = ELEMENT_KIND_ORDER.filter((elementType) => onTopLevel || !ELEMENT_KINDS[elementType].topLevelOnly)
  return (
    <div className="blockcontent-editor-list">
      {elements.map(renderElementCard)}
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
    </div>
  )
}
