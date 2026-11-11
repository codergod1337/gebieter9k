/** Der Einstieg des SolrManagers, er springt zum ersten Kern. */
export const SOLR_MANAGER_PATH = '/solrmanager'

/** Der Tab eines Kerns mit seinen Feldern. */
export function getSolrCoreFieldsTabPath(solrCoreKey: string): string {
  return '/solrmanager/core/' + solrCoreKey
}
