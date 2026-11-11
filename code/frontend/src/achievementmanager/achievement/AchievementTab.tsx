import { useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useNavigate } from 'react-router'
import type { Achievement } from '../../achievement/Achievement.ts'
import { AchievementBadge } from '../../achievement/AchievementBadge.tsx'
import { useAchievement } from '../../achievement/useAchievement.ts'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ConfirmDeletePopup } from '../../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { DeleteButton } from '../../components/DeleteButton.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { Table, type TableColumn } from '../../components/Table.tsx'
import { useListingOrder } from '../../components/useListingOrder.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getEditAchievementPath, NEW_ACHIEVEMENT_PATH } from './achievementPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { ACHIEVEMENT_TRACKING_KEY_LOOKS } from '../../achievement/achievementTrackingKeys.ts'

/** Breiten und ausgeblendete Spalten je User (UsersSetting `TABLE_ACHIEVEMENT`). */
const ACHIEVEMENT_TABLE_SETTING_KEY = 'ACHIEVEMENT'

function getAchievementKey(achievement: Achievement): string {
  return achievement.key
}

/** Die Bedingung in Worten, z. B. „Online am Stück ab 3600 Sekunden, wiederholbar, +10 Punkte“. */
function describeAchievementCondition(achievement: Achievement): string {
  if (achievement.trackingKey === null) {
    return 'nur von Hand'
  }
  const trackingKeyLook = ACHIEVEMENT_TRACKING_KEY_LOOKS[achievement.trackingKey]
  const thresholdValue = achievement.thresholdValue ?? 0
  const thresholdText = thresholdValue.toLocaleString('de-DE')
  let conditionText = trackingKeyLook.label + ' ab ' + thresholdText + ' ' + trackingKeyLook.unit
  if (achievement.repeatable) {
    conditionText += ', wiederholbar'
  }
  if (achievement.rewardPoints > 0) {
    conditionText += ', +' + achievement.rewardPoints.toLocaleString('de-DE') + ' Punkte'
  }
  return conditionText
}

/**
 * Tab „Achievements“ im Modul „Achievements & Markt“: alle Achievements als Medaillons mit Name, Wofür und Bedingung
 * (Tracking-Art, Schwelle, wiederholbar, Punkte). Am Griff links lassen sie sich verschieben.
 */
export function AchievementTab() {
  const masterDataHook = useMasterData()
  const navigate = useNavigate()
  const originNavigation = useOrigin()
  const achievementHook = useAchievement()
  const orderAchievementHook = useAchievement()
  const deleteAchievementHook = useAchievement()
  const loadedAchievements = useLoadedData(achievementHook.getAllAchievement)
  const reloadAchievements = loadedAchievements.reload
  const changeAchievementListingPositions = orderAchievementHook.changeAchievementListingPositions
  const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null)

  async function saveAchievementOrder(achievementKeysInOrder: string[]): Promise<boolean> {
    const reorderedAchievements = await changeAchievementListingPositions(achievementKeysInOrder)
    await reloadAchievements()
    await masterDataHook.reload()
    return reorderedAchievements !== null
  }

  const listingOrder = useListingOrder(
    loadedAchievements.data,
    getAchievementKey,
    saveAchievementOrder,
    'Achievements',
  )
  const achievements = listingOrder.shownItems

  function handleNewAchievement() {
    const originState = originNavigation.createOriginStateHere('Achievements')
    navigate(NEW_ACHIEVEMENT_PATH, { state: originState })
  }

  function handleEdit(achievement: Achievement) {
    const editAchievementPath = getEditAchievementPath(achievement.key)
    const originState = originNavigation.createOriginStateHere('Achievements')
    navigate(editAchievementPath, { state: originState })
  }

  async function handleConfirmDelete() {
    if (achievementToDelete === null) {
      return
    }
    const deleted = await deleteAchievementHook.deleteAchievement(achievementToDelete.key)
    if (!deleted) {
      return
    }
    setAchievementToDelete(null)
    await reloadAchievements()
    await masterDataHook.reload()
  }

  let footer
  if (achievementHook.error !== null) {
    footer = <span className="text-danger">{achievementHook.error.detail}</span>
  } else if (orderAchievementHook.error !== null) {
    footer = <span className="text-danger">{orderAchievementHook.error.detail}</span>
  } else if (achievements === null) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    const achievementsCountText = achievements.length + ' Achievements, am Griff links verschieben'
    footer = <span>{achievementsCountText}</span>
  }
  const newAchievementButton = <NewEntityButton label="neues Achievement" onClick={handleNewAchievement} />

  let deleteErrorMessage: string | null = null
  if (deleteAchievementHook.error !== null) {
    deleteErrorMessage = deleteAchievementHook.error.detail
  }
  let achievementToDeleteName = ''
  if (achievementToDelete !== null) {
    achievementToDeleteName = getTextInCurrentLanguage(achievementToDelete.displayName)
  }

  const columns: TableColumn<Achievement>[] = [
    {
      header: 'Medaillon',
      key: 'MEDAL',
      width: '6rem',
      cell: (achievement) => <AchievementBadge achievement={achievement} />,
    },
    {
      header: 'Name',
      key: 'NAME',
      cell: (achievement) => <span className="fw-semibold">{getTextInCurrentLanguage(achievement.displayName)}</span>,
    },
    {
      header: 'Wofür',
      key: 'DESCRIPTION',
      unimportant: true,
      cell: (achievement) => getTextInCurrentLanguage(achievement.description ?? {}),
    },
    {
      header: 'Bedingung',
      key: 'CONDITION',
      headerHint: 'Woran es hängt, ab welcher Schwelle, ob wiederholbar und wie viele Punkte je Abschluss.',
      cell: (achievement) => describeAchievementCondition(achievement),
    },
    {
      header: 'Key',
      key: 'KEY',
      unimportant: true,
      cell: (achievement) => <code>{achievement.key}</code>,
    },
  ]

  function renderActions(achievement: Achievement) {
    const displayNameText = getTextInCurrentLanguage(achievement.displayName)
    return (
      <>
        <EditButton label={displayNameText + ' bearbeiten'} onClick={() => handleEdit(achievement)} />{' '}
        <DeleteButton label={displayNameText + ' löschen'} onClick={() => setAchievementToDelete(achievement)} />
      </>
    )
  }

  return (
    <ContentBox title="Achievements" actions={newAchievementButton} footer={footer}>
      {achievements !== null && (
        <Table
          columns={columns}
          rows={achievements}
          rowKey={getAchievementKey}
          detailTitle={(achievement) => getTextInCurrentLanguage(achievement.displayName)}
          emptyText="Es gibt noch keine Achievements."
          actions={renderActions}
          onReorder={listingOrder.reorder}
          reorderDisabled={listingOrder.isSaving}
          settingKey={ACHIEVEMENT_TABLE_SETTING_KEY}
        />
      )}
      {achievementToDelete !== null && (
        <ConfirmDeletePopup
          title="Achievement löschen"
          isDeleting={deleteAchievementHook.isLoading}
          errorMessage={deleteErrorMessage}
          onConfirm={handleConfirmDelete}
          onClose={() => setAchievementToDelete(null)}>
          Soll das Achievement „{achievementToDeleteName}“ wirklich gelöscht werden?
        </ConfirmDeletePopup>
      )}
    </ContentBox>
  )
}
