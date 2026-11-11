/**
 * So viele Dateien einer Upload-Liste gehen gleichzeitig zum Backend, aus der Vite-Umgebung
 * (`VITE_UPLOAD_MAX_PARALLEL_UPLOADS`), nie aus dem Code. Passt zum SFTP-Broker des Backends (2 Verbindungen je User).
 */
const uploadMaxParallelUploadsFromEnvironment = import.meta.env.VITE_UPLOAD_MAX_PARALLEL_UPLOADS
const parsedUploadMaxParallelUploads = Number(uploadMaxParallelUploadsFromEnvironment)
if (!Number.isInteger(parsedUploadMaxParallelUploads) || parsedUploadMaxParallelUploads < 1) {
  throw new Error('VITE_UPLOAD_MAX_PARALLEL_UPLOADS fehlt oder ist keine ganze Zahl ab 1 (.env.development / .env.production).')
}

export const uploadMaxParallelUploads: number = parsedUploadMaxParallelUploads
