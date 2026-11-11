import { formatDateTimeWithRelativeDays } from '../../components/formatDateTime.ts'
import type { FileDocument } from '../FileDocument.ts'
import { getFileDocumentText } from '../FileDocument.ts'
import type { FileSolrFieldNameSet } from '../FileSolrFieldNameSet.ts'

type FileAnalysisHoverlayContentProps = {
  fileDocument: FileDocument
  fileSolrFieldNameSet: FileSolrFieldNameSet
}

/** So viele Zeichen des gelesenen Texts zeigt der Hinweis, der ganze Text steht auf der Seite der Datei. */
const TIKA_TEXT_PREVIEW_CHARACTERS = 300

/**
 * Was die Auswertung ermittelt hat, kompakt für den Hinweis über einer hochgeladenen Datei: Typ, Maße, Aufnahme, Kamera,
 * GPS (nur wer es lesen darf) und der Anfang des Texts, den Tika gelesen hat (Texterkennung oder Inhalt). Fehlt ein Wert, fehlt die Zeile.
 */
export function FileAnalysisHoverlayContent({ fileDocument, fileSolrFieldNameSet }: FileAnalysisHoverlayContentProps) {
  const mimeType = getFileDocumentText(fileDocument, fileSolrFieldNameSet.mimeType)
  const imageWidth = fileDocument[fileSolrFieldNameSet.imageWidth]
  const imageHeight = fileDocument[fileSolrFieldNameSet.imageHeight]
  const capturedAt = getFileDocumentText(fileDocument, fileSolrFieldNameSet.capturedAt)
  const cameraModel = getFileDocumentText(fileDocument, fileSolrFieldNameSet.cameraModel)
  const gpsLatitude = fileDocument[fileSolrFieldNameSet.gpsLatitude]
  const gpsLongitude = fileDocument[fileSolrFieldNameSet.gpsLongitude]
  const tikaText = getFileDocumentText(fileDocument, fileSolrFieldNameSet.tikaFileDescription)

  const detailRows: { label: string; value: string }[] = []
  if (mimeType !== '') {
    detailRows.push({ label: 'Typ', value: mimeType })
  }
  if (typeof imageWidth === 'number' && typeof imageHeight === 'number') {
    detailRows.push({ label: 'Maße', value: imageWidth + ' × ' + imageHeight + ' px' })
  }
  if (capturedAt !== '') {
    const capturedAtLocalText = formatDateTimeWithRelativeDays(capturedAt)
    detailRows.push({ label: 'Aufnahme', value: capturedAtLocalText })
  }
  if (cameraModel !== '') {
    detailRows.push({ label: 'Kamera', value: cameraModel })
  }
  if (typeof gpsLatitude === 'number' && typeof gpsLongitude === 'number') {
    detailRows.push({ label: 'GPS', value: gpsLatitude + ', ' + gpsLongitude })
  }
  let tikaTextPreview = tikaText
  if (tikaText.length > TIKA_TEXT_PREVIEW_CHARACTERS) {
    tikaTextPreview = tikaText.slice(0, TIKA_TEXT_PREVIEW_CHARACTERS) + ' …'
  }
  if (tikaTextPreview !== '') {
    detailRows.push({ label: 'Gelesener Text', value: tikaTextPreview })
  }
  if (detailRows.length === 0) {
    return <span>Die Auswertung hat keine Daten gefunden.</span>
  }

  return (
    <table className="file-analysis-hoverlay-table">
      <tbody>
        {detailRows.map((detailRow) => (
          <tr key={detailRow.label}>
            <th>{detailRow.label}</th>
            <td>{detailRow.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
