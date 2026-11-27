import Button from 'react-bootstrap/Button'
import { Hoverlay } from './Hoverlay.tsx'

type PlayButtonProps = {
  /** Was der Knopf abspielt, z. B. „Diese Umformung ansehen“: steht im Hoverlay und für Screenreader. */
  label: string
  onClick: () => void
}

/**
 * Der Abspiel-Knopf, überall gleich: ein kleines Dreieck, das etwas Bewegtes (noch einmal) zeigt, z. B. eine Umformung
 * in einer Herleitung. Was er abspielt, sagt das Hoverlay. Aussehen im Theme (`control-button-play`).
 */
export function PlayButton({ label, onClick }: PlayButtonProps) {
  return (
    <Hoverlay text={label}>
      <Button variant="outline-secondary" size="sm" className="control-button control-button-play py-0" onClick={onClick} aria-label={label}>
        <i className="bi bi-play-fill" aria-hidden="true"></i>
      </Button>
    </Hoverlay>
  )
}
