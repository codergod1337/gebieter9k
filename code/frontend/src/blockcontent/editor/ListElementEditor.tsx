import { useId } from 'react'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { EditorAddButton, EditorRowButtons } from './EditorCard.tsx'
import type { ElementEditorProps } from './ElementEditorProps.ts'
import { moveListItem, removeListItem, replaceListItem } from './listChanges.ts'

/** Eine Liste im Editor: ob sie nummeriert ist, und ihre Punkte, jeder ein Text mit Auszeichnung in einer Zeile. */
export function ListElementEditor({ element, onChange }: ElementEditorProps<'LIST'>) {
  const orderedCheckId = useId()
  const items = element.items

  function changeItems(changedItems: string[]) {
    onChange({ ...element, items: changedItems })
  }

  return (
    <>
      <Form.Check
        type="checkbox"
        className="blockcontent-editor-check"
        id={orderedCheckId}
        label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.listOrdered)}
        checked={element.ordered === true}
        onChange={(changeEvent) => onChange({ ...element, ordered: changeEvent.target.checked })}
      />
      {items.map((item, itemIndex) => (
        <div key={itemIndex} className="blockcontent-editor-row">
          <Form.Control
            size="sm"
            aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.listItem)}
            value={item}
            onChange={(changeEvent) => changeItems(replaceListItem(items, itemIndex, changeEvent.target.value))}
          />
          <EditorRowButtons
            onMoveUp={() => changeItems(moveListItem(items, itemIndex, -1))}
            onMoveDown={() => changeItems(moveListItem(items, itemIndex, 1))}
            onRemove={() => changeItems(removeListItem(items, itemIndex))}
          />
        </div>
      ))}
      <div className="blockcontent-editor-row">
        <EditorAddButton label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addListItem)} onClick={() => changeItems([...items, ''])} />
      </div>
    </>
  )
}
