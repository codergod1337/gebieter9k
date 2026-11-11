import ProgressBar from 'react-bootstrap/ProgressBar'
import Spinner from 'react-bootstrap/Spinner'
import { formatByteCount } from '../../components/formatByteCount.ts'

type FileDocumentLoadingProgressProps = {
  fileName: string
  receivedBytes: number
  /** 0, wenn die Länge unbekannt ist: dann nur der Kreisel */
  totalBytes: number
}

/** Solange ein Viewer die Bytes lädt: Name, Fortschrittsbalken und wie viel schon da ist. */
export function FileDocumentLoadingProgress({ fileName, receivedBytes, totalBytes }: FileDocumentLoadingProgressProps) {
  const receivedText = formatByteCount(receivedBytes)
  if (totalBytes <= 0) {
    return (
      <div className="file-viewer-loading">
        <Spinner animation="border" size="sm" className="me-2" />
        {fileName} lädt … {receivedText}
      </div>
    )
  }
  const receivedPercent = Math.round((receivedBytes / totalBytes) * 100)
  const totalText = formatByteCount(totalBytes)
  const progressText = fileName + ' lädt … ' + receivedText + ' von ' + totalText
  return (
    <div className="file-viewer-loading">
      <div className="small mb-1">{progressText}</div>
      <ProgressBar now={receivedPercent} label={receivedPercent + ' %'} />
    </div>
  )
}
