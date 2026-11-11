import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { ShopCategory } from './ShopCategory.ts'

/**
 * Was {@link useShopCategory} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/shop-category` (Liste für jeden) und `/api/admin/shop-category` (Pflege, nur ADMIN) eine Funktion, benannt wie
 * die Methode im `ShopCategoryService` des Backends.
 *
 * Anlegen und Ändern liefern die Rubrik, Lesen das Objekt bzw. die Liste. Bei einem Fehler kommt `null`, der Fehler
 * steht dann in `error`. Ein DELETE gibt es im Backend noch nicht.
 */
export type ShopCategoryHook = ApiHookState & {
  createShopCategory: (newShopCategory: ShopCategory) => Promise<ShopCategory | null>
  getShopCategory: (shopCategoryKey: string) => Promise<ShopCategory | null>
  getAllShopCategory: () => Promise<ShopCategory[] | null>
  changeShopCategory: (changedShopCategory: ShopCategory) => Promise<ShopCategory | null>
  changeShopCategoryListingPositions: (shopCategoryKeysInOrder: string[]) => Promise<ShopCategory[] | null>
}

/** Alle Endpunkte von `/api/shop-category` und `/api/admin/shop-category`, die Requests gehen über das API-Modul. */
export function useShopCategory(): ShopCategoryHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Legt eine Rubrik am Ende der Liste an und liefert sie. */
  const createShopCategory = useCallback((newShopCategory: ShopCategory) => {
    return sendForData<ShopCategory>({ method: 'POST', path: '/api/admin/shop-category', body: newShopCategory })
  }, [sendForData])

  /** READ: Eine Rubrik über ihren Key. */
  const getShopCategory = useCallback((shopCategoryKey: string) => {
    const shopCategoryPath = '/api/admin/shop-category/' + shopCategoryKey
    return sendForData<ShopCategory>({ method: 'GET', path: shopCategoryPath })
  }, [sendForData])

  /** READ: Alle Rubriken in der Reihenfolge der Anzeige. */
  const getAllShopCategory = useCallback(() => {
    return sendForData<ShopCategory[]>({ method: 'GET', path: '/api/shop-category' })
  }, [sendForData])

  /**
   * UPDATE: Ändert den Anzeigenamen und die FileClass und liefert die Rubrik. Der Body ist das volle Objekt, der Key
   * ändert sich nie.
   */
  const changeShopCategory = useCallback((changedShopCategory: ShopCategory) => {
    return sendForData<ShopCategory>({ method: 'PUT', path: '/api/admin/shop-category', body: changedShopCategory })
  }, [sendForData])

  /** UPDATE: Die neue Reihenfolge nach Drag and Drop, jeder Key genau einmal. Liefert alle Rubriken neu sortiert. */
  const changeShopCategoryListingPositions = useCallback((shopCategoryKeysInOrder: string[]) => {
    const listingOrder = { keysInOrder: shopCategoryKeysInOrder }
    return sendForData<ShopCategory[]>({
      method: 'PUT',
      path: '/api/admin/shop-category/listing-position',
      body: listingOrder,
    })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createShopCategory,
    getShopCategory,
    getAllShopCategory,
    changeShopCategory,
    changeShopCategoryListingPositions,
  }
}
