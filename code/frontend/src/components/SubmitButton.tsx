import type { ReactNode } from 'react'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

type SubmitButtonProps = {
  /** Während `true` ist der Knopf gesperrt und zeigt eine Ladeanzeige. */
  isSubmitting: boolean
  /** Über die volle Breite, z. B. unter einem Formular. Standard `true`, in einem Popup `false`. */
  fullWidth?: boolean
  /** Zusätzlich gesperrt, z. B. wenn sich nichts geändert hat. */
  disabled?: boolean
  children: ReactNode
}

/** Der Knopf zum Absenden eines Formulars. Global: von mehreren Modulen genutzt. */
export function SubmitButton({ isSubmitting, fullWidth = true, disabled = false, children }: SubmitButtonProps) {
  let buttonClassName = ''
  if (fullWidth) {
    buttonClassName = 'w-100'
  }
  const isDisabled = isSubmitting || disabled
  return (
    <Button type="submit" className={buttonClassName} disabled={isDisabled}>
      {isSubmitting && <Spinner animation="border" size="sm" className="me-2" />}
      {children}
    </Button>
  )
}
