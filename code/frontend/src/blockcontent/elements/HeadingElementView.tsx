import type { ElementViewProps } from './ElementViewProps.ts'

/** Eine Zwischenüberschrift. Ohne Text (im Editor noch nicht gefüllt) wird sie nicht gezeichnet. */
export function HeadingElementView({ element }: ElementViewProps<'HEADING'>) {
  if (element.text.trim() === '') {
    return null
  }
  return <h3 className="blockcontent-heading">{element.text}</h3>
}
