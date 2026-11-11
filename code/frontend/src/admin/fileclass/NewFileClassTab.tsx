import type { FileClass } from '../../file/FileClass.ts'
import { useFileClass } from '../../file/useFileClass.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { FileClassForm } from './FileClassForm.tsx'
import { FILE_CLASS_TAB_PATH } from './fileClassPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/** Leerer Startstand des Formulars. */
const EMPTY_FILE_CLASS: FileClass = { key: '', displayName: {}, description: null, listingPosition: 0, badgeLook: null }

/**
 * Seite „neue FileClass“ unter `/admin/file-class/new`. Nach dem Anlegen werden die Stammdaten neu geladen, dann geht es
 * zurück zum Tab „FileClass“.
 */
export function NewFileClassTab() {
  const originNavigation = useOrigin()
  const fileClassHook = useFileClass()
  const masterDataHook = useMasterData()

  async function handleSave(newFileClass: FileClass) {
    const createdFileClass = await fileClassHook.createFileClass(newFileClass)
    if (createdFileClass === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(FILE_CLASS_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(FILE_CLASS_TAB_PATH)
  }

  let errorMessage: string | null = null
  if (fileClassHook.error !== null) {
    errorMessage = fileClassHook.error.detail
  }

  return (
    <FileClassForm
      title="neue FileClass"
      initialFileClass={EMPTY_FILE_CLASS}
      isKeyEditable={true}
      isSaving={fileClassHook.isLoading}
      errorMessage={errorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
