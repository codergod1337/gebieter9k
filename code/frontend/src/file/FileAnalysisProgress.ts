/** Die Schritte der Auswertung im Backend, wie das Enum `FileAnalysisStep`. */
export type FileAnalysisStep =
  | 'STORE_ON_SFTP'
  | 'CONVERT_HEIF'
  | 'READ_WITH_TIKA'
  | 'RECOGNIZE_TEXT'
  | 'CREATE_PREVIEW'
  | 'SAVE_RESULT'

/** Wo eine Datei in der Auswertung steht, wie das Enum `FileAnalysisProgressState`. */
export type FileAnalysisProgressState = 'WAITING' | 'RUNNING' | 'NOT_QUEUED'

/**
 * Wie weit die Auswertung einer Datei ist (`FileAnalysisProgress` im Backend): Platz in der Warteschlange
 * (`queuePosition` von `queueSize`, ab 1) und, wenn sie läuft, ihr Schritt (`stepNumber` von `stepCount`).
 */
export type FileAnalysisProgress = {
  fileDocumentId: string
  state: FileAnalysisProgressState
  queuePosition: number
  queueSize: number
  step: FileAnalysisStep | null
  stepNumber: number
  stepCount: number
}

/** Was ein Schritt für den User bedeutet, für „Schritt 2 von 4: …“ in der Upload-Liste. */
export const FILE_ANALYSIS_STEP_LABELS: Record<FileAnalysisStep, string> = {
  STORE_ON_SFTP: 'Datei wird gespeichert',
  CONVERT_HEIF: 'HEIC wird in JPEG umgewandelt',
  READ_WITH_TIKA: 'Inhalt und EXIF werden gelesen',
  RECOGNIZE_TEXT: 'Texterkennung auf verkleinerter Kopie',
  CREATE_PREVIEW: 'Vorschaubild wird erstellt',
  SAVE_RESULT: 'Ergebnis wird gespeichert',
}
