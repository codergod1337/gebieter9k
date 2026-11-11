/**
 * Die Werte des Feldes `analysisStatus`, wie das Backend sie aus `gebiter.file.analysis-status-*` liefert (Stammdaten).
 * So steht kein Wert fest im Frontend.
 */
export type FileAnalysisStatusValueSet = {
  /** die Auswertung (Tika, Texterkennung, EXIF, Vorschau) wartet noch */
  pending: string
  done: string
  failed: string
}
