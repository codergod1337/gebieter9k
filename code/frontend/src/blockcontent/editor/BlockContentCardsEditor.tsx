import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { BlockContentJson, BlockJson, QuantitiesJson } from '../BlockContentJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { BoxBlockCard } from './BoxBlockCard.tsx'
import { DerivationBlockCard } from './DerivationBlockCard.tsx'
import { EditorAddButton } from './EditorCard.tsx'
import { moveListItem, removeListItem, replaceListItem } from './listChanges.ts'
import { QuantitiesCard } from './QuantitiesCard.tsx'

type BlockContentCardsEditorProps = {
  contentJson: BlockContentJson
  onChange: (changedContentJson: BlockContentJson) => void
}

/** Eine Kennung für eine neue Rechnung, die es auf der Seite noch nicht gibt: `rechnung1`, `rechnung2`, … */
function createFreeDerivationKey(blocks: BlockJson[]): string {
  const takenKeys = blocks.filter((block) => block.type === 'DERIVATION').map((block) => block.key)
  let number = 1
  while (takenKeys.includes('rechnung' + number)) {
    number = number + 1
  }
  return 'rechnung' + number
}

/**
 * Die Ansicht „Bausteine“ des Editors: oben die Größen der Seite, darunter je Baustein eine Karte (Kasten, Rechnung)
 * in der Reihenfolge der Seite; unten hängt man neue Bausteine an. Jede Änderung liefert den ganzen Inhalt neu.
 */
export function BlockContentCardsEditor({ contentJson, onChange }: BlockContentCardsEditorProps) {
  const quantities: QuantitiesJson = contentJson.quantities ?? {}
  const blocks = contentJson.blocks

  function changeBlocks(changedBlocks: BlockJson[]) {
    onChange({ ...contentJson, blocks: changedBlocks })
  }

  function addBox() {
    const newBoxTitle = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.newBoxTitle)
    changeBlocks([...blocks, { type: 'BOX', title: newBoxTitle, parts: [{ type: 'PARAGRAPH', text: '' }] }])
  }

  function addDerivation() {
    const newDerivationTitle = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.newDerivationTitle)
    const newDerivationKey = createFreeDerivationKey(blocks)
    const startEquation = { left: { type: 'SYMBOL', text: 'a' }, right: { type: 'SYMBOL', text: 'b' } } as const
    changeBlocks([...blocks, { type: 'DERIVATION', key: newDerivationKey, title: newDerivationTitle, steps: [{ equation: startEquation }] }])
  }

  return (
    <div className="blockcontent-editor-cards">
      <QuantitiesCard quantities={quantities} onChange={(changedQuantities) => onChange({ ...contentJson, quantities: changedQuantities })} />
      {blocks.map((block, blockIndex) => {
        const moveUp = () => changeBlocks(moveListItem(blocks, blockIndex, -1))
        const moveDown = () => changeBlocks(moveListItem(blocks, blockIndex, 1))
        const remove = () => changeBlocks(removeListItem(blocks, blockIndex))
        if (block.type === 'DERIVATION') {
          return (
            <DerivationBlockCard
              key={blockIndex}
              derivationBlock={block}
              quantities={quantities}
              onChange={(changedBlock) => changeBlocks(replaceListItem(blocks, blockIndex, changedBlock))}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onRemove={remove}
            />
          )
        }
        return (
          <BoxBlockCard
            key={blockIndex}
            boxBlock={block}
            quantities={quantities}
            onChange={(changedBlock) => changeBlocks(replaceListItem(blocks, blockIndex, changedBlock))}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onRemove={remove}
          />
        )
      })}
      <div className="blockcontent-editor-row">
        <EditorAddButton label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addBox)} onClick={addBox} />
        <EditorAddButton label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addDerivation)} onClick={addDerivation} />
      </div>
      <p className="blockcontent-editor-help">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.textHelp)}</p>
      <p className="blockcontent-editor-help">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.formulaHelp)}</p>
    </div>
  )
}
