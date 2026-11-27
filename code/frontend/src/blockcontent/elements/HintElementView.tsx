import Alert from 'react-bootstrap/Alert'
import { InlineTextView } from '../inline/InlineTextView.tsx'
import type { ElementViewProps } from './ElementViewProps.ts'

/** Ein hervorgehobener Hinweis. Ohne Text (im Editor noch nicht gefüllt) wird er nicht gezeichnet. */
export function HintElementView({ element }: ElementViewProps<'HINT'>) {
  if (element.text.trim() === '') {
    return null
  }
  return (
    <Alert variant="warning" className="blockcontent-hint">
      <InlineTextView nodes={element.inlines} />
    </Alert>
  )
}
