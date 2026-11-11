import type { ReactNode } from 'react'
import { useSortableItem } from './useSortableItem.tsx'

type SortableTableRowProps = {
  /** der Key der Zeile, derselbe wie `itemKey` der {@link SortableArea} */
  itemKey: string
  disabled: boolean
  /** die übrigen Zellen; die erste Zelle mit dem Griff setzt die Zeile selbst */
  children: ReactNode
}

/**
 * Eine Tabellenzeile, die sich per Drag and Drop verschieben lässt, innerhalb einer {@link SortableArea} um den
 * `<tbody>`. Ganz links sitzt der Griff, beim Ziehen hebt das Theme die Zeile an (`sortable-row-dragging`).
 */
export function SortableTableRow({ itemKey, disabled, children }: SortableTableRowProps) {
  const sortableItem = useSortableItem(itemKey, disabled)
  let rowClassName = 'sortable-row'
  if (sortableItem.isDragging) {
    rowClassName = 'sortable-row sortable-row-dragging'
  }
  return (
    <tr ref={sortableItem.ref} style={sortableItem.style} className={rowClassName}>
      <td className="drag-cell">{sortableItem.dragHandle}</td>
      {children}
    </tr>
  )
}
