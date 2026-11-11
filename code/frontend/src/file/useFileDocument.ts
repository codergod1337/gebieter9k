import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import type { UploadProgressListener } from '../api/ApiRequest.ts'
import { type ApiDataOrError, useApiRequest } from '../api/useApiRequest.ts'
import { clearViewCacheScope } from '../navigation/viewCache.ts'
import type {
  FileDocument,
  FileDocumentExistence,
  FileDocumentForClient,
  FileDocumentPage,
  FileUploadResult,
} from './FileDocument.ts'
import type { FileAnalysisProgress } from './FileAnalysisProgress.ts'
import { FILE_DOCUMENT_VIEW_CACHE_SCOPE } from './fileDocumentViewCacheScope.ts'
import type { Visibility } from '../users/Users.ts'
import type { FileFieldValueSuggestion } from './FileFieldValueSuggestion.ts'

/**
 * Was {@link useFileDocument} anbietet: je Endpunkt von `/api/file-document` eine Funktion, benannt wie die Methode im
 * Backend. Bei einem Fehler `null`, der Fehler steht dann in `error`. Ausnahme `uploadFile`: Die Upload-Liste zeigt je
 * Datei ihren eigenen Grund, deshalb liefert sie die Daten oder den Fehler genau dieses Uploads.
 */
export type FileDocumentHook = ApiHookState & {
  /** File-Manager: eine Datei ohne Ziel hochladen (`/api/file-manager/file-document/upload`). */
  uploadFile: (
    file: File,
    clientFieldValues: Record<string, unknown>,
    onUploadProgress: UploadProgressListener,
    abortSignal: AbortSignal,
  ) => Promise<ApiDataOrError<FileUploadResult>>
  getFileDocumentExistence: (sha256Hex: string) => Promise<FileDocumentExistence | null>
  /** Vorhandene Werte eines Feldes zum Getippten, z. B. Tags (Vervollständigung). */
  searchFileFieldValues: (fieldName: string, searchText: string) => Promise<FileFieldValueSuggestion[] | null>
  /** Wie weit die Auswertung dieser Dateien ist (Warteschlange, Schritt). */
  resolveFileAnalysisProgress: (fileDocumentIds: string[]) => Promise<FileAnalysisProgress[] | null>
  getFileDocumentForClient: (fileDocumentId: string) => Promise<FileDocumentForClient | null>
  resolveFileDocuments: (exactValueByFieldName: Record<string, string>, page: number) => Promise<FileDocumentPage | null>
  changeOwnFileDocument: (
    fileDocumentId: string,
    fieldValuesByFieldName: Record<string, unknown>,
  ) => Promise<FileDocument | null>
  deleteOwnFileDocument: (fileDocumentId: string) => Promise<boolean>
  /** Wer außer dem Autor die Metadaten bearbeiten darf (GUIDs). */
  changeFileDocumentEditors: (fileDocumentId: string, editorUsersGuids: string[]) => Promise<FileDocument | null>
  /** Die Sichtbarkeit der eigenen Datei ändern. */
  changeOwnFileDocumentVisibility: (fileDocumentId: string, visibility: Visibility) => Promise<FileDocument | null>
  /** File-Manager: die Sichtbarkeit jeder Datei ändern. */
  changeFileDocumentVisibility: (fileDocumentId: string, visibility: Visibility) => Promise<FileDocument | null>
  /** File-Manager: jede Datei ändern (`/api/file-manager/file-document`). */
  changeFileDocument: (fileDocumentId: string, fieldValuesByFieldName: Record<string, unknown>) => Promise<FileDocument | null>
  /** Admin: jede Datei weich löschen (`/api/admin/file-document`); der File-Manager löscht nicht. */
  deleteFileDocument: (fileDocumentId: string) => Promise<boolean>
}

/**
 * Die Endpunkte von `/api/file-document`, die Requests gehen über das API-Modul. Nach jedem erfolgreichen Schreiben
 * (Hochladen, Ändern, Löschen) leert er den Bereich der Dateien im Zwischenspeicher der Ansichten: Die nächste Liste
 * fragt wieder das Backend.
 */
