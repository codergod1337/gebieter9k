import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { Achievement } from './Achievement.ts'

/**
 * Was {@link useAchievement} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/admin/achievement` (nur ADMIN) eine Funktion, benannt wie die Methode im `AchievementService` des Backends.
 */
export type AchievementHook = ApiHookState & {
  createAchievement: (newAchievement: Achievement) => Promise<Achievement | null>
  getAchievement: (achievementKey: string) => Promise<Achievement | null>
  getAllAchievement: () => Promise<Achievement[] | null>
  changeAchievement: (changedAchievement: Achievement) => Promise<Achievement | null>
  changeAchievementListingPositions: (achievementKeysInOrder: string[]) => Promise<Achievement[] | null>
  deleteAchievement: (achievementKey: string) => Promise<boolean>
}

/** Alle Endpunkte von `/api/admin/achievement`, die Requests gehen über das API-Modul. */
export function useAchievement(): AchievementHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Legt ein Achievement am Ende der Liste an und liefert es. */
  const createAchievement = useCallback((newAchievement: Achievement) => {
    return sendForData<Achievement>({ method: 'POST', path: '/api/admin/achievement', body: newAchievement })
  }, [sendForData])

  /** READ: Ein Achievement über seinen Key. */
  const getAchievement = useCallback((achievementKey: string) => {
    const achievementPath = '/api/admin/achievement/' + achievementKey
    return sendForData<Achievement>({ method: 'GET', path: achievementPath })
  }, [sendForData])

  /** READ: Alle Achievements in der Reihenfolge der Anzeige. */
  const getAllAchievement = useCallback(() => {
    return sendForData<Achievement[]>({ method: 'GET', path: '/api/admin/achievement' })
  }, [sendForData])

  /** UPDATE: Ändert Name, Beschreibung und Aussehen eines Achievements und liefert es. */
  const changeAchievement = useCallback((changedAchievement: Achievement) => {
    return sendForData<Achievement>({ method: 'PUT', path: '/api/admin/achievement', body: changedAchievement })
  }, [sendForData])

  /** UPDATE: Die neue Reihenfolge nach Drag and Drop, jeder Key genau einmal. */
  const changeAchievementListingPositions = useCallback((achievementKeysInOrder: string[]) => {
    const listingOrder = { keysInOrder: achievementKeysInOrder }
    return sendForData<Achievement[]>({
      method: 'PUT',
      path: '/api/admin/achievement/listing-position',
      body: listingOrder,
    })
  }, [sendForData])

  /** DELETE: Löscht ein Achievement. Liefert, ob es geklappt hat. */
  const deleteAchievement = useCallback((achievementKey: string) => {
    const achievementToDelete = { key: achievementKey }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/achievement', body: achievementToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createAchievement,
    getAchievement,
    getAllAchievement,
    changeAchievement,
    changeAchievementListingPositions,
    deleteAchievement,
  }
}
