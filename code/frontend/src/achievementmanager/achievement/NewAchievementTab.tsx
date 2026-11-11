import type { Achievement } from '../../achievement/Achievement.ts'
import { useAchievement } from '../../achievement/useAchievement.ts'
import { AchievementForm } from './AchievementForm.tsx'
import { ACHIEVEMENT_TAB_PATH } from './achievementPaths.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/** Leerer Startstand; den Platz vergibt das Backend (ans Ende). */
const EMPTY_ACHIEVEMENT: Achievement = {
  key: '',
  displayName: {},
  description: null,
  listingPosition: 0,
  badgeLook: null,
  trackingKey: null,
  thresholdValue: null,
  repeatable: false,
  rewardPoints: 0,
}

/** Seite „neues Achievement“ unter `/achievement-manager/achievement/new`, danach zurück zum Tab. */
export function NewAchievementTab() {
  const originNavigation = useOrigin()
  const achievementHook = useAchievement()
  const masterDataHook = useMasterData()

  async function handleSave(newAchievement: Achievement) {
    const createdAchievement = await achievementHook.createAchievement(newAchievement)
    if (createdAchievement === null) {
      return
    }
    // Die Stammdaten kennen dann auch das neue Achievement (Box im Profil)
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(ACHIEVEMENT_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(ACHIEVEMENT_TAB_PATH)
  }

  let errorMessage: string | null = null
  if (achievementHook.error !== null) {
    errorMessage = achievementHook.error.detail
  }

  return (
    <AchievementForm
      title="neues Achievement"
      initialAchievement={EMPTY_ACHIEVEMENT}
      isKeyEditable={true}
      isSaving={achievementHook.isLoading}
      errorMessage={errorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
