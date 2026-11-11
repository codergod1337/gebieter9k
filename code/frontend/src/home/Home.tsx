import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { adminAccessRoleKey } from '../auth/access/adminAccessRoleKey.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { Tile } from '../components/Tile.tsx'
import { FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS } from '../filemanager/fileManagerEntryAccessRoleKeys.ts'
import { HomeTileEntryAccessRolesHint } from './HomeTileEntryAccessRolesHint.tsx'
import { FILE_MANAGER_PATH } from '../filemanager/fileManagerPaths.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { MARKET_PATH } from '../market/marketPaths.ts'
import { MARKET_TEXTS } from '../market/marketTexts.ts'

/** Eine Kachel der Startseite. */
type HomeTile = {
  /** Bootstrap-Icon-Klassen, z. B. `bi bi-shield-lock`. */
  iconClassName: string
  title: string
  to: string
  /**
   * Die Rechte, von denen EINES reicht, um das Modul zu betreten. Nur wer eines hat, sieht die Kachel. Leer: jeder
   * Angemeldete. Dieselben Rechte muss die Route verlangen.
   */
  entryAccessRoleKeys: string[]
}

const HOME_TILES: HomeTile[] = [
  { iconClassName: 'bi bi-shop', title: getTextInCurrentLanguage(MARKET_TEXTS.moduleTitle), to: MARKET_PATH, entryAccessRoleKeys: [] },
  { iconClassName: 'bi bi-shield-lock', title: 'Administration', to: '/admin', entryAccessRoleKeys: [adminAccessRoleKey] },
  { iconClassName: 'bi bi-folder2-open', title: 'File-Manager', to: FILE_MANAGER_PATH, entryAccessRoleKeys: FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS },
  { iconClassName: 'bi bi-database-gear', title: 'SolrManager', to: '/solrmanager', entryAccessRoleKeys: [adminAccessRoleKey] },
  { iconClassName: 'bi bi-award', title: 'Achievements & Markt', to: '/achievement-manager', entryAccessRoleKeys: [adminAccessRoleKey] },
  { iconClassName: 'bi bi-file-earmark-binary', title: 'Tika-Test', to: '/tika-test', entryAccessRoleKeys: [adminAccessRoleKey] },
  { iconClassName: 'bi bi-emoji-smile', title: 'Icon-Manager', to: '/icon-manager', entryAccessRoleKeys: [adminAccessRoleKey] },
]

/**
 * Die Startseite: Kacheln zu den Modulen, oben rechts je ein „i“ mit den Rechten, die das Modul öffnen (Hoverlay).
 * Jeder sieht nur die Kacheln der Module, die er betreten darf. Ohne
 * Subheader, wie in der Vorlage.
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
