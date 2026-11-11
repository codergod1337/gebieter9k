import Button from 'react-bootstrap/Button'
import { useOrigin } from './useOrigin.ts'

/** Wohin der Knopf ohne Platz im Verlauf führt: die Startseite (kommt nur bei kaputtem State vor). */
const ORIGIN_BACK_FALLBACK_PATH = '/'

/**
 * Der Knopf „Zurück zu <label>“ im Header, wie in der Vorlage: nur solange ein Origin mitgegeben ist, also nachdem man
 * von einer Seite aus eine Unterseite geöffnet hat. Er springt im Verlauf zurück ({@link useOrigin}), die Seite kommt
 * mit ihren Parametern, ihrem Zwischenspeicher und ihrer Scrollhöhe wieder. Aussehen im Theme (`.header-back`).
 */
export function OriginBackButton() {
  const originNavigation = useOrigin()
  const origin = originNavigation.origin
  if (origin === null) {
    return null
  }
  const buttonText = 'Zurück zu ' + origin.label

  return (
    <Button
      variant="outline-light"
      size="sm"
      className="header-back"
      onClick={() => originNavigation.goBackToOrigin(ORIGIN_BACK_FALLBACK_PATH)}>
      <i className="bi bi-arrow-left" aria-hidden="true"></i>
      <span className="header-back-text">{buttonText}</span>
    </Button>
  )
}
