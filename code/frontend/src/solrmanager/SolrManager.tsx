import { Outlet, useOutletContext } from 'react-router'
import { useLoadedData } from '../api/useLoadedData.ts'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { getSolrCoreFieldsTabPath } from './solrManagerPaths.ts'
import { useSolrCore } from './useSolrCore.ts'

/** Was der SolrManager seinen Seiten mitgibt: die Keys der Kerne. */
export type SolrManagerContext = {
  /** `null`, solange sie laden oder nach einem Fehler. */
  solrCoreKeys: string[] | null
  /** Fehler beim Laden der Kerne, `null` wenn keiner. */
  solrCoreKeysErrorMessage: string | null
}

/** Für die Seiten des SolrManagers: die Keys der Kerne. */
export function useSolrManagerContext(): SolrManagerContext {
  return useOutletContext<SolrManagerContext>()
}

/**
 * Das Modul SolrManager (nur ADMIN), nach dem SolrManager der Vorlage: die Felder der Kerne so definieren, wie wir sie
 * in Solr haben wollen. Die Kerne selbst stehen im Backend in der `application.yaml`, die Felder in Postgres; nach Solr
 * wird noch nichts geschrieben. Subheader mit einem Tab je Kern, darunter die gewählte Seite.
 */
export function SolrManager() {
  const solrCoreHook = useSolrCore()
  const loadedSolrCoreKeys = useLoadedData(solrCoreHook.getAllSolrCoreKey)
  const solrCoreKeys = loadedSolrCoreKeys.data

  const tabs: SubheaderTab[] = []
  for (const solrCoreKey of solrCoreKeys ?? []) {
    const solrCoreFieldsTabPath = getSolrCoreFieldsTabPath(solrCoreKey)
    tabs.push({ label: solrCoreKey, iconClassName: 'bi bi-database', to: solrCoreFieldsTabPath })
  }

  let solrCoreKeysErrorMessage: string | null = null
  if (solrCoreHook.error !== null) {
    solrCoreKeysErrorMessage = solrCoreHook.error.detail
  }
  const solrManagerContext: SolrManagerContext = { solrCoreKeys, solrCoreKeysErrorMessage }
  const subheaderStatus = (
    <>
      <i className="bi bi-database-gear me-2"></i>
      SolrManager
    </>
  )

  return (
    <>
      <Subheader status={subheaderStatus} tabs={tabs} />
      <div className="main-content">
        <Outlet context={solrManagerContext} />
      </div>
    </>
  )
}
