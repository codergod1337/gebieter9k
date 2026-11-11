import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadMaxParallelUploads } from '../../components/uploadMaxParallelUploads.ts'
import { createFileSha256Hex } from '../createFileSha256Hex.ts'
import type { UploadProgressListener } from '../../api/ApiRequest.ts'
import type { ApiDataOrError } from '../../api/useApiRequest.ts'
import type { FileDocument, FileUploadResult } from '../FileDocument.ts'
import { getFileExtensionOfFileName } from '../FileExtension.ts'
import { useFileDocument } from '../useFileDocument.ts'
import type { SolrFieldInputValue } from '../../solr/solrFieldInputValue.ts'

/**
 * Wo eine Datei der Liste steht:
 * HASHING (SHA-256 läuft), CHECKING (Backend wird gefragt, ob es sie gibt), READY (bereit), EXISTS (gibt es schon, wird
 * nicht hochgeladen), UPLOADING, DONE, FAILED (Grund in `message`, derselbe Knopf versucht es erneut). Ob sie auf einen
 * Upload-Kanal wartet, sagt `uploadQueued`: Dabei rechnet ihre Prüfsumme weiter.
 */
export type FileUploadRowState = 'HASHING' | 'CHECKING' | 'READY' | 'EXISTS' | 'UPLOADING' | 'DONE' | 'FAILED'

/** Eine Datei der Upload-Liste mit allem, was die Zeile zeigt. */
export type FileUploadRow = {
  /** Woran die Datei in der Liste erkannt wird: Name, Größe, Änderungszeit (wie in der FileDropzone). */
  rowKey: string
  file: File
  /** klein, ohne Punkt */
  fileExtension: string
  state: FileUploadRowState
  /** Eingereiht, wartet auf einen freien Upload-Kanal */
  uploadQueued: boolean
  /** Fortschritt des Hashens bzw. Hochladens, 0 bis 100 */
  progressPercent: number
  /** `null`, solange er läuft oder wenn der Upload vorher begonnen hat (dann rechnet ihn nur das Backend) */
  sha256Hex: string | null
  /** Bei EXISTS das vorhandene Dokument, wenn der User es lesen darf */
  existingDocument: FileDocument | null
  /** Bei DONE das neue Dokument */
  uploadedDocument: FileDocument | null
  /** Grund bei FAILED */
  message: string | null
  /** Die Eingaben je Datei (z. B. Dateiname, Titel), unter dem Solr-Namen */
  inputValuesByFieldName: Record<string, SolrFieldInputValue>
}

/** Was eine neue Zeile je Datei vorbelegt bekommt. */
export type CreateRowInputValues = (file: File) => Record<string, SolrFieldInputValue>

/** Baut je Zeile den Body des Uploads (gemeinsame Werte plus die der Zeile), erst wenn ihr Kanal frei wird. */
export type CreateClientFieldValues = (row: FileUploadRow) => Record<string, unknown>

/**
 * Schickt EINE Datei zum Backend: `data` (die Felder des Clients) und die Bytes. Der File-Manager lädt über
 * `/api/file-manager/file-document/upload` hoch, die Galerie über `/api/gallery/upload`; sonst ist der Ablauf derselbe.
 */
export type UploadFileFunction = (
  file: File,
  clientFieldValues: Record<string, unknown>,
  onUploadProgress: UploadProgressListener,
  abortSignal: AbortSignal,
) => Promise<ApiDataOrError<FileUploadResult>>

/** Meldet eine neu angelegte Datei sofort, nicht erst am Ende der Liste. */
export type OnRowUploaded = (rowKey: string, uploadResult: FileUploadResult) => void

/** Zustände, in denen eine Zeile hochgeladen werden kann (FAILED: derselbe Knopf versucht es erneut). */
export const UPLOADABLE_ROW_STATES: FileUploadRowState[] = ['HASHING', 'CHECKING', 'READY', 'FAILED']

