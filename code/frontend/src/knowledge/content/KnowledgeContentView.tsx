import { DerivationBox } from '../derivation/DerivationBox.tsx'
import type { KnowledgeContent } from './KnowledgeContent.ts'
import { KnowledgeBoxBlockView } from './KnowledgeBoxBlockView.tsx'

type KnowledgeContentViewProps = {
  content: KnowledgeContent
}

/** Zeichnet den Inhalt einer Wissensseite: ihre Bausteine von oben nach unten, jeder in seinem Kasten. */
export function KnowledgeContentView({ content }: KnowledgeContentViewProps) {
  return (
    <>
      {content.blocks.map((block, blockIndex) => {
        if (block.type === 'DERIVATION') {
          return <DerivationBox key={blockIndex} title={block.title} derivation={block.derivation} />
        }
        return <KnowledgeBoxBlockView key={blockIndex} boxBlock={block} />
      })}
    </>
  )
}
