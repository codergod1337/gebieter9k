import type { ComponentType } from 'react'
import { CollapsibleElementView } from './CollapsibleElementView.tsx'
import { ContentBoxElementView } from './ContentBoxElementView.tsx'
import type { ContentElement } from './ContentElement.ts'
import type { ElementViewProps } from './ElementViewProps.ts'
import { EquationElementView } from './EquationElementView.tsx'
import { FigureElementView } from './FigureElementView.tsx'
import { HeadingElementView } from './HeadingElementView.tsx'
import { HintElementView } from './HintElementView.tsx'
import { ListElementView } from './ListElementView.tsx'
import { ParagraphElementView } from './ParagraphElementView.tsx'

/** Je Art eines Elements seine Anzeige. */
type ElementViews = {
  [Type in ContentElement['type']]: ComponentType<ElementViewProps<Type>>
}

/**
 * DIE Liste der Anzeigen: je Art eines Elements genau eine. Ein neues Element bekommt hier seine Zeile; an den
 * vorhandenen Anzeigen ändert sich dafür nichts.
 */
export const ELEMENT_VIEWS: ElementViews = {
  CONTENT_BOX: ContentBoxElementView,
  COLLAPSIBLE: CollapsibleElementView,
  HEADING: HeadingElementView,
  PARAGRAPH: ParagraphElementView,
  HINT: HintElementView,
  LIST: ListElementView,
  EQUATION: EquationElementView,
  FIGURE: FigureElementView,
}
