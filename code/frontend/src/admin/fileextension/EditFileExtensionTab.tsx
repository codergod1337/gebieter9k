import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import type { FileExtension } from '../../file/FileExtension.ts'
import { useFileExtension } from '../../file/useFileExtension.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { FileExtensionForm } from './FileExtensionForm.tsx'
import { FILE_EXTENSION_TAB_PATH } from './fileExtensionPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/**
 * Seite „Endung bearbeiten“ unter `/admin/file-extension/edit/<endung>`: lädt die Endung, dann das Formular. Laden und
 * Speichern haben je eine eigene Hook-Instanz, damit ein Fehler beim Speichern im Formular steht.
 */
export function EditFileExtensionTab() {
  const originNavigation = useOrigin()
  const { fileExtension } = useParams()
  const requestedFileExtension = fileExtension ?? ''
  const loadFileExtensionHook = useFileExtension()
  const changeFileExtensionHook = useFileExtension()
  const masterDataHook = useMasterData()

  const getFileExtension = loadFileExtensionHook.getFileExtension
  const loadFileExtension = useCallback(
    () => getFileExtension(requestedFileExtension),
    [getFileExtension, requestedFileExtension],
  )
  const loadedFileExtension = useLoadedData(loadFileExtension)

  async function handleSave(changedFileExtension: FileExtension) {
    const savedFileExtension = await changeFileExtensionHook.changeFileExtension(changedFileExtension)
    if (savedFileExtension === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(FILE_EXTENSION_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(FILE_EXTENSION_TAB_PATH)
  }

  if (loadFileExtensionHook.error !== null) {
    return <ErrorAlert message={loadFileExtensionHook.error.detail} />
  }
  const loadedExtension = loadedFileExtension.data
  if (loadedExtension === null) {
    return <Spinner animation="border" />
  }

  let saveErrorMessage: string | null = null
  if (changeFileExtensionHook.error !== null) {
    saveErrorMessage = changeFileExtensionHook.error.detail
  }
  const contentBoxTitle = 'Endung bearbeiten: ' + loadedExtension.extension
  return (
    <FileExtensionForm
      key={loadedExtension.extension}
      title={contentBoxTitle}
      initialFileExtension={loadedExtension}
      isExtensionEditable={false}
      isSaving={changeFileExtensionHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
