import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'

/** Ein Aufklapper im Editor: sein Titel (der Text auf seinem Knopf), darunter seine Elemente. */
export function CollapsibleElementEditor({ element, onChange, children }: ElementEditorProps<'COLLAPSIBLE'>) {
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
