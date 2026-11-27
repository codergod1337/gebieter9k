import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'
import { InlineTextArea } from './InlineTextArea.tsx'

/** Ein Absatz im Editor: sein Text mit der Leiste für die Auszeichnung. */
export function ParagraphElementEditor({ element, onChange }: ElementEditorProps<'PARAGRAPH'>) {
  return (
    <InlineTextArea
      label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.paragraphLabel)}
      value={element.text}
      rows={3}
      onChange={(changedText) => onChange({ ...element, text: changedText })}
    />
  )
}
