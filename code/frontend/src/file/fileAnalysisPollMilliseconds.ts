/**
 * So oft fragt die Upload-Seite, ob die Auswertung einer Datei fertig ist, aus der Vite-Umgebung
 * (`VITE_FILE_ANALYSIS_POLL_SECONDS`), nie aus dem Code.
 */
const fileAnalysisPollSecondsFromEnvironment = import.meta.env.VITE_FILE_ANALYSIS_POLL_SECONDS
const parsedFileAnalysisPollSeconds = Number(fileAnalysisPollSecondsFromEnvironment)
if (!Number.isFinite(parsedFileAnalysisPollSeconds) || parsedFileAnalysisPollSeconds <= 0) {
  throw new Error('VITE_FILE_ANALYSIS_POLL_SECONDS fehlt oder ist keine Zahl über 0 (.env.development / .env.production).')
}

export const fileAnalysisPollMilliseconds: number = parsedFileAnalysisPollSeconds * 1000
