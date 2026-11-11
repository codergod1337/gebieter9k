import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import { clearViewCacheScope } from '../navigation/viewCache.ts'
import { SHOP_ITEM_VIEW_CACHE_SCOPE } from './shopItemViewCacheScope.ts'
import type { NewShopOrder, ShopOrder } from './ShopOrder.ts'

/**
 * Was {@link useShopOrder} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von `/api/shop-order` eine
 * Funktion, benannt wie die Methode im Backend (`ShopOrderService.createShopOrder`). Kaufen liefert den Beleg; kommt der
 * Kauf nicht zustande, kommt `null`, der Grund steht dann in `error`.
 */
export type ShopOrderHook = ApiHookState & {
  createShopOrder: (shopOfferId: number) => Promise<ShopOrder | null>
}

/** Alle Endpunkte von `/api/shop-order`. Nach einem Kauf leert er den Bereich der Artikel im Zwischenspeicher der Ansichten. */
export function useShopOrder(): ShopOrderHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Der angemeldete User kauft ein Angebot und bekommt den Beleg. Preis und Form bestimmt das Backend. */
  const createShopOrder = useCallback(
    async (shopOfferId: number) => {
      const newShopOrder: NewShopOrder = { shopOfferId }
      const createdShopOrder = await sendForData<ShopOrder>({ method: 'POST', path: '/api/shop-order', body: newShopOrder })
      if (createdShopOrder !== null) {
        clearViewCacheScope(SHOP_ITEM_VIEW_CACHE_SCOPE)
      }
      return createdShopOrder
    },
    [sendForData],
  )

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createShopOrder,
  }
}
