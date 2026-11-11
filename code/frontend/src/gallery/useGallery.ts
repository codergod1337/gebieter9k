import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import type { UploadProgressListener } from '../api/ApiRequest.ts'
import { type ApiDataOrError, useApiRequest } from '../api/useApiRequest.ts'
import type { FileDocumentPage, FileUploadResult } from '../file/FileDocument.ts'
import { FILE_DOCUMENT_VIEW_CACHE_SCOPE } from '../file/fileDocumentViewCacheScope.ts'
import { clearViewCacheScope } from '../navigation/viewCache.ts'
import type { Gallery, GalleryForClient, GalleryInput } from './Gallery.ts'

/**
 * Was {@link useGallery} anbietet: je Endpunkt von `/api/gallery` eine Funktion, benannt wie die Methode im
 * `GalleryService` des Backends. Lesen und Ändern liefern Daten oder `null`, Löschen und Sortieren der Bilder `true` oder
 * `false`; der Fehler steht dann in `error`. Hochladen liefert die Daten oder den Fehler genau dieses Uploads.
 */
export type GalleryHook = ApiHookState & {
  createOwnGallery: (galleryInput: GalleryInput) => Promise<Gallery | null>
  uploadFileIntoGallery: (
    file: File,
    galleryId: number,
    clientFieldValues: Record<string, unknown>,
    onUploadProgress: UploadProgressListener,
    abortSignal: AbortSignal,
  ) => Promise<ApiDataOrError<FileUploadResult>>
  getGalleryForClient: (galleryId: number) => Promise<GalleryForClient | null>
  resolveGalleries: (ownerUsersGuid: string) => Promise<GalleryForClient[] | null>
  resolveGalleryFiles: (galleryId: number, page: number) => Promise<FileDocumentPage | null>
  changeOwnGallery: (galleryId: number, galleryInput: GalleryInput) => Promise<Gallery | null>
  changeOwnGalleryListingPositions: (galleryIdsInOrder: number[]) => Promise<Gallery[] | null>
  changeOwnGalleryFileListingPositions: (galleryId: number, page: number, fileDocumentIdsInOrder: string[]) => Promise<boolean>
  deleteOwnGallery: (galleryId: number) => Promise<boolean>
}

/**
 * Alle Endpunkte von `/api/gallery`. Nach jedem Schreiben an Bildern (Hochladen, Sortieren, Sichtbarkeit, Löschen) leert
 * er den Bereich der Dateien im Zwischenspeicher der Ansichten.
 */
export function useGallery(): GalleryHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess
  const sendForDataOrError = apiRequestHook.sendForDataOrError

  /** CREATE: Eine eigene Galerie anlegen. */
  const createOwnGallery = useCallback((galleryInput: GalleryInput) => {
    return sendForData<Gallery>({ method: 'POST', path: '/api/gallery', body: galleryInput })
  }, [sendForData])

  /**
   * CREATE: Eine Datei in eine eigene Galerie hochladen, wie jeder Upload: zuerst `data` als JSON (Galerie und FileClass),
   * dann die Datei. `abortSignal` bricht ab, z. B. beim Verlassen der Seite.
   */
  const uploadFileIntoGallery = useCallback(
    async (
      file: File,
      galleryId: number,
      clientFieldValues: Record<string, unknown>,
      onUploadProgress: UploadProgressListener,
      abortSignal: AbortSignal,
    ) => {
      const galleryUploadData = { galleryId, fieldValuesByFieldName: clientFieldValues }
      const galleryUploadDataJson = JSON.stringify(galleryUploadData)
      const dataPart = new Blob([galleryUploadDataJson], { type: 'application/json' })
      const multipartBody = new FormData()
      multipartBody.append('data', dataPart)
      multipartBody.append('file', file, file.name)
      const uploadOutcome = await sendForDataOrError<FileUploadResult>({
        method: 'POST',
        path: '/api/gallery/upload',
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

  /** READ: Eine Galerie, wenn man sie sehen darf. */
  const getGalleryForClient = useCallback((galleryId: number) => {
    const galleryPath = '/api/gallery/' + galleryId
    return sendForData<GalleryForClient>({ method: 'GET', path: galleryPath })
  }, [sendForData])

  /** READ: Die Galerien eines Profils, die man sehen darf. */
  const resolveGalleries = useCallback((ownerUsersGuid: string) => {
    const resolveRequest = { ownerUsersGuid }
    return sendForData<GalleryForClient[]>({ method: 'POST', path: '/api/gallery/resolve', body: resolveRequest })
  }, [sendForData])

  /** READ: Eine Seite der Bilder einer Galerie, ab 0, in ihrer Reihenfolge. */
  const resolveGalleryFiles = useCallback((galleryId: number, page: number) => {
    const resolveRequest = { galleryId, page }
    return sendForData<FileDocumentPage>({ method: 'POST', path: '/api/gallery/file/resolve', body: resolveRequest })
  }, [sendForData])

  /** UPDATE: Titel, Beschreibung und Sichtbarkeit einer eigenen Galerie; die Sichtbarkeit geht auf die Bilder über. */
  const changeOwnGallery = useCallback(async (galleryId: number, galleryInput: GalleryInput) => {
    const changeRequest = { id: galleryId, ...galleryInput }
    const changedGallery = await sendForData<Gallery>({ method: 'PUT', path: '/api/gallery', body: changeRequest })
    if (changedGallery !== null) {
      clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
    }
    return changedGallery
  }, [sendForData])

  /** UPDATE: Die eigenen Galerien neu sortieren, alle ids in neuer Reihenfolge. */
  const changeOwnGalleryListingPositions = useCallback((galleryIdsInOrder: number[]) => {
    const listingOrder = { galleryIdsInOrder }
    return sendForData<Gallery[]>({ method: 'PUT', path: '/api/gallery/listing-position', body: listingOrder })
  }, [sendForData])

  /** UPDATE: Die Bilder einer Seite einer eigenen Galerie neu sortieren, genau die ids dieser Seite. */
  const changeOwnGalleryFileListingPositions = useCallback(
    async (galleryId: number, page: number, fileDocumentIdsInOrder: string[]) => {
      const listingOrder = { galleryId, page, fileDocumentIdsInOrder }
      const reordered = await sendForSuccess({ method: 'PUT', path: '/api/gallery/file/listing-position', body: listingOrder })
      if (reordered) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return reordered
    },
    [sendForSuccess],
  )

  /** DELETE: Eine eigene Galerie löschen; ihre Bilder bleiben, ohne Galerie und privat. */
  const deleteOwnGallery = useCallback(async (galleryId: number) => {
    const deleteRequest = { id: galleryId }
    const deleted = await sendForSuccess({ method: 'DELETE', path: '/api/gallery', body: deleteRequest })
    if (deleted) {
      clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
    }
    return deleted
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createOwnGallery,
    uploadFileIntoGallery,
    getGalleryForClient,
    resolveGalleries,
    resolveGalleryFiles,
    changeOwnGallery,
    changeOwnGalleryListingPositions,
    changeOwnGalleryFileListingPositions,
    deleteOwnGallery,
  }
}
