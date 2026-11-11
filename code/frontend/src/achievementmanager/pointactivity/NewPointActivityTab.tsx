import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import type { PointActivity } from '../../point/PointActivity.ts'
import { usePointActivity } from '../../point/usePointActivity.ts'
import { PointActivityForm } from './PointActivityForm.tsx'
import { POINT_ACTIVITY_TAB_PATH } from './pointActivityPaths.ts'

/** Leerer Startstand; den Platz vergibt das Backend (ans Ende). */
const EMPTY_POINT_ACTIVITY: PointActivity = {
  key: '',
  displayName: {},
  description: null,
  rewardPoints: 0,
  listingPosition: 0,
}

/** Seite „neue Tätigkeit“ unter `/achievement-manager/point-activity/new`, danach zurück zum Tab. */
export function NewPointActivityTab() {
  const originNavigation = useOrigin()
  const pointActivityHook = usePointActivity()
  const masterDataHook = useMasterData()

  async function handleSave(newPointActivity: PointActivity) {
    const createdPointActivity = await pointActivityHook.createPointActivity(newPointActivity)
    if (createdPointActivity === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(POINT_ACTIVITY_TAB_PATH)
  }

  let errorMessage: string | null = null
  if (pointActivityHook.error !== null) {
    errorMessage = pointActivityHook.error.detail
  }

  return (
    <PointActivityForm
      title="neue Tätigkeit"
      initialPointActivity={EMPTY_POINT_ACTIVITY}
      isKeyEditable={true}
      isSaving={pointActivityHook.isLoading}
      errorMessage={errorMessage}
      onSave={handleSave}
      onCancel={() => originNavigation.goBackToOrigin(POINT_ACTIVITY_TAB_PATH)}
    />
  )
}
