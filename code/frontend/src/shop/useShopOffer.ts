import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import { clearViewCacheScope } from '../navigation/viewCache.ts'
import type { NewShopOffer, ShopOffer } from './ShopOffer.ts'
import { SHOP_ITEM_VIEW_CACHE_SCOPE } from './shopItemViewCacheScope.ts'

/**
 * Was {@link useShopOffer} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von `/api/shop-offer` eine
 * Funktion, benannt wie die Methode im Backend (`ShopItemService.createShopOfferOfOwnShopItem`). Anlegen liefert das
 * Angebot; bei einem Fehler kommt `null`, der Fehler steht dann in `error`.
 */
export type ShopOfferHook = ApiHookState & {
  createShopOfferOfOwnShopItem: (newShopOffer: NewShopOffer) => Promise<ShopOffer | null>
}

/** Alle Endpunkte von `/api/shop-offer`. Nach dem Anlegen leert er den Bereich der Artikel im Zwischenspeicher der Ansichten. */
export function useShopOffer(): ShopOfferHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Legt ein Angebot zu einem eigenen Artikel an (Verkäufer oder ADMIN) und liefert es. */
  const createShopOfferOfOwnShopItem = useCallback(
    async (newShopOffer: NewShopOffer) => {
      const createdShopOffer = await sendForData<ShopOffer>({ method: 'POST', path: '/api/shop-offer', body: newShopOffer })
      if (createdShopOffer !== null) {
        clearViewCacheScope(SHOP_ITEM_VIEW_CACHE_SCOPE)
      }
      return createdShopOffer
    },
    [sendForData],
  )

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createShopOfferOfOwnShopItem,
  }
}
