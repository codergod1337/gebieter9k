import ProgressBar from 'react-bootstrap/ProgressBar'
import Spinner from 'react-bootstrap/Spinner'
import type { FileUploadRow } from './useFileUploadList.ts'

type FileUploadRowStatusProps = {
  row: FileUploadRow
  /** Nimmt die gewählte FileClass die Endung dieser Datei an? */
  isFileExtensionAllowed: boolean
}

/**
 * Der Stand einer Datei der Upload-Liste: Prüfsumme, Prüfung, bereit, wartet auf einen Upload-Kanal, gibt es schon,
 * Fortschritt, fertig oder Fehler.
 */
export function FileUploadRowStatus({ row, isFileExtensionAllowed }: FileUploadRowStatusProps) {
  if (row.state === 'HASHING') {
    let hashingText = 'Prüfsumme …'
    if (row.uploadQueued) {
      hashingText = 'Prüfsumme … (wartet auf Upload)'
    }
    return (
      <div>
        <span className="small">{hashingText}</span>
        <ProgressBar now={row.progressPercent} className="file-upload-progress" />
      </div>
    )
  }
  if (row.uploadQueued) {
    return (
      <span className="badge text-bg-info">
        <i className="bi bi-hourglass-split me-1"></i>wartet auf Upload
      </span>
    )
  }
  if (row.state === 'CHECKING') {
    return (
      <span className="small">
        <Spinner animation="border" size="sm" className="me-1" />
        Prüfe …
      </span>
    )
  }
  if (row.state === 'UPLOADING' && row.progressPercent >= 100) {
    // Alles gesendet: Das Backend prüft Typ und Dublette und checkt die Datei in Solr ein (Sekunden); SFTP und Tika
    // laufen danach im Hintergrund
    return (
      <span className="small">
        <Spinner animation="border" size="sm" className="me-1" />
        Wird verarbeitet …
      </span>
    )
  }
  if (row.state === 'UPLOADING') {
    const progressText = row.progressPercent + ' %'
    return (
      <div>
        <span className="small">Lädt hoch … {progressText}</span>
        <ProgressBar now={row.progressPercent} className="file-upload-progress" />
      </div>
    )
  }
  if (row.state === 'DONE') {
    return (
      <span className="badge text-bg-success">
        <i className="bi bi-check-lg me-1"></i>hochgeladen
      </span>
    )
  }
  if (row.state === 'EXISTS') {
    let existsText = 'gibt es schon'
    if (row.existingDocument === null) {
      existsText = 'gibt es schon, du darfst sie nicht sehen'
    }
    return <span className="badge text-bg-warning">{existsText}</span>
  }
  if (row.state === 'FAILED') {
    return <span className="small text-danger">{row.message}</span>
  }
  if (!isFileExtensionAllowed) {
    const notAllowedText = 'Endung .' + row.fileExtension + ' hier nicht erlaubt'
    return <span className="badge text-bg-danger">{notAllowedText}</span>
  }
  return <span className="badge text-bg-secondary">bereit</span>
}
