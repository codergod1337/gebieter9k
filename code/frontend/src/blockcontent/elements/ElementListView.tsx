import type { ComponentType, ReactNode } from 'react'
import type { ContentElement } from './ContentElement.ts'
import type { ElementViewProps } from './ElementViewProps.ts'
import { ELEMENT_VIEWS } from './elementViews.ts'

type ElementListViewProps = {
  elements: ContentElement[]
}

/**
 * Zeichnet eine Liste von Elementen von oben nach unten, jedes mit der Anzeige seiner Art ({@link ELEMENT_VIEWS}).
 * Enthält ein Element selbst Elemente (ContentBox, Aufklapper), bekommt seine Anzeige deren fertige Liste mit.
 */
export function ElementListView({ elements }: ElementListViewProps) {
  function renderElement(element: ContentElement, elementIndex: number): ReactNode {
    // die Liste ordnet jeder Art ihre eigene Anzeige zu; hier steht nur fest, dass es eine für diese Art gibt
    const ElementViewOfType = ELEMENT_VIEWS[element.type] as ComponentType<ElementViewProps<ContentElement['type']>>
    let nestedElements: ReactNode = null
    if (element.type === 'CONTENT_BOX' || element.type === 'COLLAPSIBLE') {
      nestedElements = <ElementListView elements={element.elements} />
    }
    return (
      <ElementViewOfType key={elementIndex} element={element}>
        {nestedElements}
      </ElementViewOfType>
    )
  }

  return <div className="blockcontent-elements">{elements.map(renderElement)}</div>
}
