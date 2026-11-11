import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import type { FileExtensionGroup } from '../../file/FileExtensionGroup.ts'
import { useFileExtensionGroup } from '../../file/useFileExtensionGroup.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { FileExtensionGroupForm } from './FileExtensionGroupForm.tsx'
import { FILE_EXTENSION_TAB_PATH } from './fileExtensionPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/**
 * Seite „Gruppe bearbeiten“ unter `/admin/file-extension/group/edit/<key>`: lädt die Gruppe, dann das Formular. Laden
 * und Speichern haben je eine eigene Hook-Instanz, damit ein Fehler beim Speichern im Formular steht.
 */
export function EditFileExtensionGroupTab() {
  const originNavigation = useOrigin()
  const { fileExtensionGroupKey } = useParams()
  const requestedFileExtensionGroupKey = fileExtensionGroupKey ?? ''
  const loadFileExtensionGroupHook = useFileExtensionGroup()
  const changeFileExtensionGroupHook = useFileExtensionGroup()
  const masterDataHook = useMasterData()

  const getFileExtensionGroup = loadFileExtensionGroupHook.getFileExtensionGroup
  const loadFileExtensionGroup = useCallback(
    () => getFileExtensionGroup(requestedFileExtensionGroupKey),
    [getFileExtensionGroup, requestedFileExtensionGroupKey],
  )
  const loadedFileExtensionGroup = useLoadedData(loadFileExtensionGroup)

  async function handleSave(changedFileExtensionGroup: FileExtensionGroup) {
    const savedFileExtensionGroup =
      await changeFileExtensionGroupHook.changeFileExtensionGroup(changedFileExtensionGroup)
    if (savedFileExtensionGroup === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(FILE_EXTENSION_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(FILE_EXTENSION_TAB_PATH)
  }

  if (loadFileExtensionGroupHook.error !== null) {
    return <ErrorAlert message={loadFileExtensionGroupHook.error.detail} />
  }
  const loadedGroup = loadedFileExtensionGroup.data
  if (loadedGroup === null) {
    return <Spinner animation="border" />
  }

  let saveErrorMessage: string | null = null
  if (changeFileExtensionGroupHook.error !== null) {
    saveErrorMessage = changeFileExtensionGroupHook.error.detail
  }
  const contentBoxTitle = 'Gruppe bearbeiten: ' + loadedGroup.key
  return (
    <FileExtensionGroupForm
      key={loadedGroup.key}
      title={contentBoxTitle}
      initialFileExtensionGroup={loadedGroup}
      isKeyEditable={false}
      isSaving={changeFileExtensionGroupHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
