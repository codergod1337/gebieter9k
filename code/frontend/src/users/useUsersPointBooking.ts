import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { UsersPointBookingPage } from './UsersPointBooking.ts'

/** Was {@link useUsersPointBooking} anbietet: den einheitlichen {@link ApiHookState} und den eigenen Kontoauszug. */
export type UsersPointBookingHook = ApiHookState & {
  resolveOwnUsersPointBookingPage: (page: number) => Promise<UsersPointBookingPage | null>
}

/** Die Endpunkte von `/api/users-point-booking`: nur lesen, gebucht wird nie vom Frontend. */
export function useUsersPointBooking(): UsersPointBookingHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** READ: Eine Seite des eigenen Kontoauszugs, die neuesten Buchungen zuerst, dazu der Stand. */
  const resolveOwnUsersPointBookingPage = useCallback((page: number) => {
    const usersPointBookingResolveRequest = { page }
    return sendForData<UsersPointBookingPage>({
      method: 'POST',
      path: '/api/users-point-booking/resolve',
      body: usersPointBookingResolveRequest,
    })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    resolveOwnUsersPointBookingPage,
  }
}
