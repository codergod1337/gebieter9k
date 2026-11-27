import type { ComponentType, ReactNode } from 'react'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { ElementJson, ElementType } from '../elements/ElementJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { EditorCard } from './EditorCard.tsx'
import { useElementEditorContext } from './ElementEditorContext.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'
import { ELEMENT_KINDS } from './elementKinds.ts'
import { ElementListEditor } from './ElementListEditor.tsx'

type ElementCardEditorProps = {
  element: ElementJson
  onChange: (changedElement: ElementJson) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

/**
 * EIN Element im Editor: eine Karte mit seiner Art (eine Gleichung nennt ihre Nummer), den Knöpfen zum Verschieben und
 * Entfernen und darin dem Bearbeiten-Teil seiner Art ({@link ELEMENT_KINDS}). Enthält das Element selbst Elemente
 * (ContentBox, Aufklapper), bekommt sein Bearbeiten-Teil deren Liste als fertigen Editor mit.
 */
export function ElementCardEditor({ element, onChange, onMoveUp, onMoveDown, onRemove }: ElementCardEditorProps) {
  const elementEditorContext = useElementEditorContext()
  const elementKind = ELEMENT_KINDS[element.type]
  // die Liste der Arten ordnet jeder ihren eigenen Bearbeiten-Teil zu; hier steht nur fest, dass es einen für diese Art gibt
  const ElementEditorOfType = elementKind.Editor as ComponentType<ElementEditorProps<ElementType>>
  let kindLabel = getTextInCurrentLanguage(elementKind.label)
  if (element.type === 'EQUATION') {
    const equationNumber = elementEditorContext.getEquationNumber(element.guid)
    if (equationNumber !== null) {
      const numberText = getTextInCurrentLanguageWithValues(BLOCK_CONTENT_EDITOR_TEXTS.equationNumber, { number: String(equationNumber) })
      kindLabel = kindLabel + ' ' + numberText
    }
  }
  let nestedListEditor: ReactNode = null
  if (element.type === 'CONTENT_BOX' || element.type === 'COLLAPSIBLE') {
    nestedListEditor = (
      <ElementListEditor elements={element.elements} onChange={(changedNestedElements) => onChange({ ...element, elements: changedNestedElements })} />
    )
  }
  return (
    <EditorCard kindLabel={kindLabel} onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove}>
      <ElementEditorOfType element={element} onChange={onChange}>
        {nestedListEditor}
      </ElementEditorOfType>
    </EditorCard>
  )
}
