import type { ElementJson } from '../elements/ElementJson.ts'
import { AddElementDropdown } from './AddElementDropdown.tsx'
import { ElementCardEditor } from './ElementCardEditor.tsx'
import { moveListItem, removeListItem, replaceListItem } from './listChanges.ts'

type ElementListEditorProps = {
  elements: ElementJson[]
  onChange: (changedElements: ElementJson[]) => void
}

/**
 * Die Elemente IN einem Element (ContentBox, Aufklapper) im Editor: je Element seine Karte ({@link ElementCardEditor}),
 * unten hängt man ein neues an. Jede Änderung liefert die ganze Liste neu. Die oberste Ebene des Inhalts zeichnet der
 * {@link BlockContentEditor} selbst: Dort steht jede Karte neben dem, was sie ergibt.
 */
export function ElementListEditor({ elements, onChange }: ElementListEditorProps) {
  return (
    <div className="blockcontent-editor-list">
      {elements.map((element, elementIndex) => (
        <ElementCardEditor
          key={elementIndex}
          element={element}
          onChange={(changedElement) => onChange(replaceListItem(elements, elementIndex, changedElement))}
          onMoveUp={() => onChange(moveListItem(elements, elementIndex, -1))}
          onMoveDown={() => onChange(moveListItem(elements, elementIndex, 1))}
          onRemove={() => onChange(removeListItem(elements, elementIndex))}
        />
      ))}
      <AddElementDropdown onTopLevel={false} onAdd={(newElement) => onChange([...elements, newElement])} />
    </div>
  )
}
