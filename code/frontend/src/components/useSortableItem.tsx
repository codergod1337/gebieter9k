import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, ReactNode } from 'react'

/** Was {@link useSortableItem} dem Element gibt. */
export type SortableItem = {
  ref: (element: HTMLElement | null) => void
  style: CSSProperties
  /** wahr, solange genau dieses Element gezogen wird */
  isDragging: boolean
  /** der Griff zum Verschieben, setzt das Element dorthin, wo er hingehört */
  dragHandle: ReactNode
}

/**
 * Macht ein Element in einer {@link SortableArea} verschiebbar, wie in der Vorlage. Das Element bekommt `ref` und
 * `style`, den Griff (`dragHandle`) setzt es selbst, z. B. in die erste Zelle einer Zeile. Gezogen wird nur am Griff: mit
 * Maus, Finger oder Tastatur (Leertaste, Pfeile, Leertaste).
 *
 * @param key der Schlüssel des Elements, derselbe wie `itemKey` in der SortableArea
 * @param disabled z. B. während eine neue Reihenfolge gespeichert wird
 */
export function useSortableItem(key: string, disabled: boolean = false): SortableItem {
  const sortable = useSortable({ id: key, disabled })
  const isDragging = sortable.isDragging
  const transformText = CSS.Translate.toString(sortable.transform)
  let zIndex: number | undefined = undefined
  if (isDragging) {
    zIndex = 5
  }
  const style: CSSProperties = {
    transform: transformText,
    transition: sortable.transition,
    position: 'relative',
    zIndex,
  }

  const dragHandle = (
    <button
      type="button"
      ref={sortable.setActivatorNodeRef}
      className="drag-handle"
      aria-label="verschieben"
      disabled={disabled}
      {...sortable.attributes}
      {...sortable.listeners}>
      <i className="bi bi-grip-vertical" aria-hidden="true"></i>
    </button>
  )

  return { ref: sortable.setNodeRef, style, isDragging, dragHandle }
}
