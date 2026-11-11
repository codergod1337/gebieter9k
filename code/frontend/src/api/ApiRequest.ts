/** Die HTTP-Methoden, die das Backend anbietet. */
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Meldet beim Hochladen, wie viele Bytes schon gesendet sind. */
export type UploadProgressListener = (sentBytes: number, totalBytes: number) => void

/** Meldet beim Herunterladen, wie viele Bytes schon da sind; `totalBytes` ist 0, wenn das Backend die Länge nicht nennt. */
export type DownloadProgressListener = (receivedBytes: number, totalBytes: number) => void

/**
 * Ein beliebiger Request an einen beliebigen Endpunkt des Backends.
 *
 * - `path`: der Endpunkt, z. B. `/api/users` oder `/api/users/<guid>`
 * - `body`: jeder Request Body, der sich als JSON schicken lässt. Bei GET verboten, wie im Backend:
 *   Außer bei GET steht nichts in der URL, alles kommt in den Body.
 * - `fileBody`: statt `body` eine Datei als roher Body (`application/octet-stream`), z. B. für den Tika-Test. Der
 *   Browser streamt sie von der Platte, sie liegt nie ganz im Speicher.
 * - `multipartBody`: statt `body` ein Multipart-Formular, z. B. Datei plus JSON beim Upload in den File-Kern. Auch hier
 *   streamt der Browser die Datei von der Platte.
 * - `onUploadProgress`: nur mit `multipartBody`, meldet die gesendeten Bytes (Fortschrittsbalken).
 * - `responseAsBlob`: die Antwort als Blob statt JSON oder Text, z. B. die Bytes einer Datei für einen Viewer im Browser.
 * - `onDownloadProgress`: nur mit `responseAsBlob`, meldet die empfangenen Bytes (Fortschrittsbalken).
 * - `abortSignal`: bricht den Request ab, z. B. alle Uploads, sobald man die Upload-Seite verlässt. Der Fehler ist dann
 *   ein `ApiError` mit Status 0 und dem Titel „Abgebrochen“.
 */
export type ApiRequest = {
  method: ApiMethod
  path: string
  body?: unknown
  fileBody?: Blob
  multipartBody?: FormData
  onUploadProgress?: UploadProgressListener
  responseAsBlob?: boolean
  onDownloadProgress?: DownloadProgressListener
  abortSignal?: AbortSignal
}
