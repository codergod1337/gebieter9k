import { useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import type { AccessRole } from '../../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../../auth/access/AccessRoleBadge.tsx'
import { useAccessRole } from '../../auth/access/useAccessRole.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { EditableCellButton } from '../../components/EditableCellButton.tsx'
import { EditDisplayNamePopup } from '../../components/EditDisplayNamePopup.tsx'
import type { KeyAndDisplayName } from '../../components/KeyDisplayNameForm.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { NewKeyDisplayNamePopup } from '../../components/NewKeyDisplayNamePopup.tsx'
import { Table, type TableColumn } from '../../components/Table.tsx'
import { useListingOrder } from '../../components/useListingOrder.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'

/** Die Kennung der Tabelle für die Spalteneinstellungen des Users (`TABLE_ACCESS_ROLE`). */
const ACCESS_ROLE_TABLE_SETTING_KEY = 'ACCESS_ROLE'

function getAccessRoleKey(accessRole: AccessRole): string {
  return accessRole.key
}

/**
 * Tab „AR“ der Administration, wie in der Vorlage: alle Rechte in der zentralen Tabelle, oben rechts „neues Recht“.
 * Alles direkt in der Zeile: Klick auf den Anzeigenamen öffnet ein kleines Popup, die Reihenfolge ändert sich am Griff
 * links und gilt überall (Stammdaten), angelegt wird im Popup. Eine eigene Bearbeiten-Seite gibt es nicht. Die Liste
 * kommt aus den Stammdaten, jede Änderung lädt sie neu.
 */
export function AccessRoleTab() {
  const masterDataHook = useMasterData()
  const orderAccessRoleHook = useAccessRole()
  const createAccessRoleHook = useAccessRole()
  const changeAccessRoleHook = useAccessRole()
  const [newAccessRoleOpen, setNewAccessRoleOpen] = useState<boolean>(false)
  /** Das Recht, dessen Anzeigename gerade im Popup geändert wird, `null` wenn keins. */
  const [accessRoleToRename, setAccessRoleToRename] = useState<AccessRole | null>(null)
  const changeAccessRoleListingPositions = orderAccessRoleHook.changeAccessRoleListingPositions

  async function saveAccessRoleOrder(accessRoleKeysInOrder: string[]): Promise<boolean> {
    const reorderedAccessRoles = await changeAccessRoleListingPositions(accessRoleKeysInOrder)
    await masterDataHook.reload()
    return reorderedAccessRoles !== null
  }

  const listingOrder = useListingOrder(masterDataHook.accessRoles, getAccessRoleKey, saveAccessRoleOrder, 'Rechte')
  const accessRoles = listingOrder.shownItems

  async function handleCreateAccessRole(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const newAccessRole: AccessRole = { ...enteredKeyAndDisplayName, listingPosition: 0 }
    const createdAccessRole = await createAccessRoleHook.createAccessRole(newAccessRole)
    if (createdAccessRole === null) {
      return
    }
    setNewAccessRoleOpen(false)
    await masterDataHook.reload()
  }

  async function handleSaveDisplayName(changedDisplayName: MultilingualText) {
    if (accessRoleToRename === null) {
      return
    }
    const changedAccessRole: AccessRole = { ...accessRoleToRename, displayName: changedDisplayName }
    const savedAccessRole = await changeAccessRoleHook.changeAccessRole(changedAccessRole)
    if (savedAccessRole === null) {
      return
    }
    setAccessRoleToRename(null)
    await masterDataHook.reload()
  }

  function renderDisplayNameCell(accessRole: AccessRole) {
    const displayNameText = getTextInCurrentLanguage(accessRole.displayName)
    const displayNameLabel = 'Anzeigename von ' + accessRole.key + ' ändern'
    return (
      <EditableCellButton label={displayNameLabel} onClick={() => setAccessRoleToRename(accessRole)}>
        {displayNameText}
      </EditableCellButton>
    )
  }

  const columns: TableColumn<AccessRole>[] = [
    {
      header: 'Badge',
      key: 'badge',
      headerHint: 'So erscheint das Recht überall: eckig, in jedem Theme gleich. Am Griff links verschiebst du die Zeile; die Reihenfolge gilt in jeder Liste der Rechte.',
      width: '12rem',
      cell: (accessRole) => <AccessRoleBadge accessRole={accessRole} />,
    },
    {
      header: 'Key',
      key: 'key',
      headerHint: 'Der feste Name des Rechts (Key-Regel), z. B. ADMIN. Damit verweisen Code, Token und Stammdaten auf das Recht; er ändert sich nie.',
      width: '12rem',
      cell: (accessRole) => <code>{accessRole.key}</code>,
    },
    {
      header: 'Anzeigename',
      key: 'displayName',
      headerHint: 'Wie das Recht für Menschen heißt, mehrsprachig. Klick auf den Namen ändert ihn.',
      cell: renderDisplayNameCell,
    },
  ]

  let createErrorMessage: string | null = null
  if (createAccessRoleHook.error !== null) {
    createErrorMessage = createAccessRoleHook.error.detail
  }
  let changeErrorMessage: string | null = null
  if (changeAccessRoleHook.error !== null) {
    changeErrorMessage = changeAccessRoleHook.error.detail
  }
  let footer
  if (masterDataHook.error !== null) {
    footer = <span className="text-danger">{masterDataHook.error.detail}</span>
  } else if (orderAccessRoleHook.error !== null) {
    footer = <span className="text-danger">{orderAccessRoleHook.error.detail}</span>
  } else if (accessRoles === null) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    const accessRolesCountText = accessRoles.length + ' Rechte'
    footer = <span>{accessRolesCountText}</span>
  }
  const newAccessRoleButton = <NewEntityButton label="neues Recht" onClick={() => setNewAccessRoleOpen(true)} />
  let renamePopupTitle = ''
  if (accessRoleToRename !== null) {
    renamePopupTitle = 'Anzeigename von ' + accessRoleToRename.key
  }

  return (
    <>
      <ContentBox title="Rechte (AR)" actions={newAccessRoleButton} footer={footer}>
        {accessRoles !== null && (
          <Table
            columns={columns}
            rows={accessRoles}
            rowKey={getAccessRoleKey}
            detailTitle={getAccessRoleKey}
            emptyText="Es gibt noch keine Rechte."
            onReorder={listingOrder.reorder}
            reorderDisabled={listingOrder.isSaving}
            settingKey={ACCESS_ROLE_TABLE_SETTING_KEY}
          />
        )}
      </ContentBox>
      {newAccessRoleOpen && (
        <NewKeyDisplayNamePopup
          title="Neues Recht"
          isSaving={createAccessRoleHook.isLoading}
          errorMessage={createErrorMessage}
          onCreate={handleCreateAccessRole}
          onClose={() => setNewAccessRoleOpen(false)}
        />
      )}
      {accessRoleToRename !== null && (
        <EditDisplayNamePopup
          title={renamePopupTitle}
          initialDisplayName={accessRoleToRename.displayName}
          isSaving={changeAccessRoleHook.isLoading}
          errorMessage={changeErrorMessage}
          onSave={handleSaveDisplayName}
          onClose={() => setAccessRoleToRename(null)}
        />
      )}
    </>
  )
}
