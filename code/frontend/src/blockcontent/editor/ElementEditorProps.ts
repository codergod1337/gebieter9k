import type { ReactNode } from 'react'
import type { ElementJsonOfType, ElementType } from '../elements/ElementJson.ts'

/**
 * Was der Bearbeiten-Teil eines Elements bekommt: das Element, die Meldung für seine Änderung und, wenn es Elemente
 * enthält (ContentBox, Aufklapper), den fertigen Editor für deren Liste als `children`. Den Rahmen darum (Art, Verschieben,
 * Entfernen) zeichnet die Liste der Elemente.
 */
export type ElementEditorProps<Type extends ElementType> = {
  element: ElementJsonOfType<Type>
  onChange: (changedElement: ElementJsonOfType<Type>) => void
  children: ReactNode
}