/** Ein Eintrag der Upload-Warteschlange. */
type QueuedUpload = {
  rowKey: string
  createClientFieldValues: CreateClientFieldValues
  onUploaded: OnRowUploaded
  /** beendet das Warten des Aufrufers auf diese Zeile: das Ergebnis oder `null` */
  finish: (uploadResult: FileUploadResult | null) => void
}

/**
 * So viele Prüfsummen laufen gleichzeitig, je eine in einem eigenen Worker: so viele, wie der Rechner Kerne meldet
 * (Wunsch des Nutzers 2026-11-08: im Browser volle Kraft, nur das Backend schonen).
 */
const HASH_LANE_COUNT = Math.max(1, navigator.hardwareConcurrency || 1)

/** Woran zwei Dateien als dieselbe gelten, wie in der FileDropzone. */
export function getFileRowKey(file: File): string {
  return file.name + '|' + file.size + '|' + file.lastModified
}

function getPercent(doneBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) {
    return 100
  }
  const percent = (doneBytes / totalBytes) * 100
  return Math.round(percent)
}

/**
 * Die Upload-Liste als Hook, für jeden Upload-Weg derselbe (File-Manager, Galerie): hält je Datei eine Zeile. Wohin
 * hochgeladen wird, bestimmt `uploadFile`.
 *
 * - **Prüfsummen:** Jede neue Datei bekommt sofort ihren SHA-256, alle gleichzeitig auf allen Kernen (je ein Worker),
 *   danach die Frage ans Backend, ob es die Bytes schon gibt. Jede Größe.
 * - **Hochladen:** `enqueueUploads` reiht ein, auch während schon etwas hochlädt. Höchstens
 *   {@link uploadMaxParallelUploads} Dateien gehen gleichzeitig zum Backend (`VITE_UPLOAD_MAX_PARALLEL_UPLOADS`), die
 *   Kanäle sind belegt, solange etwas wartet. Eine wartende Datei rechnet ihre Prüfsumme weiter; ist sie eine Dublette,
 *   fällt sie heraus, bevor sie hochgeht. Beginnt ihr Upload, hört die Prüfsumme auf: Das Backend rechnet sie ohnehin.
 * - Ein Fehlschlag beendet nichts: Die Zeile bekommt den Grund und bleibt stehen.
 * - **Verlassen der Seite bricht alles ab** (Vorgabe des Nutzers 2026-11-09: Wer hochlädt, lässt die Seite offen):
 *   laufende Uploads, die Warteschlange und die Prüfsummen. Das Backend verwirft die halbe Teil-Datei selbst.
 */
