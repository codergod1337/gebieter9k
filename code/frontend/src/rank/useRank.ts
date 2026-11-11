import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { Rank } from './Rank.ts'

/**
 * Was {@link useRank} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von `/api/admin/rank` (nur
 * ADMIN) eine Funktion, benannt wie die Methode im `RankService` des Backends.
 */
export type RankHook = ApiHookState & {
  createRank: (newRank: Rank) => Promise<Rank | null>
  getRank: (rankKey: string) => Promise<Rank | null>
  getAllRank: () => Promise<Rank[] | null>
  changeRank: (changedRank: Rank) => Promise<Rank | null>
  changeRankLevels: (rankKeysInOrder: string[]) => Promise<Rank[] | null>
  deleteRank: (rankKey: string) => Promise<boolean>
}

/** Alle Endpunkte von `/api/admin/rank`, die Requests gehen über das API-Modul. */
export function useRank(): RankHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Legt einen Rang oben auf der Leiter an und liefert ihn. Die Stufe im Body zählt nicht. */
  const createRank = useCallback((newRank: Rank) => {
    return sendForData<Rank>({ method: 'POST', path: '/api/admin/rank', body: newRank })
  }, [sendForData])

  /** READ: Ein Rang über seinen Key. */
  const getRank = useCallback((rankKey: string) => {
    const rankPath = '/api/admin/rank/' + rankKey
    return sendForData<Rank>({ method: 'GET', path: rankPath })
  }, [sendForData])

  /** READ: Alle Ränge, von Stufe 1 aufwärts. */
  const getAllRank = useCallback(() => {
    return sendForData<Rank[]>({ method: 'GET', path: '/api/admin/rank' })
  }, [sendForData])

  /** UPDATE: Ändert Anzeigename, Mindestpunkte und Aussehen eines Rangs und liefert ihn. */
  const changeRank = useCallback((changedRank: Rank) => {
    return sendForData<Rank>({ method: 'PUT', path: '/api/admin/rank', body: changedRank })
  }, [sendForData])

  /** UPDATE: Die neuen Stufen nach Drag and Drop, jeder Key genau einmal, von Stufe 1 aufwärts. */
  const changeRankLevels = useCallback((rankKeysInOrder: string[]) => {
    const listingOrder = { keysInOrder: rankKeysInOrder }
    return sendForData<Rank[]>({ method: 'PUT', path: '/api/admin/rank/level', body: listingOrder })
  }, [sendForData])

  /** DELETE: Löscht einen Rang, die darüber rücken nach. Liefert, ob es geklappt hat. */
  const deleteRank = useCallback((rankKey: string) => {
    const rankToDelete = { key: rankKey }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/rank', body: rankToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createRank,
    getRank,
    getAllRank,
    changeRank,
    changeRankLevels,
    deleteRank,
  }
}
