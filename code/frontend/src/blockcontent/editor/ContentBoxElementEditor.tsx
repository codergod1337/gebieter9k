import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'

/** Eine ContentBox im Editor: ihr Titel, darunter ihre Elemente. */
export function ContentBoxElementEditor({ element, onChange, children }: ElementEditorProps<'CONTENT_BOX'>) {
  const titleLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.titleLabel)
  return (
    <>
      <Form.Control
        size="sm"
        aria-label={titleLabel}
        placeholder={titleLabel}
        value={element.title}
        onChange={(changeEvent) => onChange({ ...element, title: changeEvent.target.value })}
      />
      {children}
    </>
  )
}
