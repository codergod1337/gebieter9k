import { ElementListView } from './elements/ElementListView.tsx'
import type { BlockContent } from './BlockContent.ts'
import { BlockContentFrame } from './BlockContentFrame.tsx'

type BlockContentViewProps = {
  content: BlockContent
  /** Optional: die Adresse, die zu einer Gleichung auf einer anderen Seite springt ({@link BlockContentFrame}). */
  getForeignEquationPath?: (equationGuid: string) => string
}

/** Zeichnet einen Inhalt, so wie eine Seite ihn zeigt: seine Elemente von oben nach unten ({@link BlockContentFrame}). */
export function BlockContentView({ content, getForeignEquationPath }: BlockContentViewProps) {
  return (
    <BlockContentFrame content={content} getForeignEquationPath={getForeignEquationPath}>
      <ElementListView elements={content.elements} />
    </BlockContentFrame>
  )
}
