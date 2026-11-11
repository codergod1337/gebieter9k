import { useCurrentSession } from '../../auth/login/useCurrentSession.ts'
import { getUploadableFileClassKeys } from '../../file/FileClassAccessRole.ts'
import { FileUploadForm } from '../../file/upload/FileUploadForm.tsx'
import { useFileDocument } from '../../file/useFileDocument.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'

/** Unter diesem Schlüssel bleiben die fertigen Uploads des File-Managers gemerkt. */
const RECENT_FILE_UPLOADS_STATE_KEY = 'RECENT_FILE_UPLOADS'

/**
 * Tab „Hochladen“ des File-Managers: der globale Upload-Ablauf ({@link FileUploadForm}) mit jeder FileClass, in die der
 * User schreiben darf, über `/api/file-manager/file-document/upload` (nur FILE_MANAGER und ADMIN, ohne Ziel). Je Datei
 * alle Felder, die der Client setzen darf (außer FileClass und Dateiname).
 */
export function FileUploadTab() {
  const masterDataHook = useMasterData()
  const { hasAccessRole } = useCurrentSession()
  const fileDocumentHook = useFileDocument()
  const uploadableFileClassKeys = getUploadableFileClassKeys(masterDataHook.fileClassAccessRoles ?? [], hasAccessRole)
  const writableFileClasses = (masterDataHook.fileClasses ?? []).filter((fileClass) =>
    uploadableFileClassKeys.has(fileClass.key),
  )
  return (
    <FileUploadForm
      title="Dateien hochladen"
      offeredFileClasses={writableFileClasses}
      noFileClassText="Es gibt keine FileClass, in die du hochladen darfst."
      uploadFieldNames={null}
      uploadFile={fileDocumentHook.uploadFile}
      recentFileUploadsStateKey={RECENT_FILE_UPLOADS_STATE_KEY}
      fileDocumentOriginLabel="Hochladen"
    />
  )
}
