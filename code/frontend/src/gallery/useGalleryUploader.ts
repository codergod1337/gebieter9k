import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import { FILE_DOCUMENT_VIEW_CACHE_SCOPE } from '../file/fileDocumentViewCacheScope.ts'
import { clearViewCacheScope } from '../navigation/viewCache.ts'
import type { GalleryUploader } from './GalleryUploader.ts'

/**
 * Was {@link useGalleryUploader} anbietet: je Endpunkt von `/api/gallery-uploader` eine Funktion, benannt wie die Methode
 * im `GalleryUploaderService` des Backends. Anlegen und Lesen liefern Daten oder `null`, Löschen `true` oder `false`;
 * der Fehler steht dann in `error`.
 */
export type GalleryUploaderHook = ApiHookState & {
  createOwnGalleryUploader: (galleryId: number, uploaderUsersGuid: string) => Promise<GalleryUploader | null>
  getAllOwnGalleryUploader: () => Promise<GalleryUploader[] | null>
  resolveGalleryUploaders: (galleryId: number) => Promise<GalleryUploader[] | null>
  deleteOwnGalleryUploader: (galleryUploaderId: number) => Promise<boolean>
}

/**
 * Die Uploadberechtigten der Galerien (Nutzer 2026-11-22, Konzept `docu/konzept-galerie.md`, „Gemeinsame Galerie“).
 * Eintragen und Austragen leeren den Bereich der Dateien im Zwischenspeicher der Ansichten: Wer was in einer Galerie
 * sieht und darf, hat sich geändert.
 */
export function useGalleryUploader(): GalleryUploaderHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Einen User als Uploadberechtigten in eine eigene Galerie eintragen. */
  const createOwnGalleryUploader = useCallback(
    async (galleryId: number, uploaderUsersGuid: string) => {
      const newGalleryUploader = { galleryId, uploaderUsersGuid }
      const createdGalleryUploader = await sendForData<GalleryUploader>({
        method: 'POST',
        path: '/api/gallery-uploader',
        body: newGalleryUploader,
      })
      if (createdGalleryUploader !== null) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return createdGalleryUploader
    },
    [sendForData],
  )

  /**
   * READ: Alle Einträge, in denen man selbst der Uploadberechtigte ist: die fremden Galerien, in die man hochladen darf.
   * Für die Liste der Galerien im eigenen Profil; die Galerie selbst holt `useGallery().getGalleryForClient`.
   */
  const getAllOwnGalleryUploader = useCallback(() => {
    return sendForData<GalleryUploader[]>({ method: 'GET', path: '/api/gallery-uploader' })
  }, [sendForData])

  /** READ: Die Uploadberechtigten einer Galerie, die man sehen darf, der zuerst eingetragene zuerst. */
  const resolveGalleryUploaders = useCallback((galleryId: number) => {
    const resolveRequest = { galleryId }
    return sendForData<GalleryUploader[]>({ method: 'POST', path: '/api/gallery-uploader/resolve', body: resolveRequest })
  }, [sendForData])

  /** DELETE: Einen Uploadberechtigten aus einer eigenen Galerie austragen; seine Bilder bleiben in der Galerie. */
  const deleteOwnGalleryUploader = useCallback(
    async (galleryUploaderId: number) => {
      const deleteRequest = { id: galleryUploaderId }
      const deleted = await sendForSuccess({ method: 'DELETE', path: '/api/gallery-uploader', body: deleteRequest })
      if (deleted) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
      }
      return deleted
    },
    [sendForSuccess],
  )

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createOwnGalleryUploader,
    getAllOwnGalleryUploader,
    resolveGalleryUploaders,
    deleteOwnGalleryUploader,
  }
}
