import Spinner from 'react-bootstrap/Spinner'
import { Navigate } from 'react-router'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useMarketContext } from './Market.tsx'
import { getMarketCategoryTabPath } from './marketPaths.ts'
import { MARKET_TEXTS } from './marketTexts.ts'

/** Der Einstieg unter `/market`: springt zum Tab der ersten Rubrik, sobald die Rubriken geladen sind. */
export function MarketStartTab() {
  const { shopCategories, errorMessage } = useMarketContext()

  if (errorMessage !== null) {
    return <ErrorAlert message={errorMessage} />
  }
  if (shopCategories === null) {
    return <Spinner animation="border" />
  }
  if (shopCategories.length === 0) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(MARKET_TEXTS.noShopCategories)}</p>
  }
  const firstMarketCategoryTabPath = getMarketCategoryTabPath(shopCategories[0].key)
  return <Navigate to={firstMarketCategoryTabPath} replace />
}
