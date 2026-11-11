import { Outlet, useLocation } from 'react-router'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { ACCESS_ROLE_TAB_PATH } from './accessrole/accessRolePaths.ts'
import { ACCESS_ROLE_COLLECTION_TAB_PATH } from './accessrolecollection/accessRoleCollectionPaths.ts'
import {
  FILE_CLASS_ACCESS_ROLE_MATRIX_PATH,
  FILE_CLASS_DESTINATION_TAB_PATH,
  FILE_CLASS_FILE_EXTENSION_MATRIX_PATH,
  FILE_CLASS_TAB_PATH,
} from './fileclass/fileClassPaths.ts'
import { FILE_EXTENSION_TAB_PATH } from './fileextension/fileExtensionPaths.ts'
import { MAIL_TEST_TAB_PATH } from './mailtest/mailTestPaths.ts'
import { RANK_TAB_PATH } from './rank/rankPaths.ts'

/**
 * Die Tabs der Administration, in der Reihenfolge der Vorlage. Neue Tabs kommen erst dazu, wenn ihr Bereich wirklich
 * gebaut ist (in der Vorlage z. B. ARC zwischen AR und User-ARC).
 */
const ADMIN_TABS: SubheaderTab[] = [
  { label: 'User', iconClassName: 'bi bi-people', to: '/admin/users' },
  { label: 'AR', iconClassName: 'bi bi-key', to: ACCESS_ROLE_TAB_PATH },
  { label: 'ARC', iconClassName: 'bi bi-person-badge', to: ACCESS_ROLE_COLLECTION_TAB_PATH },
  { label: 'User-ARC', iconClassName: 'bi bi-diagram-3', to: '/admin/users-arc' },
  { label: 'ARC-AR', iconClassName: 'bi bi-grid-3x3', to: '/admin/arc-ar' },
  { label: 'Ränge', iconClassName: 'bi bi-trophy', to: RANK_TAB_PATH },
  { label: 'FileClass', iconClassName: 'bi bi-folder2', to: FILE_CLASS_TAB_PATH },
  { label: 'Endungen', iconClassName: 'bi bi-file-earmark', to: FILE_EXTENSION_TAB_PATH },
  { label: 'FileClass-Endung', iconClassName: 'bi bi-grid-3x3', to: FILE_CLASS_FILE_EXTENSION_MATRIX_PATH },
  { label: 'FileClass-AR', iconClassName: 'bi bi-grid-3x3', to: FILE_CLASS_ACCESS_ROLE_MATRIX_PATH },
  { label: 'FileClass-Ziel', iconClassName: 'bi bi-signpost-split', to: FILE_CLASS_DESTINATION_TAB_PATH },
  { label: 'Mail-Test', iconClassName: 'bi bi-envelope', to: MAIL_TEST_TAB_PATH },
]

/** Tabs mit einer Matrix: Sie steht ohne ContentBox direkt unter dem Subheader, bündig an beiden Rändern. */
const MATRIX_PATHS = [
  '/admin/users-arc',
  '/admin/arc-ar',
  FILE_CLASS_FILE_EXTENSION_MATRIX_PATH,
  FILE_CLASS_ACCESS_ROLE_MATRIX_PATH,
]

/**
 * Das Administrationsmodul, wie in der Vorlage: sein Subheader mit den Tabs, darunter der gewählte Tab. Den
 * Subheader bestimmt allein dieses Modul. Ein Matrix-Tab füllt den Platz unter dem Subheader (`main-matrix`), jeder
 * andere steht mittig (`main-content`).
 */
export function Admin() {
  const { pathname } = useLocation()
  const isMatrixTab = MATRIX_PATHS.some((matrixPath) => pathname.startsWith(matrixPath))
  let tabContentClassName = 'main-content'
  if (isMatrixTab) {
    tabContentClassName = 'main-matrix'
  }

  const subheaderStatus = (
    <>
      <i className="bi bi-shield-lock me-2"></i>
      Administration
    </>
  )
  return (
    <>
      <Subheader status={subheaderStatus} tabs={ADMIN_TABS} />
      <div className={tabContentClassName}>
        <Outlet />
      </div>
    </>
  )
}
