import { DeleteButton } from '../../components/DeleteButton.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { SortableTableRow } from '../../components/SortableTableRow.tsx'
import type { FileExtension } from '../../file/FileExtension.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'

type FileExtensionTableRowProps = {
  fileExtension: FileExtension
  /** gesperrt, solange eine neue Reihenfolge gespeichert wird */
  isDragDisabled: boolean
  onEdit: (fileExtension: FileExtension) => void
  onDelete: (fileExtension: FileExtension) => void
}

/** Eine Endung im Tab „Endungen“: links der Griff (verschiebt innerhalb der Gruppe), rechts Bearbeiten und Löschen. */
export function FileExtensionTableRow({ fileExtension, isDragDisabled, onEdit, onDelete }: FileExtensionTableRowProps) {
  let descriptionText = ''
  if (fileExtension.description !== null) {
    descriptionText = getTextInCurrentLanguage(fileExtension.description)
  }
  let imagePreviewIconClassName = 'bi bi-dash text-secondary'
  let imagePreviewLabel = 'kein Vorschaubild'
  if (fileExtension.imagePreview) {
    imagePreviewIconClassName = 'bi bi-check-lg'
    imagePreviewLabel = 'Vorschaubild'
  }
  const editLabel = fileExtension.extension + ' bearbeiten'
  const deleteLabel = fileExtension.extension + ' löschen'

  return (
    <SortableTableRow itemKey={fileExtension.extension} disabled={isDragDisabled}>
      <td className="file-extension-cell">
        <code>.{fileExtension.extension}</code>
      </td>
      <td>{descriptionText}</td>
      <td className="file-extension-preview-cell">
        <i className={imagePreviewIconClassName} aria-label={imagePreviewLabel}></i>
      </td>
      <td className="text-end text-nowrap">
        <EditButton label={editLabel} onClick={() => onEdit(fileExtension)} />
        <DeleteButton label={deleteLabel} onClick={() => onDelete(fileExtension)} />
      </td>
    </SortableTableRow>
  )
}
