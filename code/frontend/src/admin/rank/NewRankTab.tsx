import type { Rank } from '../../rank/Rank.ts'
import { useRank } from '../../rank/useRank.ts'
import { RankForm } from './RankForm.tsx'
import { RANK_TAB_PATH } from './rankPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/** Leerer Startstand; die Stufe vergibt das Backend (oben drauf). */
const EMPTY_RANK: Rank = { key: '', displayName: {}, level: 0, minimumPoints: 0, badgeLook: null }

/** Seite „neuer Rang“ unter `/admin/rank/new`. Der neue Rang kommt oben auf die Leiter, danach zurück zum Tab. */
export function NewRankTab() {
  const originNavigation = useOrigin()
  const rankHook = useRank()

  async function handleSave(newRank: Rank) {
    const createdRank = await rankHook.createRank(newRank)
    if (createdRank === null) {
      return
    }
    originNavigation.goBackToOrigin(RANK_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(RANK_TAB_PATH)
  }

  let errorMessage: string | null = null
  if (rankHook.error !== null) {
    errorMessage = rankHook.error.detail
  }

  return (
    <RankForm
      title="neuer Rang"
      initialRank={EMPTY_RANK}
      isKeyEditable={true}
      isSaving={rankHook.isLoading}
      errorMessage={errorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
