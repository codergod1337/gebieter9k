import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'

/** Ein Kasten im Editor: sein Titel, darunter seine Elemente. */
export function BoxElementEditor({ element, onChange, children }: ElementEditorProps<'BOX'>) {
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
