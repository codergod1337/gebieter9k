import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { DiscardedSymbol, SymbolReference } from './DiscardedSymbol.ts'

/**
 * Was {@link useDiscardedSymbol} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/admin/discarded-symbol` (nur ADMIN) eine Funktion, benannt wie die Methode im `DiscardedSymbolService`.
 */
export type DiscardedSymbolHook = ApiHookState & {
  createDiscardedSymbols: (symbols: SymbolReference[]) => Promise<DiscardedSymbol[] | null>
  getAllDiscardedSymbol: () => Promise<DiscardedSymbol[] | null>
  deleteDiscardedSymbols: (symbols: SymbolReference[]) => Promise<boolean>
}

/** Alle Endpunkte der gelöschten Symbole, die Requests gehen über das API-Modul. */
export function useDiscardedSymbol(): DiscardedSymbolHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Löscht die markierten Symbole und liefert die neu gelöschten. */
  const createDiscardedSymbols = useCallback((symbols: SymbolReference[]) => {
    const symbolBatch = { symbols }
    return sendForData<DiscardedSymbol[]>({ method: 'POST', path: '/api/admin/discarded-symbol', body: symbolBatch })
  }, [sendForData])

  /** READ: Alle gelöschten Symbole. */
  const getAllDiscardedSymbol = useCallback(() => {
    return sendForData<DiscardedSymbol[]>({ method: 'GET', path: '/api/admin/discarded-symbol' })
  }, [sendForData])

  /** DELETE: Holt die markierten Symbole zurück. Liefert, ob es geklappt hat. */
  const deleteDiscardedSymbols = useCallback((symbols: SymbolReference[]) => {
    const symbolBatch = { symbols }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/discarded-symbol', body: symbolBatch })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createDiscardedSymbols,
    getAllDiscardedSymbol,
    deleteDiscardedSymbols,
  }
}
