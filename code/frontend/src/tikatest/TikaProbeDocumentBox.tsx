import Table from 'react-bootstrap/Table'
import { ContentBox } from '../components/ContentBox.tsx'
import type { TikaProbeDocument } from './TikaProbe.ts'

type TikaProbeDocumentBoxProps = {
  document: TikaProbeDocument
  /** 0 ist die Datei selbst, ab 1 die eingebetteten. */
  documentIndex: number
}

/** Unter diesem Schlüssel nennt Tika die Parser, die gelesen haben. */
const PARSED_BY_METADATA_NAME = 'tk:parsed-by'

/** Der Parser der Texterkennung (Tesseract); steht er in der Liste, lief die OCR wie nach dem Upload. */
const OCR_PARSER_NAME = 'TesseractOCRParser'

/**
 * Nur für die Anzeige (Wunsch des Nutzers 2026-11-08): Leerzeichen am Zeilenende weg, mehrere Zeilenumbrüche
 * hintereinander zu einem, also keine Leerzeilen (die Texterkennung liefert viele). Sonst bleibt der Text, wie Tika ihn
 * liefert.
 */
function getDisplayText(content: string): string {
  const textWithoutTrailingSpaces = content.replace(/[ \t]+\n/g, '\n')
  const textWithoutBlankLines = textWithoutTrailingSpaces.replace(/\n{2,}/g, '\n')
  return textWithoutBlankLines.trim()
}

/**
 * Ein Dokument aus dem Tika-Test: zuerst der gelesene Text, bei Bildern aus der Texterkennung (dieselbe wie nach dem
 * Upload, dort landet er ohne Leerzeilen im Feld `tikaFileDescription`), mit dem Hinweis, ob die Texterkennung lief. Der Text steht ganz da,
 * ohne eigenen Scrollbereich. Darunter alle Metadaten.
 */
export function TikaProbeDocumentBox({ document, documentIndex }: TikaProbeDocumentBoxProps) {
  let title = 'Die Datei selbst'
  if (documentIndex > 0) {
    const embeddedResourcePath = document.embeddedResourcePath ?? '(ohne Pfad)'
    title = 'Eingebettet ' + documentIndex + ': ' + embeddedResourcePath
  }
  const metadataEntries = Object.entries(document.metadata)
  const content = document.content
  let contentLengthText = 'Kein Text.'
  if (content !== null) {
    contentLengthText = content.length.toLocaleString('de-DE') + ' Zeichen Text.'
  }
  const footer = metadataEntries.length + ' Metadaten. ' + contentLengthText
  const parsedByValues = document.metadata[PARSED_BY_METADATA_NAME] ?? []
  const ocrRan = parsedByValues.some((parsedByValue) => parsedByValue.endsWith(OCR_PARSER_NAME))
  const displayText = getDisplayText(content ?? '')
  let emptyTextHint = 'Kein Text gefunden.'
  if (ocrRan) {
    emptyTextHint = 'Kein Text gefunden: Die Texterkennung lief, hat aber nichts erkannt.'
  }

  return (
    <ContentBox title={title} footer={footer}>
      <h3 className="h6 d-flex align-items-center gap-2">
        Gelesener Text
        {ocrRan && <span className="badge text-bg-secondary">Texterkennung (Tesseract) lief</span>}
      </h3>
      {displayText === '' && <p className="text-body-secondary">{emptyTextHint}</p>}
      {displayText !== '' && <pre className="tika-probe-text mb-3">{displayText}</pre>}
      <h3 className="h6">Metadaten</h3>
      <Table striped hover responsive size="sm" className="mb-0">
        <thead>
          <tr>
            <th>Schlüssel</th>
            <th>Werte</th>
          </tr>
        </thead>
        <tbody>
          {metadataEntries.map(([metadataName, metadataValues]) => (
            <tr key={metadataName}>
              <td className="text-nowrap">
                <code>{metadataName}</code>
              </td>
              <td className="text-break">
                {metadataValues.map((metadataValue, valueIndex) => (
                  <div key={valueIndex}>{metadataValue}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </ContentBox>
  )
}
