import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import type { PointActivity } from '../../point/PointActivity.ts'
import { usePointActivity } from '../../point/usePointActivity.ts'
import { PointActivityForm } from './PointActivityForm.tsx'
import { POINT_ACTIVITY_TAB_PATH } from './pointActivityPaths.ts'

/**
 * Seite „Tätigkeit bearbeiten“ unter `/achievement-manager/point-activity/edit/<key>`: lädt die Tätigkeit, dann das
 * Formular. Laden und Speichern haben je eine eigene Hook-Instanz, damit ein Fehler beim Speichern im Formular steht.
 */
export function EditPointActivityTab() {
  const masterDataHook = useMasterData()
  const originNavigation = useOrigin()
  const { pointActivityKey } = useParams()
  const requestedPointActivityKey = pointActivityKey ?? ''
  const loadPointActivityHook = usePointActivity()
  const changePointActivityHook = usePointActivity()
  const getPointActivity = loadPointActivityHook.getPointActivity
  const loadPointActivity = useCallback(
    () => getPointActivity(requestedPointActivityKey),
    [getPointActivity, requestedPointActivityKey],
  )
  const loadedPointActivity = useLoadedData(loadPointActivity)

  async function handleSave(changedPointActivity: PointActivity) {
    const savedPointActivity = await changePointActivityHook.changePointActivity(changedPointActivity)
    if (savedPointActivity === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(POINT_ACTIVITY_TAB_PATH)
  }

  if (loadPointActivityHook.error !== null) {
    return <ErrorAlert message={loadPointActivityHook.error.detail} />
  }
  const pointActivity = loadedPointActivity.data
  if (pointActivity === null) {
    return <Spinner animation="border" />
  }
  let saveErrorMessage: string | null = null
  if (changePointActivityHook.error !== null) {
    saveErrorMessage = changePointActivityHook.error.detail
  }
  return (
    <PointActivityForm
      key={pointActivity.key}
      title={'Tätigkeit bearbeiten: ' + pointActivity.key}
      initialPointActivity={pointActivity}
      isKeyEditable={false}
      isSaving={changePointActivityHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={handleSave}
      onCancel={() => originNavigation.goBackToOrigin(POINT_ACTIVITY_TAB_PATH)}
    />
  )
}
