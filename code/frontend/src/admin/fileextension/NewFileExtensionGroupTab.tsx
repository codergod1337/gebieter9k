import type { FileExtensionGroup } from '../../file/FileExtensionGroup.ts'
import { useFileExtensionGroup } from '../../file/useFileExtensionGroup.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { FileExtensionGroupForm } from './FileExtensionGroupForm.tsx'
import { FILE_EXTENSION_TAB_PATH } from './fileExtensionPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/** Leerer Startstand des Formulars. */
const EMPTY_FILE_EXTENSION_GROUP: FileExtensionGroup = { key: '', displayName: {}, listingPosition: 0 }

/**
 * Seite „neue Gruppe“ unter `/admin/file-extension/group/new`. Nach dem Anlegen werden die Stammdaten neu geladen, dann
 * geht es zurück zum Tab „Endungen“.
 */
export function NewFileExtensionGroupTab() {
  const originNavigation = useOrigin()
  const fileExtensionGroupHook = useFileExtensionGroup()
  const masterDataHook = useMasterData()

  async function handleSave(newFileExtensionGroup: FileExtensionGroup) {
    const createdFileExtensionGroup = await fileExtensionGroupHook.createFileExtensionGroup(newFileExtensionGroup)
    if (createdFileExtensionGroup === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(FILE_EXTENSION_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(FILE_EXTENSION_TAB_PATH)
  }

  let errorMessage: string | null = null
  if (fileExtensionGroupHook.error !== null) {
    errorMessage = fileExtensionGroupHook.error.detail
  }

  return (
    <FileExtensionGroupForm
      title="neue Gruppe"
      initialFileExtensionGroup={EMPTY_FILE_EXTENSION_GROUP}
      isKeyEditable={true}
      isSaving={fileExtensionGroupHook.isLoading}
      errorMessage={errorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
