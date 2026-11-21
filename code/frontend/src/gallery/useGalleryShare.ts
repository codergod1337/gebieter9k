import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { FileCommentThread } from '../file/FileComment.ts'
import type {
  GalleryShare,
  GalleryShareChange,
  GalleryShareForAdmin,
  NewGalleryShare,
  SharedGallery,
} from './GalleryShare.ts'
import { getSharedGalleryApiPath } from './galleryShareUrls.ts'

/**
 * Was {@link useGalleryShare} anbietet: die Endpunkte des Besitzers unter `/api/gallery-share`, die Übersicht des
 * Admins samt Ändern und Löschen unter `/api/admin/gallery-share` und die Standardansicht des Besuchers unter
 * `/api/share/token/<token>`, benannt wie die Methoden im Backend. Lesen, Anlegen und Ändern liefern Daten oder `null`,
 * Löschen `true` oder `false`; der Fehler steht dann in `error`.
 */
export type GalleryShareHook = ApiHookState & {
  createOwnGalleryShare: (newGalleryShare: NewGalleryShare) => Promise<GalleryShare | null>
  resolveOwnGalleryShares: (galleryId: number) => Promise<GalleryShare[] | null>
  getAllOwnGalleryShare: () => Promise<GalleryShare[] | null>
  getAllGalleryShare: () => Promise<GalleryShareForAdmin[] | null>
  changeGalleryShare: (galleryShareChange: GalleryShareChange) => Promise<GalleryShare | null>
  deleteOwnGalleryShare: (galleryShareId: number) => Promise<boolean>
  deleteGalleryShare: (galleryShareId: number) => Promise<boolean>
  resolveSharedGallery: (shareToken: string, page: number) => Promise<SharedGallery | null>
  getSharedFileCommentThread: (shareToken: string, fileDocumentId: string) => Promise<FileCommentThread | null>
}

/** Die Freigaben einer Galerie über einen Link mit Token (Konzept `docu/konzept-galerie-freigabe.md`). */
export function useGalleryShare(): GalleryShareHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Eine eigene Galerie freigeben. Die Antwort ist die angelegte Freigabe mit ihrem Token für den Link. */
  const createOwnGalleryShare = useCallback((newGalleryShare: NewGalleryShare) => {
    return sendForData<GalleryShare>({ method: 'POST', path: '/api/gallery-share', body: newGalleryShare })
  }, [sendForData])

  /** READ: Die Freigaben einer eigenen Galerie, die älteste zuerst, je mit ihrem Token für den Link. */
  const resolveOwnGalleryShares = useCallback((galleryId: number) => {
    const resolveRequest = { galleryId }
    return sendForData<GalleryShare[]>({ method: 'POST', path: '/api/gallery-share/resolve', body: resolveRequest })
  }, [sendForData])

  /** READ: Alle Freigaben aller eigenen Galerien, die älteste zuerst; für die Liste der eigenen Galerien. */
  const getAllOwnGalleryShare = useCallback(() => {
    return sendForData<GalleryShare[]>({ method: 'GET', path: '/api/gallery-share' })
  }, [sendForData])

  /** READ (nur Admin): Alle Freigaben aller Galerien, die neueste zuerst, je mit Galerie und Besitzer. */
  const getAllGalleryShare = useCallback(() => {
    return sendForData<GalleryShareForAdmin[]>({ method: 'GET', path: '/api/admin/gallery-share' })
  }, [sendForData])

  /** UPDATE (nur Admin): Bezeichnung und Laufzeit einer beliebigen Freigabe ändern; der Link bleibt derselbe. */
  const changeGalleryShare = useCallback((galleryShareChange: GalleryShareChange) => {
    return sendForData<GalleryShare>({ method: 'PUT', path: '/api/admin/gallery-share', body: galleryShareChange })
  }, [sendForData])

  /** DELETE: Eine Freigabe einer eigenen Galerie löschen; ihr Link öffnet danach nichts mehr. */
  const deleteOwnGalleryShare = useCallback((galleryShareId: number) => {
    const deleteRequest = { id: galleryShareId }
    return sendForSuccess({ method: 'DELETE', path: '/api/gallery-share', body: deleteRequest })
  }, [sendForSuccess])

  /** DELETE (nur Admin): Eine beliebige Freigabe löschen; ihr Link öffnet danach nichts mehr. */
  const deleteGalleryShare = useCallback((galleryShareId: number) => {
    const deleteRequest = { id: galleryShareId }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/gallery-share', body: deleteRequest })
  }, [sendForSuccess])

  /**
   * READ (Besucher, ohne Anmeldung): Die Galerie einer Freigabe und eine Seite ihrer Bilder, ab 0. Die erste Seite ist
   * die Standardansicht (GET), jede weitere wird aufgelöst (POST, die Seite steht im Body).
   */
  const resolveSharedGallery = useCallback((shareToken: string, page: number) => {
    const sharedGalleryPath = getSharedGalleryApiPath(shareToken)
    if (page === 0) {
      return sendForData<SharedGallery>({ method: 'GET', path: sharedGalleryPath })
    }
    const pageRequest = { page }
    const resolvePath = sharedGalleryPath + '/resolve'
    return sendForData<SharedGallery>({ method: 'POST', path: resolvePath, body: pageRequest })
  }, [sendForData])

  /**
   * READ (Besucher, ohne Anmeldung): Die Kommentare eines Bildes der Freigabe, die ältesten zuerst, mit ihren Autoren.
   * Schreiben kann ein Besucher nicht.
   */
  const getSharedFileCommentThread = useCallback((shareToken: string, fileDocumentId: string) => {
    const sharedCommentPath = getSharedGalleryApiPath(shareToken) + '/comment/' + fileDocumentId
    return sendForData<FileCommentThread>({ method: 'GET', path: sharedCommentPath })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createOwnGalleryShare,
    resolveOwnGalleryShares,
    getAllOwnGalleryShare,
    getAllGalleryShare,
    changeGalleryShare,
    deleteOwnGalleryShare,
    deleteGalleryShare,
    resolveSharedGallery,
    getSharedFileCommentThread,
  }
}
