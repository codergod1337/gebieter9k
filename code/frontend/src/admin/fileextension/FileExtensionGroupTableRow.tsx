import { DeleteButton } from '../../components/DeleteButton.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { SortableTableRow } from '../../components/SortableTableRow.tsx'
import type { FileExtensionGroup } from '../../file/FileExtensionGroup.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'

type FileExtensionGroupTableRowProps = {
  fileExtensionGroup: FileExtensionGroup
  /** wie viele Endungen in der Gruppe stehen */
  fileExtensionCount: number
  /** gesperrt, solange eine neue Reihenfolge gespeichert wird */
  isDragDisabled: boolean
  onEdit: (fileExtensionGroup: FileExtensionGroup) => void
  onDelete: (fileExtensionGroup: FileExtensionGroup) => void
}

/** Eine Zeile der Gruppen im Tab „Endungen“: links der Griff, rechts Bearbeiten und Löschen. */
export function FileExtensionGroupTableRow({
  fileExtensionGroup,
  fileExtensionCount,
  isDragDisabled,
  onEdit,
  onDelete,
}: FileExtensionGroupTableRowProps) {
  const displayNameText = getTextInCurrentLanguage(fileExtensionGroup.displayName)
  const editLabel = fileExtensionGroup.key + ' bearbeiten'
  const deleteLabel = fileExtensionGroup.key + ' löschen'

  return (
    <SortableTableRow itemKey={fileExtensionGroup.key} disabled={isDragDisabled}>
      <td>
        <code>{fileExtensionGroup.key}</code>
      </td>
      <td>{displayNameText}</td>
      <td>{fileExtensionCount}</td>
      <td className="text-end text-nowrap">
        <EditButton label={editLabel} onClick={() => onEdit(fileExtensionGroup)} />
        <DeleteButton label={deleteLabel} onClick={() => onDelete(fileExtensionGroup)} />
      </td>
    </SortableTableRow>
  )
}
