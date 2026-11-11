import Form from 'react-bootstrap/Form'
import { ACTIVE_LANGUAGES } from '../language/activeLanguages.ts'
import type { LanguageCode, MultilingualText } from '../language/MultilingualText.ts'
import { LanguageFlag } from './LanguageFlag.tsx'
import { RichTextEditor } from './RichTextEditor.tsx'
import { getRichTextPlainText } from './richTextHtml.ts'

type MultilingualRichTextEditorProps = {
  /** Je Sprachkürzel das HTML. */
  value: MultilingualText
  onChange: (changedValue: MultilingualText) => void
  ariaLabel: string
  disabled?: boolean
  placeholder?: string
  /** Niedrige Felder, z. B. für eine Antwort im Gästebuch. */
  compact?: boolean
  /** Mit Wert ein Zähler je Sprache („12 / 2000 Zeichen“), rot über der Grenze. */
  maxPlainTextLength?: number
}

/**
 * DIE Eingabe eines Rich-Texts (Nutzer 2026-11-09: jeder Rich-Text ist mehrsprachig, als JSON je Sprache gespeichert):
 * je aktiver Sprache die Flagge und ein {@link RichTextEditor}, wie der {@link MultilingualTextInput} bei Namen. Vorerst
 * gibt es nur Deutsch; eine neue Sprache kommt nur in `activeLanguages.ts` dazu. Speichern über
 * `sanitizeMultilingualRichText`.
 */
export function MultilingualRichTextEditor({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  placeholder = '',
  compact = false,
  maxPlainTextLength,
}: MultilingualRichTextEditorProps) {
  function handleLanguageHtmlChange(languageCode: LanguageCode, changedHtml: string) {
    const changedValue: MultilingualText = { ...value, [languageCode]: changedHtml }
    onChange(changedValue)
  }

  return (
    <div className="multilingual-rich-text">
      {ACTIVE_LANGUAGES.map((language) => {
        const languageHtml = value[language.code] ?? ''
        const languageAriaLabel = ariaLabel + ' (' + language.name + ')'
        let countText: string | null = null
        let countClassName = 'multilingual-rich-text-count'
        if (maxPlainTextLength !== undefined) {
          const languagePlainText = getRichTextPlainText(languageHtml)
          countText = languagePlainText.length + ' / ' + maxPlainTextLength + ' Zeichen'
          if (languagePlainText.length > maxPlainTextLength) {
            countClassName = 'multilingual-rich-text-count text-danger'
          }
        }
        return (
          <div key={language.code} className="multilingual-rich-text-language">
            <span className="multilingual-rich-text-flag">
              <LanguageFlag language={language} />
            </span>
            <div className="multilingual-rich-text-field">
              <RichTextEditor
                value={languageHtml}
                onChange={(changedHtml) => handleLanguageHtmlChange(language.code, changedHtml)}
                ariaLabel={languageAriaLabel}
                disabled={disabled}
                placeholder={placeholder}
                compact={compact}
              />
              {countText !== null && <Form.Text className={countClassName}>{countText}</Form.Text>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
