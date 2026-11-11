import { lazy, Suspense, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { useNavigate } from 'react-router'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { getFileDocumentText } from '../FileDocument.ts'
import { getFileDocumentDownloadUrl, getFileDocumentViewUrl } from '../fileDocumentUrls.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { getFileDocumentPath } from '../fileDocumentPaths.ts'
import { FileDocumentTextViewer } from './FileDocumentTextViewer.tsx'
import { getFileDocumentViewerKind } from './fileDocumentViewerKind.ts'
import { useFileDocumentForClient } from './useFileDocumentForClient.ts'

// Word und Tabellen bringen große Bibliotheken mit (docx-preview, SheetJS): Wie in der Vorlage lädt der Browser sie
// erst, wenn wirklich so eine Datei geöffnet wird, nicht mit jeder Seite.
const FileDocumentWordViewer = lazy(async () => {
  const wordViewerModule = await import('./FileDocumentWordViewer.tsx')
  return { default: wordViewerModule.FileDocumentWordViewer }
})
const FileDocumentSpreadsheetViewer = lazy(async () => {
  const spreadsheetViewerModule = await import('./FileDocumentSpreadsheetViewer.tsx')
  return { default: spreadsheetViewerModule.FileDocumentSpreadsheetViewer }
})

/**
 * Der Viewer unter `/file-manager/file/<id>/viewer`: Bilder eingepasst (Klick wechselt auf Originalgröße und zurück),
 * Videos im Player des Browsers, der über Byte-Bereiche vorspult. HEIC-Bilder vom iPhone wandelt das Backend dafür in
 * JPEG. Word (docx) seitenweise wie in Word, Tabellen (xlsx, ods) blattweise, Text roh, wie in der Vorlage. Kann der
 * Browser ein Bild oder Video nicht zeigen (z. B. HEVC ohne Hardware-Decoder), steht darunter der Hinweis mit Download.
 * Andere Typen nur zum Herunterladen.
 */
export function FileDocumentViewerPage() {
  const masterDataHook = useMasterData()
  const fileSolrFieldNameSet = masterDataHook.fileSolrFieldNameSet
  const fileDocumentForClientHook = useFileDocumentForClient()
  const fileDocumentId = fileDocumentForClientHook.fileDocumentId
  const fileDocumentForClient = fileDocumentForClientHook.fileDocumentForClient
  const [originalSize, setOriginalSize] = useState<boolean>(false)
  const [imageFailed, setImageFailed] = useState<boolean>(false)
  const [videoFailed, setVideoFailed] = useState<boolean>(false)
  const navigate = useNavigate()
  const originNavigation = useOrigin()

  if (fileDocumentForClientHook.errorMessage !== null) {
    return <ErrorAlert message={fileDocumentForClientHook.errorMessage} />
  }
  if (fileDocumentForClient === null || fileSolrFieldNameSet === null) {
    return <Spinner animation="border" />
  }
  const fileDocument = fileDocumentForClient.document
  const fileName = getFileDocumentText(fileDocument, fileSolrFieldNameSet.fileName)
  const mimeType = fileDocument[fileSolrFieldNameSet.mimeType]
  const viewerKind = getFileDocumentViewerKind(mimeType)
  const viewUrl = getFileDocumentViewUrl(fileDocumentId)
  const downloadUrl = getFileDocumentDownloadUrl(fileDocumentId)
  const fileDocumentPath = getFileDocumentPath(fileDocumentId)

  let imageClassName = 'file-viewer-image-fit'
  let imageHint = 'Klick: Originalgröße'
  if (originalSize) {
    imageClassName = 'file-viewer-image-original'
    imageHint = 'Klick: eingepasst'
  }

  /**
   * „Details“: Kam man von der Seite der Datei, geht es im Verlauf dorthin zurück (sonst stünden beide doppelt im
   * Verlauf); sonst öffnet sie sich mit dem Viewer als Origin.
   */
  function handleShowDetails() {
    const cameFromDetails = originNavigation.isOriginPathname(fileDocumentPath)
    if (cameFromDetails) {
      originNavigation.goBackToOrigin(fileDocumentPath)
      return
    }
    const originState = originNavigation.createOriginStateHere('Viewer')
    navigate(fileDocumentPath, { state: originState })
  }

  const actions = (
    <span className="text-nowrap">
      <Button size="sm" variant="outline-secondary" className="me-1" onClick={handleShowDetails}>
        <i className="bi bi-info-circle me-1"></i>Details
      </Button>
      <Button as="a" href={downloadUrl} size="sm" variant="outline-secondary">
        <i className="bi bi-download me-1"></i>Herunterladen
      </Button>
    </span>
  )
  let footerText = 'Nur zum Herunterladen, der Browser kann diesen Typ nicht anzeigen.'
  if (viewerKind === 'IMAGE') {
    footerText = imageHint
  } else if (viewerKind === 'VIDEO') {
    footerText = 'Video, vorspulen geht.'
  } else if (viewerKind === 'WORD') {
    footerText = 'Word-Dokument, nur zum Ansehen.'
  } else if (viewerKind === 'SPREADSHEET') {
    footerText = 'Tabelle, nur zum Ansehen.'
  } else if (viewerKind === 'TEXT') {
    footerText = 'Text, so wie er in der Datei steht.'
  }
  const documentViewerLoading = <Spinner animation="border" size="sm" />

  return (
    <ContentBox title={fileName} actions={actions} footer={<span className="small">{footerText}</span>}>
      <div className="file-viewer">
        {viewerKind === 'IMAGE' && (
          <button type="button" className="file-viewer-image-button" onClick={() => setOriginalSize(!originalSize)}>
            <img src={viewUrl} alt={fileName} className={imageClassName} onError={() => setImageFailed(true)} />
          </button>
        )}
        {viewerKind === 'IMAGE' && imageFailed && (
          <ErrorAlert message="Dieses Bild lässt sich gerade nicht anzeigen. Herunterladen geht." />
        )}
        {viewerKind === 'VIDEO' && (
          <video
            src={viewUrl}
            controls
            preload="metadata"
            className="file-viewer-video"
            onError={() => setVideoFailed(true)}></video>
        )}
        {viewerKind === 'WORD' && (
          <Suspense fallback={documentViewerLoading}>
            <FileDocumentWordViewer fileDocumentId={fileDocumentId} fileName={fileName} />
          </Suspense>
        )}
        {viewerKind === 'SPREADSHEET' && (
          <Suspense fallback={documentViewerLoading}>
            <FileDocumentSpreadsheetViewer fileDocumentId={fileDocumentId} fileName={fileName} />
          </Suspense>
        )}
        {viewerKind === 'TEXT' && <FileDocumentTextViewer fileDocumentId={fileDocumentId} fileName={fileName} />}
        {viewerKind === 'VIDEO' && videoFailed && (
          <ErrorAlert message="Dieses Video kann dein Browser nicht abspielen (z. B. HEVC ohne Hardware-Decoder). Herunterladen geht." />
        )}
      </div>
    </ContentBox>
  )
}
