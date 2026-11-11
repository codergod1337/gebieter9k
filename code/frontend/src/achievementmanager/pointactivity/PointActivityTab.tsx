import { useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useNavigate } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ConfirmDeletePopup } from '../../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { DeleteButton } from '../../components/DeleteButton.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { Table, type TableColumn } from '../../components/Table.tsx'
import { useListingOrder } from '../../components/useListingOrder.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import type { PointActivity } from '../../point/PointActivity.ts'
import { usePointActivity } from '../../point/usePointActivity.ts'
import { getEditPointActivityPath, NEW_POINT_ACTIVITY_PATH } from './pointActivityPaths.ts'

/** Breiten und ausgeblendete Spalten je User (UsersSetting `TABLE_POINT_ACTIVITY`). */
const POINT_ACTIVITY_TABLE_SETTING_KEY = 'POINT_ACTIVITY'

function getPointActivityKey(pointActivity: PointActivity): string {
  return pointActivity.key
}

/**
 * Tab „Tätigkeiten“ im Modul „Achievements & Markt“ (Nutzer 2026-11-09): wofür es Punkte gibt und wie viele, z. B. 2 für
 * einen Gästebucheintrag. Die Tätigkeiten, die der Code auslöst, legt der Start-Runner an; hier pflegt der Admin Namen
 * und Punkte. Neue Punkte gelten nie rückwirkend. Am Griff links lassen sie sich verschieben.
 */
export function PointActivityTab() {
  const masterDataHook = useMasterData()
  const navigate = useNavigate()
  const originNavigation = useOrigin()
  const pointActivityHook = usePointActivity()
  const orderPointActivityHook = usePointActivity()
  const deletePointActivityHook = usePointActivity()
  const loadedPointActivities = useLoadedData(pointActivityHook.getAllPointActivity)
  const reloadPointActivities = loadedPointActivities.reload
  const changePointActivityListingPositions = orderPointActivityHook.changePointActivityListingPositions
  const [pointActivityToDelete, setPointActivityToDelete] = useState<PointActivity | null>(null)

  async function savePointActivityOrder(pointActivityKeysInOrder: string[]): Promise<boolean> {
    const reorderedPointActivities = await changePointActivityListingPositions(pointActivityKeysInOrder)
    await reloadPointActivities()
    await masterDataHook.reload()
    return reorderedPointActivities !== null
  }

  const listingOrder = useListingOrder(loadedPointActivities.data, getPointActivityKey, savePointActivityOrder, 'Tätigkeiten')
  const pointActivities = listingOrder.shownItems

  function handleNewPointActivity() {
    const originState = originNavigation.createOriginStateHere('Tätigkeiten')
    navigate(NEW_POINT_ACTIVITY_PATH, { state: originState })
  }

  function handleEdit(pointActivity: PointActivity) {
    const editPointActivityPath = getEditPointActivityPath(pointActivity.key)
    const originState = originNavigation.createOriginStateHere('Tätigkeiten')
    navigate(editPointActivityPath, { state: originState })
  }

  async function handleConfirmDelete() {
    if (pointActivityToDelete === null) {
      return
    }
    const deleted = await deletePointActivityHook.deletePointActivity(pointActivityToDelete.key)
    if (!deleted) {
      return
    }
    setPointActivityToDelete(null)
    await reloadPointActivities()
    await masterDataHook.reload()
  }

  const columns: TableColumn<PointActivity>[] = [
    {
      header: 'Tätigkeit',
      key: 'NAME',
      cell: (pointActivity) => <span className="fw-semibold">{getTextInCurrentLanguage(pointActivity.displayName)}</span>,
    },
    {
      header: 'Wann',
      key: 'DESCRIPTION',
      unimportant: true,
      cell: (pointActivity) => getTextInCurrentLanguage(pointActivity.description ?? {}),
    },
    {
      header: 'Punkte',
      key: 'REWARD_POINTS',
      width: '6rem',
      headerHint: 'So viele Punkte bringt die Tätigkeit ab jetzt; nie rückwirkend.',
      cellClassName: 'text-end',
      cell: (pointActivity) => '+' + pointActivity.rewardPoints.toLocaleString('de-DE'),
    },
    {
      header: 'Key',
      key: 'KEY',
      unimportant: true,
      cell: (pointActivity) => <code>{pointActivity.key}</code>,
    },
  ]

  function renderActions(pointActivity: PointActivity) {
    const displayNameText = getTextInCurrentLanguage(pointActivity.displayName)
    return (
      <>
        <EditButton label={displayNameText + ' bearbeiten'} onClick={() => handleEdit(pointActivity)} />{' '}
        <DeleteButton label={displayNameText + ' löschen'} onClick={() => setPointActivityToDelete(pointActivity)} />
      </>
    )
  }

  let footer
  if (pointActivityHook.error !== null) {
    footer = <span className="text-danger">{pointActivityHook.error.detail}</span>
  } else if (orderPointActivityHook.error !== null) {
    footer = <span className="text-danger">{orderPointActivityHook.error.detail}</span>
  } else if (pointActivities === null) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    footer = <span>{pointActivities.length + ' Tätigkeiten, am Griff links verschieben'}</span>
  }
  let deleteErrorMessage: string | null = null
  if (deletePointActivityHook.error !== null) {
    deleteErrorMessage = deletePointActivityHook.error.detail
  }
  let pointActivityToDeleteName = ''
  if (pointActivityToDelete !== null) {
    pointActivityToDeleteName = getTextInCurrentLanguage(pointActivityToDelete.displayName)
  }

  return (
    <ContentBox
      title="Tätigkeiten mit Punkten"
      actions={<NewEntityButton label="neue Tätigkeit" onClick={handleNewPointActivity} />}
      footer={footer}>
      {pointActivities !== null && (
        <Table
          columns={columns}
          rows={pointActivities}
          rowKey={getPointActivityKey}
          detailTitle={(pointActivity) => getTextInCurrentLanguage(pointActivity.displayName)}
          emptyText="Es gibt noch keine Tätigkeiten."
          actions={renderActions}
          onReorder={listingOrder.reorder}
          reorderDisabled={listingOrder.isSaving}
          settingKey={POINT_ACTIVITY_TABLE_SETTING_KEY}
        />
      )}
      {pointActivityToDelete !== null && (
        <ConfirmDeletePopup
          title="Tätigkeit löschen"
          isDeleting={deletePointActivityHook.isLoading}
          errorMessage={deleteErrorMessage}
          onConfirm={handleConfirmDelete}
          onClose={() => setPointActivityToDelete(null)}>
          Soll die Tätigkeit „{pointActivityToDeleteName}“ wirklich gelöscht werden? Schon gebuchte Punkte bleiben. Löst
          der Code sie aus, legt der Start des Backends sie wieder an.
        </ConfirmDeletePopup>
      )}
    </ContentBox>
  )
}
