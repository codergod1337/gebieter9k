import { Outlet } from 'react-router'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { FILE_MANAGER_FILES_PATH, FILE_MANAGER_UPLOAD_PATH } from './fileManagerPaths.ts'

/** Die Tabs des File-Managers. */
const FILE_MANAGER_TABS: SubheaderTab[] = [
  { label: 'Hochladen', iconClassName: 'bi bi-upload', to: FILE_MANAGER_UPLOAD_PATH },
  { label: 'Dateien', iconClassName: 'bi bi-files', to: FILE_MANAGER_FILES_PATH },
]

/**
 * Das Modul File-Manager (ADMIN oder FILE_MANAGER), nach dem DMS der Vorlage: Dateien hochladen, ansehen, ihre Metadaten
 * bearbeiten, im Viewer zeigen und herunterladen. Den Upload für normale User bauen wir später gezielt dort, wo er
 * gebraucht wird. Subheader mit den Tabs, darunter die gewählte Seite.
 */
export function FileManager() {
  const subheaderStatus = (
    <>
      <i className="bi bi-folder2-open me-2"></i>
      File-Manager
    </>
  )
  return (
    <>
      <Subheader status={subheaderStatus} tabs={FILE_MANAGER_TABS} />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  )
}
