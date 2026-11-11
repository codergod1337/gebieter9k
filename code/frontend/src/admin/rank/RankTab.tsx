import { useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import { useNavigate } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ConfirmDeletePopup } from '../../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { DeleteButton } from '../../components/DeleteButton.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { SortableArea } from '../../components/SortableArea.tsx'
import { SortableTableRow } from '../../components/SortableTableRow.tsx'
import { useListingOrder } from '../../components/useListingOrder.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { Rank } from '../../rank/Rank.ts'
import { RankBadge } from '../../rank/RankBadge.tsx'
import { useRank } from '../../rank/useRank.ts'
import { getEditRankPath, NEW_RANK_PATH } from './rankPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

function getRankKey(rank: Rank): string {
  return rank.key
}

/** z. B. 12.500 */
function formatPoints(points: number): string {
  return points.toLocaleString('de-DE')
}

/**
 * Tab „Ränge“ der Administration: die Rangleiter von Stufe 1 bis oben, in einer ContentBox. Am Griff links lassen sich
 * die Ränge verschieben, die Stufe folgt der Reihenfolge. Je Rang die Mindestpunkte: Ein User hat später den höchsten
 * Rang, dessen Mindestpunkte er erreicht. Sinken die Punkte gegenüber der Stufe darunter, steht das rot da.
 */
export function RankTab() {
  const navigate = useNavigate()
  const originNavigation = useOrigin()
  const rankHook = useRank()
  const orderRankHook = useRank()
  const deleteRankHook = useRank()
  const loadedRanks = useLoadedData(rankHook.getAllRank)
  const reloadRanks = loadedRanks.reload
  const changeRankLevels = orderRankHook.changeRankLevels
  const [rankToDelete, setRankToDelete] = useState<Rank | null>(null)

  async function saveRankOrder(rankKeysInOrder: string[]): Promise<boolean> {
    const reorderedRanks = await changeRankLevels(rankKeysInOrder)
    await reloadRanks()
    return reorderedRanks !== null
  }

  const listingOrder = useListingOrder(loadedRanks.data, getRankKey, saveRankOrder, 'Ränge')
  const ranks = listingOrder.shownItems

  function handleNewRank() {
    const originState = originNavigation.createOriginStateHere('Ränge')
    navigate(NEW_RANK_PATH, { state: originState })
  }

  function handleEdit(rank: Rank) {
    const editRankPath = getEditRankPath(rank.key)
    const originState = originNavigation.createOriginStateHere('Ränge')
    navigate(editRankPath, { state: originState })
  }

  async function handleConfirmDelete() {
    if (rankToDelete === null) {
      return
    }
    const deleted = await deleteRankHook.deleteRank(rankToDelete.key)
    if (!deleted) {
      return
    }
    setRankToDelete(null)
    await reloadRanks()
  }

  let footer
  if (rankHook.error !== null) {
    footer = <span className="text-danger">{rankHook.error.detail}</span>
  } else if (orderRankHook.error !== null) {
    footer = <span className="text-danger">{orderRankHook.error.detail}</span>
  } else if (ranks === null) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    const ranksCountText = ranks.length + ' Ränge, am Griff links verschieben'
    footer = <span>{ranksCountText}</span>
  }
  const newRankButton = <NewEntityButton label="neuer Rang" onClick={handleNewRank} />

  let deleteErrorMessage: string | null = null
  if (deleteRankHook.error !== null) {
    deleteErrorMessage = deleteRankHook.error.detail
  }

  return (
    <ContentBox title="Ränge" actions={newRankButton} footer={footer}>
      {ranks !== null && (
        <Table striped hover responsive className="mb-0">
          <thead>
            <tr>
              <th className="drag-cell"></th>
              <th>Stufe</th>
              <th>Rang</th>
              <th className="text-end">Mindestpunkte</th>
              <th>Key</th>
              <th></th>
            </tr>
          </thead>
          <SortableArea items={ranks} itemKey={getRankKey} onReorder={listingOrder.reorder}>
            <tbody>
              {ranks.map((rank, rankIndex) => {
                // Die Stufe folgt der Reihenfolge, so stimmt sie auch, während die neue gespeichert wird.
                const shownLevel = rankIndex + 1
                const shownRank: Rank = { ...rank, level: shownLevel }
                let fewerPointsThanBelow = false
                if (rankIndex > 0) {
                  const rankBelow = ranks[rankIndex - 1]
                  fewerPointsThanBelow = rank.minimumPoints < rankBelow.minimumPoints
                }
                let pointsClassName = 'text-end text-nowrap'
                if (fewerPointsThanBelow) {
                  pointsClassName = 'text-end text-nowrap text-danger fw-semibold'
                }
                const pointsText = formatPoints(rank.minimumPoints)
                const displayNameText = getTextInCurrentLanguage(rank.displayName)
                const editLabel = displayNameText + ' bearbeiten'
                const deleteLabel = displayNameText + ' löschen'
                return (
                  <SortableTableRow key={rank.key} itemKey={rank.key} disabled={listingOrder.isSaving}>
                    <td>{shownLevel}</td>
                    <td>
                      <RankBadge rank={shownRank} />
                    </td>
                    <td className={pointsClassName}>
                      {fewerPointsThanBelow && (
                        <i
                          className="bi bi-exclamation-triangle me-1"
                          title="weniger Punkte als die Stufe darunter"
                          aria-label="weniger Punkte als die Stufe darunter"></i>
                      )}
                      {pointsText}
                    </td>
                    <td>
                      <code>{rank.key}</code>
                    </td>
                    <td className="text-end text-nowrap">
                      <EditButton label={editLabel} onClick={() => handleEdit(rank)} />{' '}
                      <DeleteButton label={deleteLabel} onClick={() => setRankToDelete(rank)} />
                    </td>
                  </SortableTableRow>
                )
              })}
            </tbody>
          </SortableArea>
        </Table>
      )}
      {rankToDelete !== null && (
        <ConfirmDeletePopup
          title="Rang löschen"
          isDeleting={deleteRankHook.isLoading}
          errorMessage={deleteErrorMessage}
          onConfirm={handleConfirmDelete}
          onClose={() => setRankToDelete(null)}>
          Soll der Rang <RankBadge rank={rankToDelete} /> wirklich gelöscht werden? Die Ränge darüber rücken eine Stufe
          nach unten.
        </ConfirmDeletePopup>
      )}
    </ContentBox>
  )
}