export function useFileUploadList(createRowInputValues: CreateRowInputValues, uploadFile: UploadFileFunction) {
  const fileDocumentHook = useFileDocument()
  const getFileDocumentExistence = fileDocumentHook.getFileDocumentExistence
  const [rows, setRows] = useState<FileUploadRow[]>([])
  const [activeUploadCount, setActiveUploadCount] = useState<number>(0)
  // Für die Abläufe, die nach dem Rendern weiterlaufen: der neueste Stand und die beiden Warteschlangen
  const rowsRef = useRef<FileUploadRow[]>([])
  const hashQueueRef = useRef<string[]>([])
  const activeHashLaneCountRef = useRef<number>(0)
  const uploadQueueRef = useRef<QueuedUpload[]>([])
  const activeUploadCountRef = useRef<number>(0)
  const pumpUploadQueueRef = useRef<() => void>(() => {})
  /** Gilt, solange die Seite offen ist; beim Verlassen bricht er alles ab. */
  const leavingAbortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    rowsRef.current = rows
  })

  // Beim Verlassen der Seite: laufende Uploads abbrechen, Warteschlange und Prüfsummen leeren
  useEffect(() => {
    const leavingAbortController = new AbortController()
    leavingAbortControllerRef.current = leavingAbortController
    return () => {
      leavingAbortController.abort()
      hashQueueRef.current = []
      const waitingUploads = uploadQueueRef.current
      uploadQueueRef.current = []
      for (const waitingUpload of waitingUploads) {
        waitingUpload.finish(null)
      }
    }
  }, [])

  const changeRow = useCallback((rowKey: string, changeRowFields: (row: FileUploadRow) => Partial<FileUploadRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.rowKey !== rowKey) {
          return row
        }
        const changedFields = changeRowFields(row)
        return { ...row, ...changedFields }
      }),
    )
  }, [])

  /** Prüfsumme und Existenzcheck einer Zeile. Läuft nur, solange sie noch nicht hochlädt. */
  const hashRow = useCallback(
    async (rowKey: string) => {
      const row = rowsRef.current.find((currentRow) => currentRow.rowKey === rowKey)
      if (row === undefined || row.state !== 'HASHING') {
        return
      }
      // Weiter nur, solange die Zeile noch auf ihre Prüfsumme wartet (nicht entfernt, kein Upload gestartet)
      const isStillHashing = () => {
        const leavingAbortController = leavingAbortControllerRef.current
        if (leavingAbortController === null || leavingAbortController.signal.aborted) {
          return false
        }
        const currentRow = rowsRef.current.find((listedRow) => listedRow.rowKey === rowKey)
        return currentRow !== undefined && currentRow.state === 'HASHING'
      }
      // Der Balken nur bei einem neuen Prozentwert: Bei 50 GB sind es sonst Tausende Neuzeichnungen
      let lastHashedPercent = -1
      let sha256Hex: string | null
      try {
        sha256Hex = await createFileSha256Hex(
          row.file,
          (hashedBytes, totalBytes) => {
            const hashedPercent = getPercent(hashedBytes, totalBytes)
            if (hashedPercent === lastHashedPercent) {
              return
            }
            lastHashedPercent = hashedPercent
            changeRow(rowKey, (currentRow) => (currentRow.state === 'HASHING' ? { progressPercent: hashedPercent } : {}))
          },
          isStillHashing,
        )
      } catch (hashError) {
        let hashFailureMessage = 'Die Prüfsumme ließ sich nicht rechnen.'
        if (hashError instanceof Error) {
          hashFailureMessage = 'Die Prüfsumme ließ sich nicht rechnen: ' + hashError.message
        }
        changeRow(rowKey, (currentRow) =>
          currentRow.state === 'HASHING' ? { state: 'FAILED', message: hashFailureMessage } : {},
        )
        return
      }
      if (sha256Hex === null) {
        return
      }
      const computedSha256Hex = sha256Hex
      changeRow(rowKey, (currentRow) =>
        currentRow.state === 'HASHING'
          ? { sha256Hex: computedSha256Hex, state: 'CHECKING', progressPercent: 0 }
          : { sha256Hex: computedSha256Hex },
      )
      const fileDocumentExistence = await getFileDocumentExistence(computedSha256Hex)
      // Hat der Upload inzwischen begonnen, entscheidet das Backend: Die Zeile bleibt, wie sie ist
      if (fileDocumentExistence === null) {
        changeRow(rowKey, (currentRow) =>
          currentRow.state === 'CHECKING' ? { state: 'FAILED', message: 'Die Prüfung beim Backend ist fehlgeschlagen.' } : {},
        )
        return
      }
      if (fileDocumentExistence.exists) {
        // Auch eine wartende Datei: Dublette, sie geht nicht mehr hoch
        const existingDocument = fileDocumentExistence.document
        changeRow(rowKey, (currentRow) =>
          currentRow.state === 'CHECKING' ? { state: 'EXISTS', existingDocument, uploadQueued: false } : {},
        )
        return
      }
      changeRow(rowKey, (currentRow) => (currentRow.state === 'CHECKING' ? { state: 'READY' } : {}))
    },
    [changeRow, getFileDocumentExistence],
  )

  /** Eine Spur der Prüfsummen: nimmt sich die nächste Datei, bis keine mehr wartet. */
  const runHashLane = useCallback(async () => {
    try {
      while (hashQueueRef.current.length > 0) {
        const rowKey = hashQueueRef.current.shift() as string
        await hashRow(rowKey)
      }
    } finally {
      activeHashLaneCountRef.current = activeHashLaneCountRef.current - 1
    }
  }, [hashRow])

  /** Startet so viele Spuren, wie Kerne frei sind und Dateien warten. */
  const startHashLanes = useCallback(() => {
    while (activeHashLaneCountRef.current < HASH_LANE_COUNT && hashQueueRef.current.length > 0) {
      activeHashLaneCountRef.current = activeHashLaneCountRef.current + 1
      void runHashLane()
    }
  }, [runHashLane])

  /** Gleicht die Zeilen mit den gewählten Dateien der FileDropzone ab: neue Dateien bekommen eine Zeile, entfernte gehen. */
  const syncSelectedFiles = useCallback(
    (selectedFiles: File[]) => {
      const currentRows = rowsRef.current
      const selectedRowKeys = new Set<string>()
      const newRows: FileUploadRow[] = []
      for (const selectedFile of selectedFiles) {
        const rowKey = getFileRowKey(selectedFile)
        selectedRowKeys.add(rowKey)
        const alreadyListed = currentRows.some((row) => row.rowKey === rowKey)
        if (alreadyListed) {
          continue
        }
        const fileExtension = getFileExtensionOfFileName(selectedFile.name)
        const inputValuesByFieldName = createRowInputValues(selectedFile)
        newRows.push({
          rowKey,
          file: selectedFile,
          fileExtension,
          state: 'HASHING',
          uploadQueued: false,
          progressPercent: 0,
          sha256Hex: null,
          existingDocument: null,
          uploadedDocument: null,
          message: null,
          inputValuesByFieldName,
        })
      }
      const keptRows = currentRows.filter((row) => selectedRowKeys.has(row.rowKey))
      const changedRows = [...keptRows, ...newRows]
      rowsRef.current = changedRows
      setRows(changedRows)
      for (const newRow of newRows) {
        hashQueueRef.current.push(newRow.rowKey)
      }
      startHashLanes()
    },
    [createRowInputValues, startHashLanes],
  )

  /** Ändert eine Eingabe einer Zeile, z. B. den Titel. */
  const changeRowInputValue = useCallback(
    (rowKey: string, fieldName: string, inputValue: SolrFieldInputValue) => {
      changeRow(rowKey, (row) => {
        const changedInputValues = { ...row.inputValuesByFieldName, [fieldName]: inputValue }
        return { inputValuesByFieldName: changedInputValues }
      })
    },
    [changeRow],
  )

  /**
   * Lädt EINE Zeile hoch und setzt ihren Stand. Liefert das Ergebnis, wenn sie neu angelegt wurde (CREATED), sonst
   * `null` (gibt es schon, oder Fehler mit Grund in der Zeile).
   */
  const uploadRow = useCallback(
    async (rowKey: string, createClientFieldValues: CreateClientFieldValues): Promise<FileUploadResult | null> => {
      const row = rowsRef.current.find((currentRow) => currentRow.rowKey === rowKey)
      const leavingAbortController = leavingAbortControllerRef.current
      if (row === undefined || leavingAbortController === null || leavingAbortController.signal.aborted) {
        return null
      }
      changeRow(rowKey, () => ({ state: 'UPLOADING', uploadQueued: false, progressPercent: 0, message: null }))
      const clientFieldValues = createClientFieldValues(row)
      const reportUploadProgress = (sentBytes: number, totalBytes: number) => {
        const sentPercent = getPercent(sentBytes, totalBytes)
        changeRow(rowKey, () => ({ progressPercent: sentPercent }))
      }
      const leavingSignal = leavingAbortController.signal
      const uploadOutcome = await uploadFile(row.file, clientFieldValues, reportUploadProgress, leavingSignal)
      if (!uploadOutcome.succeeded) {
        const failureMessage = uploadOutcome.error.detail
        changeRow(rowKey, () => ({ state: 'FAILED', message: failureMessage }))
        return null
      }
      const uploadResult = uploadOutcome.data
      if (uploadResult.status === 'EXISTS') {
        const existingDocument = uploadResult.document
        changeRow(rowKey, () => ({ state: 'EXISTS', existingDocument, progressPercent: 100 }))
        return null
      }
      const uploadedDocument = uploadResult.document
      changeRow(rowKey, () => ({ state: 'DONE', uploadedDocument, progressPercent: 100 }))
      return uploadResult
    },
    [changeRow, uploadFile],
  )

  /**
   * Belegt freie Kanäle mit wartenden Zeilen. Eine Zeile, die inzwischen weg ist oder eine Dublette, fällt aus der
   * Warteschlange. Ist ein Upload fertig, läuft das hier wieder.
   */
  const pumpUploadQueue = useCallback(() => {
    const leavingAbortController = leavingAbortControllerRef.current
    if (leavingAbortController === null || leavingAbortController.signal.aborted) {
      return
    }
    while (activeUploadCountRef.current < uploadMaxParallelUploads && uploadQueueRef.current.length > 0) {
      const queuedUpload = uploadQueueRef.current.shift() as QueuedUpload
      const queuedRowKey = queuedUpload.rowKey
      const row = rowsRef.current.find((currentRow) => currentRow.rowKey === queuedRowKey)
      const stillUploadable = row !== undefined && UPLOADABLE_ROW_STATES.includes(row.state)
      if (!stillUploadable) {
        changeRow(queuedRowKey, () => ({ uploadQueued: false }))
        queuedUpload.finish(null)
        continue
      }
      activeUploadCountRef.current = activeUploadCountRef.current + 1
      setActiveUploadCount(activeUploadCountRef.current)
      const runningUpload = uploadRow(queuedRowKey, queuedUpload.createClientFieldValues)
      void runningUpload
        .then((uploadResult) => {
          if (uploadResult !== null) {
            queuedUpload.onUploaded(queuedRowKey, uploadResult)
          }
          queuedUpload.finish(uploadResult)
        })
        .finally(() => {
          activeUploadCountRef.current = activeUploadCountRef.current - 1
          setActiveUploadCount(activeUploadCountRef.current)
          pumpUploadQueueRef.current()
        })
    }
  }, [changeRow, uploadRow])

  useEffect(() => {
    pumpUploadQueueRef.current = pumpUploadQueue
  }, [pumpUploadQueue])

  /**
   * Reiht die Zeilen mit den genannten Keys zum Hochladen ein, auch während schon Uploads laufen. Schon eingereihte oder
   * nicht hochladbare Zeilen werden übersprungen. Liefert die Ergebnisse dieser Zeilen, sobald alle durch sind.
   */
  const enqueueUploads = useCallback(
    (
      rowKeysToUpload: string[],
      createClientFieldValues: CreateClientFieldValues,
      onUploaded: OnRowUploaded,
    ): Promise<FileUploadResult[]> => {
      const queuedRowKeys = new Set<string>()
      for (const queuedUpload of uploadQueueRef.current) {
        queuedRowKeys.add(queuedUpload.rowKey)
      }
      const rowCompletions: Promise<FileUploadResult | null>[] = []
      for (const rowKey of rowKeysToUpload) {
        const row = rowsRef.current.find((currentRow) => currentRow.rowKey === rowKey)
        const uploadable = row !== undefined && UPLOADABLE_ROW_STATES.includes(row.state)
        if (!uploadable || queuedRowKeys.has(rowKey)) {
          continue
        }
        changeRow(rowKey, () => ({ uploadQueued: true, message: null }))
        const rowCompletion = new Promise<FileUploadResult | null>((finish) => {
          uploadQueueRef.current.push({ rowKey, createClientFieldValues, onUploaded, finish })
        })
        rowCompletions.push(rowCompletion)
      }
      pumpUploadQueue()
      return Promise.all(rowCompletions).then((uploadResults) =>
        uploadResults.filter((uploadResult): uploadResult is FileUploadResult => uploadResult !== null),
      )
    },
    [changeRow, pumpUploadQueue],
  )

  const isUploading = activeUploadCount > 0
  let uploadErrorMessage: string | null = null
  if (fileDocumentHook.error !== null) {
    uploadErrorMessage = fileDocumentHook.error.detail
  }

  return {
    rows,
    isUploading,
    activeUploadCount,
    uploadErrorMessage,
    syncSelectedFiles,
    changeRowInputValue,
    enqueueUploads,
  }
}
