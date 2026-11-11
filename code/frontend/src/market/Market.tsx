import { Outlet, useOutletContext } from 'react-router'
import { useLoadedData } from '../api/useLoadedData.ts'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { ShopCategory } from '../shop/ShopCategory.ts'
import { useShopCategory } from '../shop/useShopCategory.ts'
import { getMarketCategoryTabPath } from './marketPaths.ts'
import { MARKET_TEXTS } from './marketTexts.ts'

/** Was der Gebietermarkt seinen Seiten mitgibt: die Rubriken, jede mit ihrer FileClass. */
export type MarketContext = {
  /** Die Rubriken in der Reihenfolge der Anzeige; `null`, solange sie laden oder nach einem Fehler. */
  shopCategories: ShopCategory[] | null
  /** Fehler beim Laden, `null` wenn keiner. */
  errorMessage: string | null
}

/** Für die Seiten des Gebietermarkts: die Rubriken. */
export function useMarketContext(): MarketContext {
  return useOutletContext<MarketContext>()
}

/**
 * Das Modul „Gebietermarkt“ (Nutzer 2026-11-11: eine Kachel, in der die Rubriken stehen), für jeden angemeldeten User:
 * Subheader mit einem Tab je Rubrik, darunter die gewählte Rubrik. Die Rubriken pflegt der Admin im Modul
 * „Achievements & Markt“, dort legt er auch die FileClass jeder Rubrik fest. In einer Rubrik lädt man hoch, bietet an und kauft.
 */
export function Market() {
  const shopCategoryHook = useShopCategory()
  const loadedShopCategories = useLoadedData(shopCategoryHook.getAllShopCategory)
  const shopCategories = loadedShopCategories.data

  const tabs: SubheaderTab[] = []
  for (const shopCategory of shopCategories ?? []) {
    const shopCategoryLabel = getTextInCurrentLanguage(shopCategory.displayName)
    const marketCategoryTabPath = getMarketCategoryTabPath(shopCategory.key)
    tabs.push({ label: shopCategoryLabel, iconClassName: 'bi bi-tag', to: marketCategoryTabPath })
  }

  let errorMessage: string | null = null
  if (shopCategoryHook.error !== null) {
    errorMessage = shopCategoryHook.error.detail
  }
  const marketContext: MarketContext = { shopCategories, errorMessage }
  const subheaderStatus = (
    <>
      <i className="bi bi-shop me-2"></i>
      {getTextInCurrentLanguage(MARKET_TEXTS.moduleTitle)}
    </>
  )

  return (
    <>
      <Subheader status={subheaderStatus} tabs={tabs} />
      <div className="main-content">
        <Outlet context={marketContext} />
      </div>
    </>
  )
}
