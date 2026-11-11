import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import { read, utils, type ParsingOptions, type WorkBook } from 'xlsx'
import { sanitizeHtml } from '../../components/sanitizeHtml.ts'
import { useFileDocumentBlob } from '../useFileDocumentBlob.ts'
import { FileDocumentLoadingProgress } from './FileDocumentLoadingProgress.tsx'
import { removeUnsafeLinks } from './removeUnsafeLinks.ts'

type FileDocumentSpreadsheetViewerProps = {
  fileDocumentId: string
  fileName: string
}

/** Wie das Lesen der Mappe zu welchen Bytes ausging: die Mappe oder ein Fehler. */
type ReadWorkbook = {
  blob: Blob
  workbook: WorkBook | null
  errorMessage: string | null
}

/**
 * So liest SheetJS eine fremde Mappe: ohne eigenes HTML je Zelle (`cellHTML`). Sonst gäbe SheetJS den Text formatierter
 * Zellen unmaskiert als HTML weiter (geprüft 2026-11-10 mit SheetJS 0.20.3), der Zelltext `<b>x</b>` käme als Tag an.
 */
const WORKBOOK_PARSING_OPTIONS: ParsingOptions = { cellHTML: false }

/** Mehr als eine schlichte Tabelle mit Links und Zeilenumbrüchen kommt aus einer fremden Mappe nie in die Seite. */
const SHEET_ALLOWED_TAG_NAMES = new Set(['TABLE', 'TBODY', 'TR', 'TD', 'TH', 'A', 'BR'])

/** Verbundene Zellen und das Ziel eines Links; alles andere an Attributen fällt weg, also auch jedes `on…`. */
const SHEET_ALLOWED_ATTRIBUTE_NAMES = new Set(['rowspan', 'colspan', 'href'])

/**
 * Tabellen im Viewer, wie der ExcelViewer der Vorlage, für xlsx und ods: SheetJS liest die Mappe nur lesend und zeigt
 * das gewählte Blatt als Tabelle, bei mehreren Blättern mit Knöpfen zum Umschalten. Reine Anzeige.
 *
 * Zum innerHTML: Die Mappe ist eine fremde Datei, und SheetJS maskiert nicht alles, was es in die Tabelle schreibt
 * (formatierte Zellen, Zahlenformate). Deshalb zwei Riegel: SheetJS baut kein eigenes HTML je Zelle
 * ({@link WORKBOOK_PARSING_OPTIONS}), und die fertige Tabelle geht durch den {@link sanitizeHtml}, bevor sie in den DOM
 * kommt: nur Tabelle, Zeilen, Zellen, Links und Zeilenumbrüche, kein Skript, kein `on…`-Attribut. Links in Zellen
 * behalten ihr Ziel nur, wenn es eine Webseite oder E-Mail-Adresse ist.
 */
export function FileDocumentSpreadsheetViewer({ fileDocumentId, fileName }: FileDocumentSpreadsheetViewerProps) {
  const fileDocumentBlobHook = useFileDocumentBlob(fileDocumentId)
  const blob = fileDocumentBlobHook.blob
  const [readWorkbook, setReadWorkbook] = useState<ReadWorkbook | null>(null)
  const [sheetIndex, setSheetIndex] = useState<number>(0)
  const sheetContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (blob === null) {
      return
    }
    let active = true
    blob
      .arrayBuffer()
      .then((workbookBytes) => {
        if (!active) {
          return
        }
        const workbook = read(workbookBytes, WORKBOOK_PARSING_OPTIONS)
        setReadWorkbook({ blob, workbook, errorMessage: null })
        setSheetIndex(0)
      })
      .catch((caughtError: unknown) => {
        if (!active) {
          return
        }
        let readErrorMessage = 'Die Tabelle ließ sich nicht anzeigen. Herunterladen geht.'
        if (caughtError instanceof Error && caughtError.message !== '') {
          readErrorMessage = readErrorMessage + ' (' + caughtError.message + ')'
        }
        setReadWorkbook({ blob, workbook: null, errorMessage: readErrorMessage })
      })
    return () => {
      active = false
    }
  }, [blob])

  let currentReadWorkbook: ReadWorkbook | null = null
  if (readWorkbook !== null && readWorkbook.blob === blob) {
    currentReadWorkbook = readWorkbook
  }
  let workbook: WorkBook | null = null
  if (currentReadWorkbook !== null) {
    workbook = currentReadWorkbook.workbook
  }

  const sheetHtml = useMemo(() => {
    if (workbook === null) {
      return null
    }
    const sheetName = workbook.SheetNames[sheetIndex]
    if (sheetName === undefined) {
      return null
    }
    const sheet = workbook.Sheets[sheetName]
    // header und footer leer: nur die Tabelle, kein ganzes HTML-Gerüst
    const rawSheetHtml = utils.sheet_to_html(sheet, { header: '', footer: '' })
    // Fremde Datei: nur die erlaubten Tags und Attribute erreichen den DOM
    return sanitizeHtml(rawSheetHtml, SHEET_ALLOWED_TAG_NAMES, SHEET_ALLOWED_ATTRIBUTE_NAMES)
  }, [workbook, sheetIndex])

  // vor dem Zeichnen: Links aus den Zellen prüfen, bevor jemand sie sieht
  useLayoutEffect(() => {
    const sheetContainer = sheetContainerRef.current
    if (sheetContainer !== null) {
      removeUnsafeLinks(sheetContainer)
    }
  }, [sheetHtml])

  if (fileDocumentBlobHook.errorMessage !== null) {
    return <p className="text-danger mb-0">{fileDocumentBlobHook.errorMessage}</p>
  }
  if (currentReadWorkbook !== null && currentReadWorkbook.errorMessage !== null) {
    return <p className="text-danger mb-0">{currentReadWorkbook.errorMessage}</p>
  }
  if (workbook === null || sheetHtml === null) {
    return (
      <FileDocumentLoadingProgress
        fileName={fileName}
        receivedBytes={fileDocumentBlobHook.receivedBytes}
        totalBytes={fileDocumentBlobHook.totalBytes}
      />
    )
  }
  return (
    <div className="file-viewer-document" aria-label={fileName}>
      {workbook.SheetNames.length > 1 && (
        <div className="d-flex flex-wrap gap-2 mb-2" role="group" aria-label="Blätter">
          {workbook.SheetNames.map((sheetName, index) => {
            const isCurrentSheet = index === sheetIndex
            let sheetButtonVariant = 'outline-secondary'
            if (isCurrentSheet) {
              sheetButtonVariant = 'primary'
            }
            return (
              <Button
                key={sheetName}
                size="sm"
                variant={sheetButtonVariant}
                aria-pressed={isCurrentSheet}
                onClick={() => setSheetIndex(index)}>
                {sheetName}
              </Button>
            )
          })}
        </div>
      )}
      <div ref={sheetContainerRef} className="file-viewer-sheet" dangerouslySetInnerHTML={{ __html: sheetHtml }} />
    </div>
  )
}
