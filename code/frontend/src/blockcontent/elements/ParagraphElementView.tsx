import { InlineTextView } from '../inline/InlineTextView.tsx'
import type { ElementViewProps } from './ElementViewProps.ts'

/** Ein Absatz Text mit seiner Auszeichnung. Ohne Text (im Editor noch nicht gefüllt) wird er nicht gezeichnet. */
export function ParagraphElementView({ element }: ElementViewProps<'PARAGRAPH'>) {
  if (element.text.trim() === '') {
    return null
  }
  return (
    <p className="blockcontent-paragraph">
      <InlineTextView nodes={element.inlines} />
    </p>
  )
}
