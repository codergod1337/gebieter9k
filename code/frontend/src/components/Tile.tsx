import type { ReactNode } from 'react'
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router'

type TileProps = {
  /** Bootstrap-Icon-Klassen, z. B. `bi bi-shield-lock`. */
  iconClassName: string
  title: string
  /** Ziel der Kachel, z. B. `/admin`. */
  to: string
  /** Optional oben rechts, z. B. das „i“ mit den Rechten im Hoverlay. Liegt außerhalb des Links, klickt nicht mit. */
  cornerHint?: ReactNode
}

/** Eine Kachel auf der Startseite: Symbol und Titel, ein Klick führt ins Modul; oben rechts optional ein Hinweis. */
export function Tile({ iconClassName, title, to, cornerHint }: TileProps) {
  const iconClasses = iconClassName + ' home-tile-icon d-block mb-2'
  return (
    <div className="tile-frame h-100">
      <Card as={Link} to={to} className="home-tile h-100 text-center text-decoration-none">
        <Card.Body className="d-flex flex-column justify-content-center py-4">
          <i className={iconClasses}></i>
          <span className="fw-semibold">{title}</span>
        </Card.Body>
      </Card>
      {cornerHint !== undefined && <span className="tile-corner">{cornerHint}</span>}
    </div>
  )
}
