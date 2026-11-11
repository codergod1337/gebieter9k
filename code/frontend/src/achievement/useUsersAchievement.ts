import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { UsersAchievementSummary } from './UsersAchievementSummary.ts'

/** Was {@link useUsersAchievement} anbietet: den einheitlichen {@link ApiHookState} und die eigenen Abschlüsse. */
export type UsersAchievementHook = ApiHookState & {
  getOwnUsersAchievementSummaries: () => Promise<UsersAchievementSummary[] | null>
}

/**
 * Die Endpunkte von `/api/users-achievement`. Angelegt werden Abschlüsse nie vom Frontend, nur vom Backend beim Prüfen
 * des Protokolls.
 */
export function useUsersAchievement(): UsersAchievementHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** READ: Die eigenen erreichten Achievements je Achievement: wie oft, erster und letzter Abschluss. */
  const getOwnUsersAchievementSummaries = useCallback(() => {
    return sendForData<UsersAchievementSummary[]>({ method: 'GET', path: '/api/users-achievement' })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getOwnUsersAchievementSummaries,
  }
}
