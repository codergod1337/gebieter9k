import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import type { Rank } from '../../rank/Rank.ts'
import { useRank } from '../../rank/useRank.ts'
import { RankForm } from './RankForm.tsx'
import { RANK_TAB_PATH } from './rankPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/**
 * Seite „Rang bearbeiten“ unter `/admin/rank/edit/<key>`: lädt den Rang, dann das Formular. Laden und Speichern haben
 * je eine eigene Hook-Instanz, damit ein Fehler beim Speichern im Formular steht und es nicht ersetzt.
 */
export function EditRankTab() {
  const originNavigation = useOrigin()
  const { rankKey } = useParams()
  const requestedRankKey = rankKey ?? ''
  const loadRankHook = useRank()
  const changeRankHook = useRank()

  const getRank = loadRankHook.getRank
  const loadRank = useCallback(() => getRank(requestedRankKey), [getRank, requestedRankKey])
  const loadedRank = useLoadedData(loadRank)

  async function handleSave(changedRank: Rank) {
    const savedRank = await changeRankHook.changeRank(changedRank)
    if (savedRank === null) {
      return
    }
    originNavigation.goBackToOrigin(RANK_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(RANK_TAB_PATH)
  }

  if (loadRankHook.error !== null) {
    return <ErrorAlert message={loadRankHook.error.detail} />
  }
  const rank = loadedRank.data
  if (rank === null) {
    return <Spinner animation="border" />
  }

  let saveErrorMessage: string | null = null
  if (changeRankHook.error !== null) {
    saveErrorMessage = changeRankHook.error.detail
  }
  const contentBoxTitle = 'Rang bearbeiten: ' + rank.key
  return (
    <RankForm
      key={rank.key}
      title={contentBoxTitle}
      initialRank={rank}
      isKeyEditable={false}
      isSaving={changeRankHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
