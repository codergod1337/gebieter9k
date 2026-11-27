import { ElementListView } from './elements/ElementListView.tsx'
import type { BlockContent } from './BlockContent.ts'
import { BlockContentFrame } from './BlockContentFrame.tsx'

type BlockContentViewProps = {
  content: BlockContent
}

/** Zeichnet einen Inhalt, so wie eine Seite ihn zeigt: seine Elemente von oben nach unten ({@link BlockContentFrame}). */
export function BlockContentView({ content }: BlockContentViewProps) {
  return (
    <BlockContentFrame content={content}>
      <ElementListView elements={content.elements} />
    </BlockContentFrame>
  )
}
