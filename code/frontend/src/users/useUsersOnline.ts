import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { OnlineUsersCount, UsersOnlineStatus } from './UsersOnline.ts'

/** Was {@link useUsersOnline} anbietet: den einheitlichen {@link ApiHookState}, die Zahl und den Status eines Users. */
export type UsersOnlineHook = ApiHookState & {
  getOnlineUsersCount: () => Promise<OnlineUsersCount | null>
  getVisibleUsersOnlineStatus: (usersGuid: string) => Promise<UsersOnlineStatus | null>
}

/** Die Endpunkte von `/api/users-online`: wer gerade online ist, gemessen nur auf dem Server. */
export function useUsersOnline(): UsersOnlineHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** READ: Wie viele User gerade online sind. */
  const getOnlineUsersCount = useCallback(() => {
    return sendForData<OnlineUsersCount>({ method: 'GET', path: '/api/users-online/count' })
  }, [sendForData])

  /** READ: Ob ein User gerade online ist und seit wann; nur bei einem Profil, das man sehen darf. */
  const getVisibleUsersOnlineStatus = useCallback((usersGuid: string) => {
    const usersOnlinePath = '/api/users-online/' + usersGuid
    return sendForData<UsersOnlineStatus>({ method: 'GET', path: usersOnlinePath })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getOnlineUsersCount,
    getVisibleUsersOnlineStatus,
  }
}
