import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import type { AccessRoleCollection } from '../../auth/access/AccessRoleCollection.ts'
import { useAccessRoleCollection } from '../../auth/access/useAccessRoleCollection.ts'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { AccessRoleCollectionForm } from './AccessRoleCollectionForm.tsx'
import { ACCESS_ROLE_COLLECTION_TAB_PATH } from './accessRoleCollectionPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/**
 * Seite „Position bearbeiten“ unter `/admin/access-role-collection/edit/<key>`: lädt die Position, dann das Formular.
 * Nach dem Speichern laden die Stammdaten neu, damit jede Pille sofort im neuen Aussehen steht.
 */
export function EditAccessRoleCollectionTab() {
  const originNavigation = useOrigin()
  const { accessRoleCollectionKey } = useParams()
  const requestedAccessRoleCollectionKey = accessRoleCollectionKey ?? ''
  const loadAccessRoleCollectionHook = useAccessRoleCollection()
  const changeAccessRoleCollectionHook = useAccessRoleCollection()
  const masterDataHook = useMasterData()

  const getAccessRoleCollection = loadAccessRoleCollectionHook.getAccessRoleCollection
  const loadAccessRoleCollection = useCallback(
    () => getAccessRoleCollection(requestedAccessRoleCollectionKey),
    [getAccessRoleCollection, requestedAccessRoleCollectionKey],
  )
  const loadedAccessRoleCollection = useLoadedData(loadAccessRoleCollection)

  async function handleSave(changedAccessRoleCollection: AccessRoleCollection) {
    const savedAccessRoleCollection =
      await changeAccessRoleCollectionHook.changeAccessRoleCollection(changedAccessRoleCollection)
    if (savedAccessRoleCollection === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(ACCESS_ROLE_COLLECTION_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(ACCESS_ROLE_COLLECTION_TAB_PATH)
  }

  if (loadAccessRoleCollectionHook.error !== null) {
    return <ErrorAlert message={loadAccessRoleCollectionHook.error.detail} />
  }
  const accessRoleCollection = loadedAccessRoleCollection.data
  if (accessRoleCollection === null) {
    return <Spinner animation="border" />
  }

  let saveErrorMessage: string | null = null
  if (changeAccessRoleCollectionHook.error !== null) {
    saveErrorMessage = changeAccessRoleCollectionHook.error.detail
  }
  const contentBoxTitle = 'Position bearbeiten: ' + accessRoleCollection.key
  return (
    <AccessRoleCollectionForm
      key={accessRoleCollection.key}
      title={contentBoxTitle}
      initialAccessRoleCollection={accessRoleCollection}
      isSaving={changeAccessRoleCollectionHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
