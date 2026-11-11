import Spinner from 'react-bootstrap/Spinner'
import { Navigate } from 'react-router'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { useSolrManagerContext } from './SolrManager.tsx'
import { getSolrCoreFieldsTabPath } from './solrManagerPaths.ts'

/** Der Einstieg unter `/solrmanager`: springt zum Tab des ersten Kerns, sobald die Kerne geladen sind. */
export function SolrManagerStartTab() {
  const { solrCoreKeys, solrCoreKeysErrorMessage } = useSolrManagerContext()

  if (solrCoreKeysErrorMessage !== null) {
    return <ErrorAlert message={solrCoreKeysErrorMessage} />
  }
  if (solrCoreKeys === null) {
    return <Spinner animation="border" />
  }
  if (solrCoreKeys.length === 0) {
    return <p className="text-body-secondary">Es gibt keine Kerne. Sie stehen im Backend unter gebiter.solr.core-keys.</p>
  }
  const firstSolrCoreFieldsTabPath = getSolrCoreFieldsTabPath(solrCoreKeys[0])
  return <Navigate to={firstSolrCoreFieldsTabPath} replace />
}
