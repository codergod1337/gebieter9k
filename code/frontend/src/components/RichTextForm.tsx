import { type FormEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { ErrorAlert } from './ErrorAlert.tsx'
import { MultilingualRichTextEditor } from './MultilingualRichTextEditor.tsx'
import { sanitizeMultilingualRichText } from './richTextHtml.ts'
import { SubmitButton } from './SubmitButton.tsx'
import type { MultilingualText } from '../language/MultilingualText.ts'

type RichTextFormProps = {
  /** Was im leeren Feld steht, z. B. „Etwas ins Gästebuch schreiben …“. */
  placeholder: string
  /** Für Screenreader, z. B. „Neuer Gästebucheintrag“. */
  ariaLabel: string
  /** Die Beschriftung des Knopfes, z. B. „Eintragen“. */
  submitLabel: string
  /** Niedriges Feld, z. B. für eine Antwort im Verlauf. */
  compact?: boolean
  isSubmitting: boolean
  /** Fehler des Absendens, `null` wenn keiner. */
  errorMessage: string | null
  /** Schickt den bereinigten Text ab; liefert, ob es geklappt hat. Dann wird das Feld geleert. */
  onSubmit: (text: MultilingualText) => Promise<boolean>
}

/**
 * Ein Rich-Text-Feld mit Knopf zum Absenden, überall gleich: ein neuer Eintrag und eine Antwort im Gästebuch, ein
 * Kommentar zu einem Bild (Nutzer 2026-11-09: fett, kursiv, Überschriften, Trennlinie, mehrsprachig gespeichert, vorerst
 * nur Deutsch). Ohne Inhalt ist der Knopf gesperrt. Die Länge prüft das Backend. Lage in base.css (`.rich-text-form`).
 */
export function RichTextForm({
  placeholder,
  ariaLabel,
  submitLabel,
  compact = false,
  isSubmitting,
  errorMessage,
  onSubmit,
}: RichTextFormProps) {
  const [text, setText] = useState<MultilingualText>({})
  const sanitizedText = sanitizeMultilingualRichText(text)
  const textMissing = sanitizedText === null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sanitizedText === null) {
      return
    }
    const submitted = await onSubmit(sanitizedText)
    if (submitted) {
      setText({})
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <ErrorAlert message={errorMessage} />
      <div className="rich-text-form">
        <MultilingualRichTextEditor
          value={text}
          onChange={setText}
          ariaLabel={ariaLabel}
          disabled={isSubmitting}
          placeholder={placeholder}
          compact={compact}
        />
        <SubmitButton isSubmitting={isSubmitting} fullWidth={false} disabled={textMissing}>
          {submitLabel}
        </SubmitButton>
      </div>
    </Form>
  )
}
