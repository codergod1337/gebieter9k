import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'

/** Was {@link useUsersFriendship} anbietet: den einheitlichen {@link ApiHookState}, die eigenen Freunde und das Kündigen. */
export type UsersFriendshipHook = ApiHookState & {
  getOwnFriendUsersGuids: () => Promise<string[] | null>
  deleteOwnUsersFriendship: (friendUsersGuid: string) => Promise<boolean>
}

/** Die Endpunkte von `/api/users-friendship`, die das Frontend braucht. */
export function useUsersFriendship(): UsersFriendshipHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** READ: Die GUIDs der eigenen Freunde. */
  const getOwnFriendUsersGuids = useCallback(() => {
    return sendForData<string[]>({ method: 'GET', path: '/api/users-friendship' })
  }, [sendForData])

  /** DELETE: Eine eigene Freundschaft kündigen, beidseitig. */
  const deleteOwnUsersFriendship = useCallback((friendUsersGuid: string) => {
    const usersFriendshipDeleteRequest = { friendUsersGuid }
    return sendForSuccess({ method: 'DELETE', path: '/api/users-friendship', body: usersFriendshipDeleteRequest })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getOwnFriendUsersGuids,
    deleteOwnUsersFriendship,
  }
}
