import { adminAccessRoleKey } from '../auth/access/adminAccessRoleKey.ts'
import { FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS } from '../filemanager/fileManagerEntryAccessRoleKeys.ts'
import { FILE_MANAGER_PATH } from '../filemanager/fileManagerPaths.ts'
import { KNOWLEDGE_ICON_CLASS_NAME } from '../knowledge/knowledgeIcon.ts'
import { KNOWLEDGE_PATH } from '../knowledge/knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from '../knowledge/knowledgeTexts.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { MARKET_PATH } from '../market/marketPaths.ts'
import { MARKET_TEXTS } from '../market/marketTexts.ts'

/** Eine Kachel der Startseite. */
export type HomeTile = {
  /** Bootstrap-Icon-Klassen, z. B. `bi bi-shield-lock`. */
  iconClassName: string
  title: string
  to: string
  /**
   * Die Rechte, von denen EINES reicht, um das Modul zu betreten. Nur wer eines hat, sieht die Kachel. Leer: jeder
   * Angemeldete. Dieselben Rechte muss die Route verlangen.
   */
  entryAccessRoleKeys: string[]
  /**
   * Ob das Modul auch ohne Anmeldung geht: Dann steht seine Kachel zusätzlich auf der Login-Seite
   * ({@link VisitorTiles}). Seine Route muss dafür vor der Prüfung der Sitzung stehen (`App.tsx`).
   */
  visibleWithoutLogin: boolean
}

/** Alle Kacheln in der Reihenfolge der Startseite. Ein neues Modul bekommt hier seinen Eintrag. */
export const HOME_TILES: HomeTile[] = [
  {
    iconClassName: 'bi bi-shop',
    title: getTextInCurrentLanguage(MARKET_TEXTS.moduleTitle),
    to: MARKET_PATH,
    entryAccessRoleKeys: [],
    visibleWithoutLogin: false,
  },
  {
    iconClassName: KNOWLEDGE_ICON_CLASS_NAME,
    title: getTextInCurrentLanguage(KNOWLEDGE_TEXTS.moduleTitle),
    to: KNOWLEDGE_PATH,
    entryAccessRoleKeys: [],
    visibleWithoutLogin: true,
  },
  {
    iconClassName: 'bi bi-shield-lock',
    title: 'Administration',
    to: '/admin',
    entryAccessRoleKeys: [adminAccessRoleKey],
    visibleWithoutLogin: false,
  },
  {
    iconClassName: 'bi bi-folder2-open',
    title: 'File-Manager',
    to: FILE_MANAGER_PATH,
    entryAccessRoleKeys: FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS,
    visibleWithoutLogin: false,
  },
  {
    iconClassName: 'bi bi-database-gear',
    title: 'SolrManager',
    to: '/solrmanager',
    entryAccessRoleKeys: [adminAccessRoleKey],
    visibleWithoutLogin: false,
  },
  {
    iconClassName: 'bi bi-award',
    title: 'Achievements & Markt',
    to: '/achievement-manager',
    entryAccessRoleKeys: [adminAccessRoleKey],
    visibleWithoutLogin: false,
  },
  {
    iconClassName: 'bi bi-file-earmark-binary',
    title: 'Tika-Test',
    to: '/tika-test',
    entryAccessRoleKeys: [adminAccessRoleKey],
    visibleWithoutLogin: false,
  },
  {
    iconClassName: 'bi bi-emoji-smile',
    title: 'Icon-Manager',
    to: '/icon-manager',
    entryAccessRoleKeys: [adminAccessRoleKey],
    visibleWithoutLogin: false,
  },
]
