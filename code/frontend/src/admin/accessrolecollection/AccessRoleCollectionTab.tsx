import Table from 'react-bootstrap/Table'
import { useNavigate } from 'react-router'
import type { AccessRoleCollection } from '../../auth/access/AccessRoleCollection.ts'
import { AccessRoleCollectionBadge } from '../../auth/access/AccessRoleCollectionBadge.tsx'
import { useAccessRoleCollection } from '../../auth/access/useAccessRoleCollection.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { SortableArea } from '../../components/SortableArea.tsx'
import { SortableTableRow } from '../../components/SortableTableRow.tsx'
import { useListingOrder } from '../../components/useListingOrder.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { getEditAccessRoleCollectionPath } from './accessRoleCollectionPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { LoadStatus } from '../../components/LoadStatus.tsx'
import { getFirstErrorDetail } from '../../api/getFirstErrorDetail.ts'

function getAccessRoleCollectionKey(accessRoleCollection: AccessRoleCollection): string {
  return accessRoleCollection.key
}

/**
 * Tab „ARC“ der Administration, wie in der Vorlage zwischen AR und User-ARC: alle Positionen mit ihrer Pille, je Zeile
 * Bearbeiten (Anzeigename und Aussehen). Am Griff links lassen sie sich verschieben, genau wie in der Matrix „ARC-AR“.
 * Welche Rechte eine Position verleiht, steht in der Matrix. Anlegen übernimmt vorerst nur der Start-Runner.
 */
export function AccessRoleCollectionTab() {
  const navigate = useNavigate()
  const originNavigation = useOrigin()
  const masterDataHook = useMasterData()
  const orderAccessRoleCollectionHook = useAccessRoleCollection()
  const changeAccessRoleCollectionListingPositions =
    orderAccessRoleCollectionHook.changeAccessRoleCollectionListingPositions

  async function saveAccessRoleCollectionOrder(accessRoleCollectionKeysInOrder: string[]): Promise<boolean> {
    const reorderedAccessRoleCollections = await changeAccessRoleCollectionListingPositions(
      accessRoleCollectionKeysInOrder,
    )
    await masterDataHook.reload()
    return reorderedAccessRoleCollections !== null
  }

  const listingOrder = useListingOrder(
    masterDataHook.accessRoleCollections,
    getAccessRoleCollectionKey,
    saveAccessRoleCollectionOrder,
    'Positionen',
  )
  const accessRoleCollections = listingOrder.shownItems

  function handleEdit(accessRoleCollection: AccessRoleCollection) {
    const editAccessRoleCollectionPath = getEditAccessRoleCollectionPath(accessRoleCollection.key)
    const originState = originNavigation.createOriginStateHere('ARC')
    navigate(editAccessRoleCollectionPath, { state: originState })
  }

  const footerErrorMessage = getFirstErrorDetail([masterDataHook.error, orderAccessRoleCollectionHook.error])
  let accessRoleCollectionsCountText = ''
  if (accessRoleCollections !== null) {
    accessRoleCollectionsCountText = accessRoleCollections.length + ' Positionen, am Griff links verschieben'
  }
  const footer = (
    <LoadStatus errorMessage={footerErrorMessage} isLoading={accessRoleCollections === null}>
      {accessRoleCollectionsCountText}
    </LoadStatus>
  )

  return (
    <ContentBox title="Positionen (ARC)" footer={footer}>
      {accessRoleCollections !== null && (
        <Table striped hover responsive className="mb-0">
          <thead>
            <tr>
              <th className="drag-cell"></th>
              <th>Badge</th>
              <th>Key</th>
              <th>Anzeigename</th>
              <th></th>
            </tr>
          </thead>
          <SortableArea
            items={accessRoleCollections}
            itemKey={getAccessRoleCollectionKey}
            onReorder={listingOrder.reorder}>
            <tbody>
              {accessRoleCollections.map((accessRoleCollection) => {
                const displayNameText = getTextInCurrentLanguage(accessRoleCollection.displayName)
                const editLabel = accessRoleCollection.key + ' bearbeiten'
                return (
                  <SortableTableRow
                    key={accessRoleCollection.key}
                    itemKey={accessRoleCollection.key}
                    disabled={listingOrder.isSaving}>
                    <td>
                      <AccessRoleCollectionBadge accessRoleCollection={accessRoleCollection} />
                    </td>
                    <td>
                      <code>{accessRoleCollection.key}</code>
                    </td>
                    <td>{displayNameText}</td>
                    <td className="text-end text-nowrap">
                      <EditButton label={editLabel} onClick={() => handleEdit(accessRoleCollection)} />
                    </td>
                  </SortableTableRow>
                )
              })}
            </tbody>
          </SortableArea>
        </Table>
      )}
    </ContentBox>
  )
}
