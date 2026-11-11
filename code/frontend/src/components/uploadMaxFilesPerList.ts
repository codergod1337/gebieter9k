/**
 * Höchstens so viele Dateien in einer Upload-Liste der {@link FileDropzone}, aus der Vite-Umgebung
 * (`VITE_UPLOAD_MAX_FILES_PER_LIST` in `.env.development` bzw. `.env.production`), nie aus dem Code. Ist die Liste voll,
 * wird erst hochgeladen, dann geht es weiter.
 */
const uploadMaxFilesPerListFromEnvironment = import.meta.env.VITE_UPLOAD_MAX_FILES_PER_LIST
const parsedUploadMaxFilesPerList = Number(uploadMaxFilesPerListFromEnvironment)
if (!Number.isInteger(parsedUploadMaxFilesPerList) || parsedUploadMaxFilesPerList < 1) {
  throw new Error('VITE_UPLOAD_MAX_FILES_PER_LIST fehlt oder ist keine ganze Zahl ab 1 (.env.development / .env.production).')
}

export const uploadMaxFilesPerList: number = parsedUploadMaxFilesPerList
