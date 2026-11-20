import type { ReactNode } from 'react'
import Spinner from 'react-bootstrap/Spinner'

type LoadStatusProps = {
  /** Der Fehler des Ladens oder Speicherns, `null` ohne Fehler. */
  errorMessage: string | null
  /** Ob die Daten noch fehlen. */
  isLoading: boolean
  /** Was dasteht, sobald die Daten da sind, z. B. „12 Ränge, am Griff links verschieben“. */
  children?: ReactNode
}

/**
 * Der Stand einer geladenen Ansicht, überall gleich (Nutzer 2026-11-20: ein globaler Baustein statt desselben Fußes in
 * jedem Tab): zuerst der Fehler in Rot, sonst die kleine Ladeanzeige, sonst der Inhalt, meist die Anzahl. Für den Fuß
 * einer `ContentBox` und für die Meldung über einer Matrix. Mehrere Hooks einer Ansicht liefern ihren ersten Fehler
 * über `getFirstErrorDetail` (`api/getFirstErrorDetail.ts`).
 */
export function LoadStatus({ errorMessage, isLoading, children }: LoadStatusProps) {
  if (errorMessage !== null) {
    return <span className="text-danger">{errorMessage}</span>
  }
  if (isLoading) {
    return <Spinner animation="border" size="sm" />
  }
  return <>{children}</>
}
