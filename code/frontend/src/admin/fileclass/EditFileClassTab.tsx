import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import type { FileClass } from '../../file/FileClass.ts'
import { useFileClass } from '../../file/useFileClass.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { FileClassForm } from './FileClassForm.tsx'
import { FILE_CLASS_TAB_PATH } from './fileClassPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/**
 * Seite „FileClass bearbeiten“ unter `/admin/file-class/edit/<key>`: lädt die FileClass, dann das Formular. Laden und
 * Speichern haben je eine eigene Hook-Instanz, damit ein Fehler beim Speichern im Formular steht und es nicht ersetzt.
 */
export function EditFileClassTab() {
  const originNavigation = useOrigin()
  const { fileClassKey } = useParams()
  const requestedFileClassKey = fileClassKey ?? ''
  const loadFileClassHook = useFileClass()
  const changeFileClassHook = useFileClass()
  const masterDataHook = useMasterData()

  const getFileClass = loadFileClassHook.getFileClass
  const loadFileClass = useCallback(() => getFileClass(requestedFileClassKey), [getFileClass, requestedFileClassKey])
  const loadedFileClass = useLoadedData(loadFileClass)

  async function handleSave(changedFileClass: FileClass) {
    const savedFileClass = await changeFileClassHook.changeFileClass(changedFileClass)
    if (savedFileClass === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(FILE_CLASS_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(FILE_CLASS_TAB_PATH)
  }

  if (loadFileClassHook.error !== null) {
    return <ErrorAlert message={loadFileClassHook.error.detail} />
  }
  const fileClass = loadedFileClass.data
  if (fileClass === null) {
    return <Spinner animation="border" />
  }

  let saveErrorMessage: string | null = null
  if (changeFileClassHook.error !== null) {
    saveErrorMessage = changeFileClassHook.error.detail
  }
  const contentBoxTitle = 'FileClass bearbeiten: ' + fileClass.key
  return (
    <FileClassForm
      key={fileClass.key}
      title={contentBoxTitle}
      initialFileClass={fileClass}
      isKeyEditable={false}
      isSaving={changeFileClassHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
