import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { PointActivity } from './PointActivity.ts'

/**
 * Was {@link usePointActivity} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/admin/point-activity` (nur ADMIN) eine Funktion, benannt wie die Methode im `PointActivityService`.
 */
export type PointActivityHook = ApiHookState & {
  createPointActivity: (newPointActivity: PointActivity) => Promise<PointActivity | null>
  getPointActivity: (pointActivityKey: string) => Promise<PointActivity | null>
  getAllPointActivity: () => Promise<PointActivity[] | null>
  changePointActivity: (changedPointActivity: PointActivity) => Promise<PointActivity | null>
  changePointActivityListingPositions: (pointActivityKeysInOrder: string[]) => Promise<PointActivity[] | null>
  deletePointActivity: (pointActivityKey: string) => Promise<boolean>
}

/** Alle Endpunkte von `/api/admin/point-activity`, die Requests gehen über das API-Modul. */
export function usePointActivity(): PointActivityHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Legt eine Tätigkeit am Ende der Liste an und liefert sie. */
  const createPointActivity = useCallback((newPointActivity: PointActivity) => {
    return sendForData<PointActivity>({ method: 'POST', path: '/api/admin/point-activity', body: newPointActivity })
  }, [sendForData])

  /** READ: Eine Tätigkeit über ihren Key. */
  const getPointActivity = useCallback((pointActivityKey: string) => {
    const pointActivityPath = '/api/admin/point-activity/' + pointActivityKey
    return sendForData<PointActivity>({ method: 'GET', path: pointActivityPath })
  }, [sendForData])

  /** READ: Alle Tätigkeiten in der Reihenfolge der Anzeige. */
  const getAllPointActivity = useCallback(() => {
    return sendForData<PointActivity[]>({ method: 'GET', path: '/api/admin/point-activity' })
  }, [sendForData])

  /** UPDATE: Ändert Name, Beschreibung und Punkte (nie rückwirkend) und liefert die Tätigkeit. */
  const changePointActivity = useCallback((changedPointActivity: PointActivity) => {
    return sendForData<PointActivity>({ method: 'PUT', path: '/api/admin/point-activity', body: changedPointActivity })
  }, [sendForData])

  /** UPDATE: Die neue Reihenfolge nach Drag and Drop, jeder Key genau einmal. */
  const changePointActivityListingPositions = useCallback((pointActivityKeysInOrder: string[]) => {
    const listingOrder = { keysInOrder: pointActivityKeysInOrder }
    return sendForData<PointActivity[]>({
      method: 'PUT',
      path: '/api/admin/point-activity/listing-position',
      body: listingOrder,
    })
  }, [sendForData])

  /** DELETE: Löscht eine Tätigkeit. Liefert, ob es geklappt hat. */
  const deletePointActivity = useCallback((pointActivityKey: string) => {
    const pointActivityToDelete = { key: pointActivityKey }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/point-activity', body: pointActivityToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createPointActivity,
    getPointActivity,
    getAllPointActivity,
    changePointActivity,
    changePointActivityListingPositions,
    deletePointActivity,
  }
}
