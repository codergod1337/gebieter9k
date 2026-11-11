import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { Guestbook, GuestbookComment, GuestbookPage } from './Guestbook.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Was {@link useGuestbook} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt des Gästebuchs
 * (`/api/guestbook`, `/api/guestbook-comment`, `/api/guestbook-reaction`, `/api/admin/guestbook`) eine Funktion, benannt
 * wie die Methode im `GuestbookService` des Backends.
 *
 * Lesen und Schreiben liefern die Seite bzw. den neuen Eintrag, bei einem Fehler `null`; Löschen und Smileys nur, ob es
 * geklappt hat. Der Fehler steht dann in `error`. Kein Ändern: Einträge und Kommentare bleiben, wie sie sind.
 */
export type GuestbookHook = ApiHookState & {
  resolveGuestbookPage: (profileUsersGuid: string, page: number) => Promise<GuestbookPage | null>
  createOwnGuestbook: (profileUsersGuid: string, entryText: MultilingualText) => Promise<Guestbook | null>
  deleteOwnGuestbook: (id: number) => Promise<boolean>
  deleteGuestbook: (id: number) => Promise<boolean>
  createOwnGuestbookComment: (guestbookId: number, commentText: MultilingualText) => Promise<GuestbookComment | null>
  deleteOwnGuestbookComment: (id: number) => Promise<boolean>
  deleteGuestbookComment: (id: number) => Promise<boolean>
  createOwnGuestbookReaction: (guestbookId: number, guestbookCommentId: number | null, reactionEmoji: string) => Promise<boolean>
}

/** Alle Endpunkte des Gästebuchs, die Requests gehen über das API-Modul. Wer schreibt, kommt im Backend aus dem Token. */
export function useGuestbook(): GuestbookHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** READ: Eine Seite des Gästebuchs eines Users, ab Seite 0, die neuesten Einträge zuerst. */
  const resolveGuestbookPage = useCallback((profileUsersGuid: string, page: number) => {
    const resolveRequest = { profileUsersGuid, page }
    return sendForData<GuestbookPage>({ method: 'POST', path: '/api/guestbook/resolve', body: resolveRequest })
  }, [sendForData])

  /** CREATE: Einen Eintrag ins Gästebuch eines Users schreiben, auch ins eigene. */
  const createOwnGuestbook = useCallback((profileUsersGuid: string, entryText: MultilingualText) => {
    const newGuestbook = { profileUsersGuid, entryText }
    return sendForData<Guestbook>({ method: 'POST', path: '/api/guestbook', body: newGuestbook })
  }, [sendForData])

  /** DELETE: Einen Eintrag löschen, als Autor oder Besitzer des Gästebuchs; Kommentare und Smileys gehen mit. */
  const deleteOwnGuestbook = useCallback((id: number) => {
    const deleteRequest = { id }
    return sendForSuccess({ method: 'DELETE', path: '/api/guestbook', body: deleteRequest })
  }, [sendForSuccess])

  /** DELETE (Admin): Einen beliebigen Eintrag löschen. */
  const deleteGuestbook = useCallback((id: number) => {
    const deleteRequest = { id }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/guestbook', body: deleteRequest })
  }, [sendForSuccess])

  /** CREATE: Einen Kommentar unter einen Eintrag schreiben. */
  const createOwnGuestbookComment = useCallback((guestbookId: number, commentText: MultilingualText) => {
    const newGuestbookComment = { guestbookId, commentText }
    return sendForData<GuestbookComment>({ method: 'POST', path: '/api/guestbook-comment', body: newGuestbookComment })
  }, [sendForData])

  /** DELETE: Einen Kommentar löschen, als Autor oder Besitzer des Gästebuchs; seine Smileys gehen mit. */
  const deleteOwnGuestbookComment = useCallback((id: number) => {
    const deleteRequest = { id }
    return sendForSuccess({ method: 'DELETE', path: '/api/guestbook-comment', body: deleteRequest })
  }, [sendForSuccess])

  /** DELETE (Admin): Einen beliebigen Kommentar löschen. */
  const deleteGuestbookComment = useCallback((id: number) => {
    const deleteRequest = { id }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/guestbook/comment', body: deleteRequest })
  }, [sendForSuccess])

  /** CREATE: Einen Smiley vergeben, an den Eintrag (`guestbookCommentId` `null`) oder an einen Kommentar. Nur in eine Richtung. */
  const createOwnGuestbookReaction = useCallback((guestbookId: number, guestbookCommentId: number | null, reactionEmoji: string) => {
    const newGuestbookReaction = { guestbookId, guestbookCommentId, reactionEmoji }
    return sendForSuccess({ method: 'POST', path: '/api/guestbook-reaction', body: newGuestbookReaction })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    resolveGuestbookPage,
    createOwnGuestbook,
    deleteOwnGuestbook,
    deleteGuestbook,
    createOwnGuestbookComment,
    deleteOwnGuestbookComment,
    deleteGuestbookComment,
    createOwnGuestbookReaction,
  }
}
