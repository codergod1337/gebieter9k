import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'

/** Eine Zwischenüberschrift im Editor: ihr Text. */
export function HeadingElementEditor({ element, onChange }: ElementEditorProps<'HEADING'>) {
  const headingLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.headingText)
  return (
    <Form.Control
      size="sm"
      aria-label={headingLabel}
      placeholder={headingLabel}
      value={element.text}
      onChange={(changeEvent) => onChange({ ...element, text: changeEvent.target.value })}
    />
  )
}
