import { type FormEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { MultilingualRichTextEditor } from '../components/MultilingualRichTextEditor.tsx'
import { sanitizeMultilingualRichText } from '../components/richTextHtml.ts'
import { SubmitButton } from '../components/SubmitButton.tsx'
import type { MultilingualText } from '../language/MultilingualText.ts'

type GuestbookTextFormProps = {
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
 * Ein Rich-Text-Feld mit Knopf zum Absenden, für einen neuen Eintrag und für eine Antwort im Verlauf (Nutzer
 * 2026-11-09: fett, kursiv, Überschriften, Trennlinie, mehrsprachig gespeichert, vorerst nur Deutsch). Ohne Inhalt ist
 * der Knopf gesperrt. Die Länge prüft das Backend.
 */
export function GuestbookTextForm({
  placeholder,
  ariaLabel,
  submitLabel,
  compact = false,
  isSubmitting,
  errorMessage,
  onSubmit,
}: GuestbookTextFormProps) {
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
      <div className="guestbook-text-form">
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
