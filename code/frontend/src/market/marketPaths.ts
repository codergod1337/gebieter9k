/** Der Einstieg des Gebietermarkts, er springt zur ersten Rubrik. */
export const MARKET_PATH = '/market'

/** Der Tab einer Rubrik des Gebietermarkts. */
export function getMarketCategoryTabPath(shopCategoryKey: string): string {
  return '/market/category/' + shopCategoryKey
}
