import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { ReactNode } from 'react'

type SortableAreaProps<T> = {
  items: T[]
  itemKey: (item: T) => string
  /** nach dem Loslassen: die Elemente in neuer Reihenfolge. Ohne Änderung kommt nichts. */
  onReorder: (reorderedItems: T[]) => void
  /** `list` (Standard): untereinander, z. B. Tabellenzeilen; `grid`: Kacheln im Raster, z. B. die Bilder einer Galerie. */
  layout?: 'list' | 'grid'
  children: ReactNode
}

/**
 * Der Bereich, in dem Elemente untereinander per Drag and Drop verschoben werden, wie in der Vorlage (@dnd-kit). Zeichnet
 * selbst nichts: Die Elemente darin nutzen {@link useSortableItem}, z. B. Tabellenzeilen oder die Zeilen der Matrix.
 * Beim Ziehen rücken die anderen Elemente live beiseite, so sieht man immer, wo das Element landet.
 */
export function SortableArea<T>({ items, itemKey, onReorder, layout = 'list', children }: SortableAreaProps<T>) {
  const sensors = useSensors(
    // erst ab 4 px Bewegung ziehen, ein einfacher Klick bleibt ein Klick
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // mit der Tastatur: Griff fokussieren, Leertaste, Pfeile, Leertaste
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const keys = items.map(itemKey)

  function handleDragEnd(event: DragEndEvent) {
    const over = event.over
    if (over === null) {
      return
    }
    const activeKey = String(event.active.id)
    const overKey = String(over.id)
    if (activeKey === overKey) {
      return
    }
    const fromIndex = keys.indexOf(activeKey)
    const toIndex = keys.indexOf(overKey)
    if (fromIndex < 0 || toIndex < 0) {
      return
    }
    const reorderedItems = arrayMove(items, fromIndex, toIndex)
    onReorder(reorderedItems)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={keys} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}
