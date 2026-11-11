import { renderAsync, type Options } from 'docx-preview'
import { useEffect, useRef, useState } from 'react'
import { useFileDocumentBlob } from '../useFileDocumentBlob.ts'
import { FileDocumentLoadingProgress } from './FileDocumentLoadingProgress.tsx'
import { removeUnsafeLinks } from './removeUnsafeLinks.ts'

type FileDocumentWordViewerProps = {
  fileDocumentId: string
  fileName: string
}

/** Wie das Rendern zu welchen Bytes ausging: fertig, mit Fehler oder ohne. */
type RenderedDocument = {
  blob: Blob
  errorMessage: string | null
}

/**
 * So rendert docx-preview ein fremdes Dokument: ohne eingebettetes HTML (`altChunk`). Sonst setzte docx-preview dieses
 * HTML als iframe ohne Sandbox in die Seite (geprüft 2026-11-10 mit docx-preview 0.4.1), und ein Skript darin liefe mit
 * der Sitzung dessen, der das Dokument ansieht. Text, Bilder, Tabellen und Formatierung des Dokuments baut docx-preview
 * selbst aus einzelnen Elementen, nie aus rohem HTML; die bleiben vollständig.
 */
const WORD_RENDER_OPTIONS: Partial<Options> = { renderAltChunks: false }

/**
 * Word im Viewer, wie der WordViewer der Vorlage, nur docx: docx-preview rendert das Dokument seitenweise als HTML in
 * den Container, Seiten weiß auf grauem Grund wie in Word. Reine Anzeige, kein Bearbeiten; wer die Datei braucht, nimmt
 * den Download. Eingebettetes HTML wird nicht gezeigt ({@link WORD_RENDER_OPTIONS}). Links aus dem Dokument behalten ihr
 * Ziel nur, wenn es eine Webseite oder E-Mail-Adresse ist.
 */
export function FileDocumentWordViewer({ fileDocumentId, fileName }: FileDocumentWordViewerProps) {
  const fileDocumentBlobHook = useFileDocumentBlob(fileDocumentId)
  const blob = fileDocumentBlobHook.blob
  const documentContainerRef = useRef<HTMLDivElement>(null)
  const [renderedDocument, setRenderedDocument] = useState<RenderedDocument | null>(null)

  useEffect(() => {
    const documentContainer = documentContainerRef.current
    if (blob === null || documentContainer === null) {
      return
    }
    let active = true
    documentContainer.replaceChildren()
    // ohne eigenen Container für die Styles: docx-preview legt sie dann in den Container des Dokuments
    const styleContainer = undefined
    renderAsync(blob, documentContainer, styleContainer, WORD_RENDER_OPTIONS)
      .then(() => {
        if (!active) {
          return
        }
        removeUnsafeLinks(documentContainer)
        setRenderedDocument({ blob, errorMessage: null })
      })
      .catch((caughtError: unknown) => {
        if (!active) {
          return
        }
        let renderErrorMessage = 'Das Dokument ließ sich nicht anzeigen. Herunterladen geht.'
        if (caughtError instanceof Error && caughtError.message !== '') {
          renderErrorMessage = renderErrorMessage + ' (' + caughtError.message + ')'
        }
        setRenderedDocument({ blob, errorMessage: renderErrorMessage })
      })
    return () => {
      active = false
      documentContainer.replaceChildren()
    }
  }, [blob])

  let currentRenderedDocument: RenderedDocument | null = null
  if (renderedDocument !== null && renderedDocument.blob === blob) {
    currentRenderedDocument = renderedDocument
  }
  const isRendering = fileDocumentBlobHook.errorMessage === null && currentRenderedDocument === null
  return (
    <div className="file-viewer-document" aria-label={fileName}>
      {fileDocumentBlobHook.errorMessage !== null && (
        <p className="text-danger mb-0">{fileDocumentBlobHook.errorMessage}</p>
      )}
      {currentRenderedDocument !== null && currentRenderedDocument.errorMessage !== null && (
        <p className="text-danger mb-0">{currentRenderedDocument.errorMessage}</p>
      )}
      {isRendering && (
        <FileDocumentLoadingProgress
          fileName={fileName}
          receivedBytes={fileDocumentBlobHook.receivedBytes}
          totalBytes={fileDocumentBlobHook.totalBytes}
        />
      )}
      <div ref={documentContainerRef} />
    </div>
  )
}
