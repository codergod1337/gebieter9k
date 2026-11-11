import { useState } from 'react'
import Button from 'react-bootstrap/Button'

type CopyButtonProps = {
  /** Für Screenreader, z. B. „GUID kopieren“. */
  label: string
  value: string
}

/** So lange zeigt der Knopf nach dem Kopieren den Haken. */
const COPIED_FEEDBACK_MILLISECONDS = 1500

/** Kopiert einen Wert in die Zwischenablage, danach kurz ein Haken. Global, wie der CopyButton der Vorlage. */
export function CopyButton({ label, value }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false)

  async function handleClick() {
    await navigator.clipboard.writeText(value)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MILLISECONDS)
  }

  let iconClassName = 'bi bi-clipboard'
  if (isCopied) {
    iconClassName = 'bi bi-check-lg'
  }
  return (
    <Button
      variant="outline-secondary"
      size="sm"
      className="control-button control-button-copy ms-2 py-0"
      onClick={handleClick}
      aria-label={label}>
      <i className={iconClassName}></i>
    </Button>
  )
}
