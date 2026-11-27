import { DerivationBox } from './derivation/DerivationBox.tsx'
import type { BlockContent } from './BlockContent.ts'
import { BoxBlockView } from './BoxBlockView.tsx'

type BlockContentViewProps = {
  content: BlockContent
}

/** Zeichnet einen Inhalt aus Bausteinen: seine Bausteine von oben nach unten, jeder in seinem Kasten. */
export function BlockContentView({ content }: BlockContentViewProps) {
  return (
    <>
      {content.blocks.map((block, blockIndex) => {
        if (block.type === 'DERIVATION') {
          return <DerivationBox key={blockIndex} title={block.title} derivation={block.derivation} />
        }
        return <BoxBlockView key={blockIndex} boxBlock={block} />
      })}
    </>
  )
}
