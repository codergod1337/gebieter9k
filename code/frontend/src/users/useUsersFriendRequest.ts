import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { UsersFriendRequest } from './UsersFriendRequest.ts'

/**
 * Was {@link useUsersFriendRequest} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/users-friend-request` eine Funktion, benannt wie die Methode im Backend. Bei einem Fehler kommt `null`, der Fehler
 * steht dann in `error`.
 */
export type UsersFriendRequestHook = ApiHookState & {
  createOwnUsersFriendRequest: (acceptorUsersGuid: string) => Promise<UsersFriendRequest | null>
  getOwnOpenUsersFriendRequest: () => Promise<UsersFriendRequest[] | null>
  answerOwnUsersFriendRequest: (id: number, accepted: boolean) => Promise<UsersFriendRequest | null>
}

/** Die eigenen Freundschaftsanträge; die eigene GUID kommt im Backend aus dem Token. */
export function useUsersFriendRequest(): UsersFriendRequestHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Einen Antrag an einen User stellen. */
  const createOwnUsersFriendRequest = useCallback((acceptorUsersGuid: string) => {
    const newUsersFriendRequest = { acceptorUsersGuid }
    return sendForData<UsersFriendRequest>({ method: 'POST', path: '/api/users-friend-request', body: newUsersFriendRequest })
  }, [sendForData])

  /** READ: Die eigenen offenen Anträge, an mich und von mir. */
  const getOwnOpenUsersFriendRequest = useCallback(() => {
    return sendForData<UsersFriendRequest[]>({ method: 'GET', path: '/api/users-friend-request' })
  }, [sendForData])

  /** UPDATE: Einen Antrag an mich annehmen oder ablehnen. */
  const answerOwnUsersFriendRequest = useCallback((id: number, accepted: boolean) => {
    const usersFriendRequestAnswer = { id, accepted }
    return sendForData<UsersFriendRequest>({ method: 'PUT', path: '/api/users-friend-request', body: usersFriendRequestAnswer })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createOwnUsersFriendRequest,
    getOwnOpenUsersFriendRequest,
    answerOwnUsersFriendRequest,
  }
}
