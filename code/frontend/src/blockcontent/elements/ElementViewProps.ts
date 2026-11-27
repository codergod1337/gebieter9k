import type { ReactNode } from 'react'
import type { ContentElement, ContentElementOfType } from './ContentElement.ts'

/**
 * Was die Anzeige eines Elements bekommt: das Element selbst und, wenn es Elemente enthält (ContentBox, Aufklapper), deren
 * fertige Anzeige als `children`. So muss keine Anzeige wissen, wie eine Liste von Elementen gezeichnet wird.
 */
export type ElementViewProps<Type extends ContentElement['type']> = {
  element: ContentElementOfType<Type>
  children: ReactNode
}
