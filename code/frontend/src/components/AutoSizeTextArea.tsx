import { useLayoutEffect, useRef } from 'react'
import Form from 'react-bootstrap/Form'

type AutoSizeTextAreaProps = {
  /** Für Screenreader, z. B. „Der Code dieses Elements“. */
  label: string
  value: string
  onChange: (changedValue: string) => void
  /** Zusätzliche CSS-Klassen, z. B. für eine Schrift mit fester Breite. */
  className?: string
  /** Ob das Feld als fehlerhaft gezeichnet wird. */
  isInvalid?: boolean
}

/**
 * Ein mehrzeiliges Textfeld, das immer so hoch ist wie sein Text: Es hat nie einen eigenen Scrollbalken, es rollt die
 * Seite (Nutzer 2026-11-27: „ich will aber im editor kein inbox gescrolle“). Global, weil jede Maske so ein Feld
 * brauchen kann; für Code und Formeln schaltet es die Rechtschreibprüfung ab.
 */
export function AutoSizeTextArea({ label, value, onChange, className, isInvalid = false }: AutoSizeTextAreaProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textArea = textAreaRef.current
    if (textArea === null) {
      return
    }
    textArea.style.height = 'auto'
    textArea.style.height = textArea.scrollHeight + 'px'
  }, [value])

  let textAreaClassName = 'auto-size-textarea'
  if (className !== undefined) {
    textAreaClassName = 'auto-size-textarea ' + className
  }
  return (
    <Form.Control
      as="textarea"
      ref={textAreaRef}
      className={textAreaClassName}
      spellCheck={false}
      aria-label={label}
      isInvalid={isInvalid}
      value={value}
      onChange={(changeEvent) => onChange(changeEvent.target.value)}
    />
  )
}
