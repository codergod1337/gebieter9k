import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Tile } from '../components/Tile.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { HOME_TILES } from './homeTiles.ts'
import { VISITOR_TILES_TEXTS } from './visitorTilesTexts.ts'

/**
 * Die Kacheln für Besucher ohne Konto, unter Login und Registrierung: die Module der Startseite, die auch ohne
 * Anmeldung gehen (`visibleWithoutLogin` in {@link HOME_TILES}), z. B. die Wissensdatenbank zum Ansehen. Dieselbe
 * Kachel wie auf der Startseite, nur ohne das „i“ mit den Rechten: Es gibt hier keins, das man bräuchte.
 */
export function VisitorTiles() {
  const visitorTiles = HOME_TILES.filter((homeTile) => homeTile.visibleWithoutLogin)

  if (visitorTiles.length === 0) {
    return null
  }
  return (
    <div className="visitor-tiles">
      <p className="visitor-tiles-heading">{getTextInCurrentLanguage(VISITOR_TILES_TEXTS.heading)}</p>
      <Row className="g-3 justify-content-center">
        {visitorTiles.map((visitorTile) => (
          <Col key={visitorTile.to} xs={6} md={4} lg={3}>
            <Tile iconClassName={visitorTile.iconClassName} title={visitorTile.title} to={visitorTile.to} />
          </Col>
        ))}
      </Row>
    </div>
  )
}
