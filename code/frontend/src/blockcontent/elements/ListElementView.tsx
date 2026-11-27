import { InlineTextView } from '../inline/InlineTextView.tsx'
import type { ElementViewProps } from './ElementViewProps.ts'

/** Eine Liste: ihre Punkte untereinander, mit Punkt davor oder nummeriert. */
export function ListElementView({ element }: ElementViewProps<'LIST'>) {
  const listItems = element.items.map((itemInlines, itemIndex) => (
    <li key={itemIndex}>
      <InlineTextView nodes={itemInlines} />
    </li>
  ))
  if (element.ordered) {
    return <ol className="blockcontent-list">{listItems}</ol>
  }
  return <ul className="blockcontent-list">{listItems}</ul>
}
