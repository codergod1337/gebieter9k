import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { Tile } from '../components/Tile.tsx'
import { HOME_TILES, type HomeTile } from './homeTiles.ts'
import { HomeTileEntryAccessRolesHint } from './HomeTileEntryAccessRolesHint.tsx'

/**
 * Die Startseite: Kacheln zu den Modulen ({@link HOME_TILES}), oben rechts je ein „i“ mit den Rechten, die das Modul
 * öffnen (Hoverlay). Jeder sieht nur die Kacheln der Module, die er betreten darf. Ohne Subheader, wie in der Vorlage.
 */
export function Home() {
  const { hasAccessRole } = useCurrentSession()

  const visibleTiles: HomeTile[] = []
  for (const homeTile of HOME_TILES) {
    const openForEveryone = homeTile.entryAccessRoleKeys.length === 0
    const currentUsersMayEnter = homeTile.entryAccessRoleKeys.some(hasAccessRole)
    if (openForEveryone || currentUsersMayEnter) {
      visibleTiles.push(homeTile)
    }
  }

  if (visibleTiles.length === 0) {
    return (
      <div className="main-content">
        <p className="text-body-secondary">Für dich gibt es noch keine Module.</p>
      </div>
    )
  }
  return (
    <div className="main-content">
      <Row className="g-3">
        {visibleTiles.map((homeTile) => (
          <Col key={homeTile.to} xs={6} md={4} lg={3}>
            <Tile
              iconClassName={homeTile.iconClassName}
              title={homeTile.title}
              to={homeTile.to}
              cornerHint={<HomeTileEntryAccessRolesHint entryAccessRoleKeys={homeTile.entryAccessRoleKeys} />}
            />
          </Col>
        ))}
      </Row>
    </div>
  )
}
