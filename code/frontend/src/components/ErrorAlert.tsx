import Alert from 'react-bootstrap/Alert'

type ErrorAlertProps = {
  /** Die Fehlermeldung, z. B. `error.detail` aus einem Hook. Bei `null` wird nichts angezeigt. */
  message: string | null
}

/** Zeigt eine Fehlermeldung einheitlich an. Global: von mehreren Modulen genutzt. */
export function ErrorAlert({ message }: ErrorAlertProps) {
  if (message === null) {
    return null
  }
  return <Alert variant="danger">{message}</Alert>
}
