import Button from 'react-bootstrap/Button'
import { Link } from 'react-router'
import { DeleteButton } from '../../components/DeleteButton.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { getFileDocumentDownloadUrl } from '../fileDocumentUrls.ts'
import { getFileDocumentViewerPath } from '../fileDocumentPaths.ts'

type FileDocumentActionButtonsProps = {
  fileDocumentId: string
  fileName: string
  /** Viewer nur für Typen, die sich im Browser zeigen lassen (Bilder, Videos, Word, Tabellen, Text). */
  hasViewer: boolean
  /** Ändern und Löschen nur, wenn der User darf. */
  changeable: boolean
  onEdit?: () => void
  onDelete?: () => void
  /** Der Router-State für die Links (Viewer, Details), z. B. der Origin der Seite, von der aus sie geöffnet werden. */
  linkState?: unknown
  /** Mit Pfad der Knopf „Details“ (Info) zur Seite der Datei; auf der Seite selbst entfällt er. */
  detailsPath?: string
}

/**
 * Die Aktionen an einer Datei, überall dieselben in derselben Reihenfolge (wie in der Vorlage): Auge (Viewer), Info
 * (Details), Download, Stift, Mülleimer. Stift und Mülleimer nur, wenn der User die Datei ändern darf und der Aufrufer
 * sie anbietet.
 */
export function FileDocumentActionButtons({
  fileDocumentId,
  fileName,
  hasViewer,
  changeable,
  onEdit,
  onDelete,
  linkState,
  detailsPath,
}: FileDocumentActionButtonsProps) {
  const viewerPath = getFileDocumentViewerPath(fileDocumentId)
  const downloadUrl = getFileDocumentDownloadUrl(fileDocumentId)
  const viewerLabel = fileName + ' ansehen'
  const downloadLabel = fileName + ' herunterladen'
  const detailsLabel = fileName + ': Details'
  return (
    <span className="text-nowrap">
      {hasViewer && (
        <Hoverlay text="Ansehen">
          <Link to={viewerPath} state={linkState} className="btn btn-sm btn-outline-secondary me-1" aria-label={viewerLabel}>
            <i className="bi bi-eye"></i>
          </Link>
        </Hoverlay>
      )}
      {detailsPath !== undefined && (
        <Hoverlay text="Details">
          <Link to={detailsPath} state={linkState} className="btn btn-sm btn-outline-secondary me-1" aria-label={detailsLabel}>
            <i className="bi bi-info-circle"></i>
          </Link>
        </Hoverlay>
      )}
      <Hoverlay text="Herunterladen">
        <Button as="a" href={downloadUrl} size="sm" variant="outline-secondary" className="me-1" aria-label={downloadLabel}>
          <i className="bi bi-download"></i>
        </Button>
      </Hoverlay>
      {changeable && onEdit !== undefined && <EditButton label={fileName + ' bearbeiten'} onClick={onEdit} />}
      {changeable && onDelete !== undefined && <DeleteButton label={fileName + ' löschen'} onClick={onDelete} />}
    </span>
  )
}
