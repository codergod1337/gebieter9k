import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import type { Achievement } from '../../achievement/Achievement.ts'
import { useAchievement } from '../../achievement/useAchievement.ts'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { AchievementForm } from './AchievementForm.tsx'
import { ACHIEVEMENT_TAB_PATH } from './achievementPaths.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/**
 * Seite „Achievement bearbeiten“ unter `/achievement-manager/achievement/edit/<key>`: lädt das Achievement, dann das Formular. Laden
 * und Speichern haben je eine eigene Hook-Instanz, damit ein Fehler beim Speichern im Formular steht.
 */
export function EditAchievementTab() {
  const masterDataHook = useMasterData()
  const originNavigation = useOrigin()
  const { achievementKey } = useParams()
  const requestedAchievementKey = achievementKey ?? ''
  const loadAchievementHook = useAchievement()
  const changeAchievementHook = useAchievement()

  const getAchievement = loadAchievementHook.getAchievement
  const loadAchievement = useCallback(
    () => getAchievement(requestedAchievementKey),
    [getAchievement, requestedAchievementKey],
  )
  const loadedAchievement = useLoadedData(loadAchievement)

  async function handleSave(changedAchievement: Achievement) {
    const savedAchievement = await changeAchievementHook.changeAchievement(changedAchievement)
    if (savedAchievement === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(ACHIEVEMENT_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(ACHIEVEMENT_TAB_PATH)
  }

  if (loadAchievementHook.error !== null) {
    return <ErrorAlert message={loadAchievementHook.error.detail} />
  }
  const achievement = loadedAchievement.data
  if (achievement === null) {
    return <Spinner animation="border" />
  }

  let saveErrorMessage: string | null = null
  if (changeAchievementHook.error !== null) {
    saveErrorMessage = changeAchievementHook.error.detail
  }
  const contentBoxTitle = 'Achievement bearbeiten: ' + achievement.key
  return (
    <AchievementForm
      key={achievement.key}
      title={contentBoxTitle}
      initialAchievement={achievement}
      isKeyEditable={false}
      isSaving={changeAchievementHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