export function useFileDocument(): FileDocumentHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForDataOrError = apiRequestHook.sendForDataOrError
  const sendForSuccess = apiRequestHook.sendForSuccess

  /**
   * CREATE: Lädt eine Datei hoch, Multipart erst mit `data` (die Felder als JSON), dann `file`. Die Reihenfolge ist
   * Pflicht: Das Backend prüft die Felder, bevor es das erste Byte der Datei annimmt. Meldet die gesendeten Bytes über
   * `onUploadProgress`; `abortSignal` bricht ab (Verlassen der Upload-Seite), das Backend verwirft die Teil-Datei.
   *
   * Das ist der Upload-Weg des File-Managers (`/api/file-manager/file-document/upload`, nur FILE_MANAGER und ADMIN):
   * ohne Ziel, in jede FileClass mit Schreibrolle. Ein normaler User lädt nur über ein Ziel hoch, z. B. in seine Galerie
   * (`useGallery.uploadFileIntoGallery`).
   */
  const uploadFile = useCallback(
    async (
      file: File,
      clientFieldValues: Record<string, unknown>,
      onUploadProgress: UploadProgressListener,
      abortSignal: AbortSignal,
    ) => {
      const multipartBody = new FormData()
      const clientFieldValuesJson = JSON.stringify(clientFieldValues)
      const dataPart = new Blob([clientFieldValuesJson], { type: 'application/json' })
      multipartBody.append('data', dataPart)
      multipartBody.append('file', file, file.name)
      const uploadOutcome = await sendForDataOrError<FileUploadResult>({
        method: 'POST',
        path: '/api/file-manager/file-document/upload',
        multipartBody,
        onUploadProgress,
        abortSignal,
      })
      if (uploadOutcome.succeeded) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return uploadOutcome
    },
    [sendForDataOrError],
  )

  /** READ: Gibt es diese Bytes schon? Für die Vorprüfung vor dem Hochladen. */
  const getFileDocumentExistence = useCallback((sha256Hex: string) => {
    const existencePath = '/api/file-document/existence/' + sha256Hex
    return sendForData<FileDocumentExistence>({ method: 'GET', path: existencePath })
  }, [sendForData])

  /** READ (Suchen): Vorhandene Werte eines Feldes, die mit dem Getippten anfangen, häufigste zuerst. Nie Dokumente. */
  const searchFileFieldValues = useCallback((fieldName: string, searchText: string) => {
    const searchRequest = { fieldName, searchText }
    return sendForData<FileFieldValueSuggestion[]>({
      method: 'POST',
      path: '/api/file-document/search-field-values',
      body: searchRequest,
    })
  }, [sendForData])

  /** READ (Auflösen): Platz in der Warteschlange und laufender Schritt der Auswertung dieser Dateien. */
  const resolveFileAnalysisProgress = useCallback((fileDocumentIds: string[]) => {
    const resolveRequest = { fileDocumentIds }
    return sendForData<FileAnalysisProgress[]>({
      method: 'POST',
      path: '/api/file-document/analysis-progress/resolve',
      body: resolveRequest,
    })
  }, [sendForData])

  /** READ: Die Seite einer Datei, mit dem Hinweis, ob der User sie ändern darf. */
  const getFileDocumentForClient = useCallback((fileDocumentId: string) => {
    const fileDocumentPath = '/api/file-document/' + fileDocumentId
    return sendForData<FileDocumentForClient>({ method: 'GET', path: fileDocumentPath })
  }, [sendForData])

  /** READ: Auflösen nach Sollwerten, z. B. alle Dateien einer FileClass, seitenweise ab 0. */
  const resolveFileDocuments = useCallback((exactValueByFieldName: Record<string, string>, page: number) => {
    const resolveRequest = { exactValueByFieldName, page }
    return sendForData<FileDocumentPage>({ method: 'POST', path: '/api/file-document/resolve', body: resolveRequest })
  }, [sendForData])

  /** UPDATE: Ändert die Metadaten der eigenen Datei. Ein leerer Wert nimmt das Feld heraus. */
  const changeOwnFileDocument = useCallback(
    async (fileDocumentId: string, fieldValuesByFieldName: Record<string, unknown>) => {
      const changeRequest = { id: fileDocumentId, fieldValuesByFieldName }
      const changedFileDocument = await sendForData<FileDocument>({ method: 'PUT', path: '/api/file-document', body: changeRequest })
      if (changedFileDocument !== null) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return changedFileDocument
    },
    [sendForData],
  )

  /** DELETE (weich): Setzt die eigene Datei auf DELETED. */
  const deleteOwnFileDocument = useCallback(async (fileDocumentId: string) => {
    const idRequest = { id: fileDocumentId }
    const deleted = await sendForSuccess({ method: 'DELETE', path: '/api/file-document', body: idRequest })
    if (deleted) {
      clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
    }
    return deleted
  }, [sendForSuccess])

  /** UPDATE: Wer außer dem Autor die Metadaten bearbeiten darf (Autor, FILE_MANAGER, ADMIN); leer nimmt alle zurück. */
  const changeFileDocumentEditors = useCallback(
    async (fileDocumentId: string, editorUsersGuids: string[]) => {
      const editorsRequest = { id: fileDocumentId, editorUsersGuids }
      const changedFileDocument = await sendForData<FileDocument>({
        method: 'PUT',
        path: '/api/file-document/editors',
        body: editorsRequest,
      })
      if (changedFileDocument !== null) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return changedFileDocument
    },
    [sendForData],
  )

  /** UPDATE: Ändert die Sichtbarkeit der eigenen Datei. */
  const changeOwnFileDocumentVisibility = useCallback(
    async (fileDocumentId: string, visibility: Visibility) => {
      const visibilityRequest = { id: fileDocumentId, visibility }
      const changedFileDocument = await sendForData<FileDocument>({
        method: 'PUT',
        path: '/api/file-document/visibility',
        body: visibilityRequest,
      })
      if (changedFileDocument !== null) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return changedFileDocument
    },
    [sendForData],
  )

  /** UPDATE (File-Manager): Ändert die Sichtbarkeit jeder aktiven Datei. */
  const changeFileDocumentVisibility = useCallback(
    async (fileDocumentId: string, visibility: Visibility) => {
      const visibilityRequest = { id: fileDocumentId, visibility }
      const changedFileDocument = await sendForData<FileDocument>({
        method: 'PUT',
        path: '/api/file-manager/file-document/visibility',
        body: visibilityRequest,
      })
      if (changedFileDocument !== null) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return changedFileDocument
    },
    [sendForData],
  )

  /** UPDATE (File-Manager): Ändert die Metadaten jeder aktiven Datei. */
  const changeFileDocument = useCallback(
    async (fileDocumentId: string, fieldValuesByFieldName: Record<string, unknown>) => {
      const changeRequest = { id: fileDocumentId, fieldValuesByFieldName }
      const changedFileDocument = await sendForData<FileDocument>({
        method: 'PUT',
        path: '/api/file-manager/file-document',
        body: changeRequest,
      })
      if (changedFileDocument !== null) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return changedFileDocument
    },
    [sendForData],
  )

  /** DELETE (Admin, weich): Setzt jede aktive Datei auf DELETED. */
  const deleteFileDocument = useCallback(async (fileDocumentId: string) => {
    const idRequest = { id: fileDocumentId }
    const deleted = await sendForSuccess({ method: 'DELETE', path: '/api/admin/file-document', body: idRequest })
    if (deleted) {
      clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
    }
    return deleted
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    uploadFile,
    getFileDocumentExistence,
    searchFileFieldValues,
    resolveFileAnalysisProgress,
    getFileDocumentForClient,
    resolveFileDocuments,
    changeOwnFileDocument,
    deleteOwnFileDocument,
    changeFileDocumentEditors,
    changeOwnFileDocumentVisibility,
    changeFileDocumentVisibility,
    changeFileDocument,
    deleteFileDocument,
  }
}
