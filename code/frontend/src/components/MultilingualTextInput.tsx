import type { ChangeEvent } from 'react'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import { ACTIVE_LANGUAGES, DEFAULT_LANGUAGE } from '../language/activeLanguages.ts'
import type { LanguageCode, MultilingualText } from '../language/MultilingualText.ts'
import { LanguageFlag } from './LanguageFlag.tsx'

type MultilingualTextInputProps = {
  /** Basis für die ids der Eingabefelder, je Sprache kommt das Kürzel dazu. */
  controlId: string
  label: string
  value: MultilingualText
  onChange: (changedValue: MultilingualText) => void
  disabled?: boolean
  /** Muss die Standardsprache Text haben? Standard: ja. Aus z. B. für eine optionale Beschreibung. */
  required?: boolean
}

/**
 * Eingabe eines mehrsprachigen Texts: je aktiver Sprache ein Feld mit ihrer Flagge davor. Vorerst gibt es nur
 * Deutsch. Pflicht ist nur die Standardsprache, wie im Backend, und auch die nur, wenn `required` an ist. Global, weil
 * mehrere Module sie brauchen.
 */
export function MultilingualTextInput({
  controlId,
  label,
  value,
  onChange,
  disabled = false,
  required = true,
}: MultilingualTextInputProps) {
  function handleLanguageTextChange(languageCode: LanguageCode, event: ChangeEvent<HTMLInputElement>) {
    const enteredText = event.target.value
    const changedValue: MultilingualText = { ...value, [languageCode]: enteredText }
    onChange(changedValue)
  }

  // Das Label gehört zum Feld der Standardsprache, das immer da ist.
  const defaultLanguageInputId = controlId + '-' + DEFAULT_LANGUAGE.code

  return (
    <Form.Group className="mb-3">
      <Form.Label htmlFor={defaultLanguageInputId}>{label}</Form.Label>
      {ACTIVE_LANGUAGES.map((language) => {
        const inputId = controlId + '-' + language.code
        const languageText = value[language.code] ?? ''
        const isDefaultLanguage = language.code === DEFAULT_LANGUAGE.code
        const languageTextRequired = required && isDefaultLanguage
        return (
          <InputGroup key={language.code} className="mb-1">
            <InputGroup.Text>
              <LanguageFlag language={language} />
            </InputGroup.Text>
            <Form.Control
              id={inputId}
              value={languageText}
              onChange={(event: ChangeEvent<HTMLInputElement>) => handleLanguageTextChange(language.code, event)}
              required={languageTextRequired}
              disabled={disabled}
            />
          </InputGroup>
        )
      })}
    </Form.Group>
  )
}
