import type { StatusLegendEntry } from '../components/StatusLegendMark.tsx'
import type { StatusMarkLook } from '../components/StatusMark.tsx'
import type { FileAnalysisStatusValueSet } from './FileAnalysisStatusValueSet.ts'

/** Was ein Stand der Auswertung bedeutet, als {@link StatusMarkLook}; die Werte selbst kommen aus den Stammdaten. */
export function getFileAnalysisStatusLook(
  analysisStatus: unknown,
  fileAnalysisStatusValueSet: FileAnalysisStatusValueSet,
): StatusMarkLook | null {
  if (analysisStatus === fileAnalysisStatusValueSet.done) {
    return { tone: 'SUCCESS', iconClassName: 'bi bi-check-circle-fill', label: 'ausgewertet' }
  }
  if (analysisStatus === fileAnalysisStatusValueSet.pending) {
    return { tone: 'RUNNING', iconClassName: 'bi bi-hourglass-split', label: 'Auswertung läuft' }
  }
  if (analysisStatus === fileAnalysisStatusValueSet.failed) {
    return { tone: 'DANGER', iconClassName: 'bi bi-x-octagon-fill', label: 'Auswertung gescheitert' }
  }
  return null
}

/** Alle Stände der Auswertung mit Aussehen und Bedeutung, für die Legende in der Sprechblase. */
export function getFileAnalysisStatusLegend(fileAnalysisStatusValueSet: FileAnalysisStatusValueSet): StatusLegendEntry[] {
  return [
    {
      value: fileAnalysisStatusValueSet.pending,
      look: { tone: 'RUNNING', iconClassName: 'bi bi-hourglass-split', label: 'Auswertung läuft' },
      explanation: 'Wartet oder läuft im Hintergrund: SFTP, Inhalt und EXIF, Texterkennung, Vorschaubild.',
    },
    {
      value: fileAnalysisStatusValueSet.done,
      look: { tone: 'SUCCESS', iconClassName: 'bi bi-check-circle-fill', label: 'ausgewertet' },
      explanation: 'Fertig: Inhalt, EXIF, erkannter Text und Vorschaubild stehen im Dokument.',
    },
    {
      value: fileAnalysisStatusValueSet.failed,
      look: { tone: 'DANGER', iconClassName: 'bi bi-x-octagon-fill', label: 'Auswertung gescheitert' },
      explanation: 'Abgebrochen: Die Datei ist gespeichert, nur Inhalt, Text oder Vorschau fehlen.',
    },
  ]
}

/** Eine Datei ist eingecheckt: hochgeladen, ab jetzt darf man die Seite verlassen. */
export const FILE_UPLOADED_LOOK: StatusMarkLook = { tone: 'SUCCESS', iconClassName: 'bi bi-cloud-check-fill', label: 'hochgeladen' }
