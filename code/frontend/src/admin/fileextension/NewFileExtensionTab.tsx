import type { FileExtension } from '../../file/FileExtension.ts'
import { useFileExtension } from '../../file/useFileExtension.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { FileExtensionForm } from './FileExtensionForm.tsx'
import { FILE_EXTENSION_TAB_PATH } from './fileExtensionPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/** Leerer Startstand des Formulars. */
const EMPTY_FILE_EXTENSION: FileExtension = {
  extension: '',
  description: null,
  fileExtensionGroupKey: null,
  listingPosition: 0,
  imagePreview: false,
}

/**
 * Seite „neue Endung“ unter `/admin/file-extension/new`. Nach dem Anlegen werden die Stammdaten neu geladen, dann geht es
 * zurück zum Tab „Endungen“.
 */
export function NewFileExtensionTab() {
  const originNavigation = useOrigin()
  const fileExtensionHook = useFileExtension()
  const masterDataHook = useMasterData()

  async function handleSave(newFileExtension: FileExtension) {
    const createdFileExtension = await fileExtensionHook.createFileExtension(newFileExtension)
    if (createdFileExtension === null) {
      return
    }
    await masterDataHook.reload()
    originNavigation.goBackToOrigin(FILE_EXTENSION_TAB_PATH)
  }

  function handleCancel() {
    originNavigation.goBackToOrigin(FILE_EXTENSION_TAB_PATH)
  }

  let errorMessage: string | null = null
  if (fileExtensionHook.error !== null) {
    errorMessage = fileExtensionHook.error.detail
  }

  return (
    <FileExtensionForm
      title="neue Endung"
      initialFileExtension={EMPTY_FILE_EXTENSION}
      isExtensionEditable={true}
      isSaving={fileExtensionHook.isLoading}
      errorMessage={errorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
