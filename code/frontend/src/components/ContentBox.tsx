import type { ReactNode } from 'react'
import Card from 'react-bootstrap/Card'

type ContentBoxProps = {
  title: string
  /** Rechts im Kopf, z. B. der Knopf „neuer User“. */
  actions?: ReactNode
  /** Der Fuß ist immer da, nur sein Inhalt ist freiwillig: z. B. Anzahl, Ladeanzeige oder Fehler. */
  footer?: ReactNode
  children: ReactNode
}

/**
 * Die ContentBox, wie in der Vorlage: Kopf mit Titel (`contentbox-header`), der Inhalt (`contentbox-main`), darunter
 * der Fuß (`contentbox-footer`). In ihr stehen auch Tabellen. Eine Bootstrap-Card mit eigenen Klassen statt
 * Bootstrap-Utilities: Abstände stehen in `base.css`, Farben, Rahmen und Rundung gestaltet das Theme.
 */
export function ContentBox({ title, actions, footer, children }: ContentBoxProps) {
  return (
    <Card className="contentbox">
      <Card.Header className="contentbox-header">
        <span className="contentbox-title">{title}</span>
        {actions}
      </Card.Header>
      <Card.Body className="contentbox-main">{children}</Card.Body>
      <Card.Footer className="contentbox-footer">{footer}</Card.Footer>
    </Card>
  )
}
