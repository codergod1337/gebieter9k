import { useCallback, useEffect, useRef, useState } from 'react'
import type { FileAnalysisProgress } from '../FileAnalysisProgress.ts'
import { fileAnalysisPollMilliseconds } from '../fileAnalysisPollMilliseconds.ts'
import type { FileDocument, FileUploadResult } from '../FileDocument.ts'
import { useFileDocument } from '../useFileDocument.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useSessionState } from '../../navigation/useSessionState.ts'

/** Eine Datei, die gerade hochgeladen wurde: ihr Dokument, so wie das Backend es zuletzt geliefert hat. */
export type RecentFileUpload = {
  id: string
  fileName: string
  /** `null`, wenn der User das Dokument nicht lesen darf (dann gibt es auch keine Auswertung zu sehen) */
  document: FileDocument | null
}

/**
 * Die zuletzt hochgeladenen Dateien einer Upload-Seite, samt dem Stand ihrer Auswertung (Platz in der Warteschlange,
 * laufender Schritt; `analysisProgressById`). Je Runde fragt der Hook erst diesen Stand ab und holt das Dokument nur für
 * Dateien, die nicht mehr in der Schlange stehen.
 * `stateKey`: Unter diesem Schlüssel bleibt die Liste gemerkt, je Upload-Seite ein eigener (File-Manager, je Galerie).
 * `onAnalysisCompleted`: wird gerufen, sobald die Auswertung einer Datei fertig ist (z. B. lädt die Galerie dann ihre
 * Bilder mit der Vorschau neu). Solange die Auswertung einer Datei im Backend wartet (Tika,
 * Texterkennung, EXIF, Vorschau), fragt der Hook alle {@link fileAnalysisPollMilliseconds} nach und übernimmt das neue
 * Dokument. Sind alle fertig, fragt er nicht mehr. Wer die Seite verlässt, verpasst nichts: Die Auswertung läuft im
 * Backend weiter, und die Liste bleibt bis zum Abmelden gemerkt ({@link useSessionState}). Zurück aus einer Datei zeigt
 * sie also wieder.
 */
export function useRecentFileUploads(stateKey: string, onAnalysisCompleted?: () => void) {
  const masterDataHook = useMasterData()
  const fileSolrFieldNameSet = masterDataHook.fileSolrFieldNameSet
  const fileAnalysisStatusValueSet = masterDataHook.fileAnalysisStatusValueSet
  const fileDocumentHook = useFileDocument()
  const getFileDocumentForClient = fileDocumentHook.getFileDocumentForClient
  const resolveFileAnalysisProgress = fileDocumentHook.resolveFileAnalysisProgress
  /** Der zuletzt abgefragte Stand der Auswertung je Datei (Warteschlange, Schritt). */
  const [analysisProgressById, setAnalysisProgressById] = useState<Record<string, FileAnalysisProgress>>({})
  const [recentFileUploads, setRecentFileUploads] = useSessionState<RecentFileUpload[]>(stateKey, [])
  const recentFileUploadsRef = useRef<RecentFileUpload[]>([])
  const isPollingRef = useRef<boolean>(false)
  const onAnalysisCompletedRef = useRef<(() => void) | undefined>(onAnalysisCompleted)

  useEffect(() => {
    onAnalysisCompletedRef.current = onAnalysisCompleted
  })

  useEffect(() => {
    recentFileUploadsRef.current = recentFileUploads
  })

  /** Wartet die Auswertung dieser Datei noch? */
  const isAnalysisPending = useCallback(
    (recentFileUpload: RecentFileUpload): boolean => {
      if (recentFileUpload.document === null || fileSolrFieldNameSet === null || fileAnalysisStatusValueSet === null) {
        return false
      }
      const analysisStatus = recentFileUpload.document[fileSolrFieldNameSet.analysisStatus]
      return analysisStatus === fileAnalysisStatusValueSet.pending
    },
    [fileSolrFieldNameSet, fileAnalysisStatusValueSet],
  )

  /** Nimmt eine neu hochgeladene Datei oben in die Liste. */
  const addRecentFileUpload = useCallback((uploadResult: FileUploadResult, fileName: string) => {
    const recentFileUpload: RecentFileUpload = { id: uploadResult.id, fileName, document: uploadResult.document }
    setRecentFileUploads((currentFileUploads) => [recentFileUpload, ...currentFileUploads])
  }, [setRecentFileUploads])

  /** Fragt jede Datei, deren Auswertung noch wartet, einmal neu ab. Nie zwei Runden gleichzeitig. */
  const pollPendingAnalyses = useCallback(async () => {
    if (isPollingRef.current) {
      return
    }
    isPollingRef.current = true
    try {
      const pendingFileUploads = recentFileUploadsRef.current.filter(isAnalysisPending)
      if (pendingFileUploads.length === 0) {
        return
      }
      // Erst der Stand aus dem Hauptspeicher des Backends: Wartet die Datei noch oder läuft sie, gibt es nichts Neues
      const pendingIds = pendingFileUploads.map((pendingFileUpload) => pendingFileUpload.id)
      const fileAnalysisProgresses = await resolveFileAnalysisProgress(pendingIds)
      const progressById: Record<string, FileAnalysisProgress> = {}
      for (const fileAnalysisProgress of fileAnalysisProgresses ?? []) {
        progressById[fileAnalysisProgress.fileDocumentId] = fileAnalysisProgress
      }
      setAnalysisProgressById(progressById)
      for (const pendingFileUpload of pendingFileUploads) {
        const pendingProgress = progressById[pendingFileUpload.id]
        const stillInQueue = pendingProgress !== undefined && pendingProgress.state !== 'NOT_QUEUED'
        if (stillInQueue) {
          continue
        }
        const fileDocumentForClient = await getFileDocumentForClient(pendingFileUpload.id)
        if (fileDocumentForClient === null) {
          continue
        }
        const refreshedDocument = fileDocumentForClient.document
        const refreshedFileUpload: RecentFileUpload = { ...pendingFileUpload, document: refreshedDocument }
        const analysisCompleted = !isAnalysisPending(refreshedFileUpload)
        if (analysisCompleted && onAnalysisCompletedRef.current !== undefined) {
          onAnalysisCompletedRef.current()
        }
        setRecentFileUploads((currentFileUploads) =>
          currentFileUploads.map((currentFileUpload) => {
            if (currentFileUpload.id !== pendingFileUpload.id) {
              return currentFileUpload
            }
            return { ...currentFileUpload, document: refreshedDocument }
          }),
        )
      }
    } finally {
      isPollingRef.current = false
    }
  }, [getFileDocumentForClient, resolveFileAnalysisProgress, isAnalysisPending, setRecentFileUploads])

  const hasPendingAnalysis = recentFileUploads.some(isAnalysisPending)
  useEffect(() => {
    if (!hasPendingAnalysis) {
      return
    }
    const pollTimer = window.setInterval(() => {
      void pollPendingAnalyses()
    }, fileAnalysisPollMilliseconds)
    return () => window.clearInterval(pollTimer)
  }, [hasPendingAnalysis, pollPendingAnalyses])

  return { recentFileUploads, addRecentFileUpload, isAnalysisPending, analysisProgressById }
}
