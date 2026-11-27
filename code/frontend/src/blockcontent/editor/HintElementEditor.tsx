import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'
import { InlineTextArea } from './InlineTextArea.tsx'

/** Ein Hinweis im Editor: sein Text mit der Leiste für die Auszeichnung. */
export function HintElementEditor({ element, onChange }: ElementEditorProps<'HINT'>) {
  return (
    <InlineTextArea
      label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.hintLabel)}
      value={element.text}
      rows={2}
      onChange={(changedText) => onChange({ ...element, text: changedText })}
    />
  )
}
