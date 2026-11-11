import type { ReactNode } from 'react'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

type FormCardProps = {
  /** Bootstrap-Icon-Klassen, z. B. `bi bi-box-arrow-in-right`. */
  iconClassName: string
  title: string
  children: ReactNode
}

/** Eine mittig gesetzte Karte mit Icon und Titel für ein Formular. Global: Login und Registrierung. */
export function FormCard({ iconClassName, title, children }: FormCardProps) {
  const iconClasses = iconClassName + ' me-2'
  return (
    <Row className="justify-content-center">
      <Col sm={10} md={7} lg={5}>
        <Card className="form-card">
          <Card.Body>
            <Card.Title className="form-card-title mb-3">
              <i className={iconClasses}></i>
              {title}
            </Card.Title>
            {children}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
