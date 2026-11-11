import { useState } from 'react'
import { showToast } from './toastStore.ts'

/** Was {@link useListingOrder} anbietet. */
export type ListingOrder<T> = {
  /** die Liste zum Anzeigen: während des Speicherns schon in neuer Reihenfolge, sonst wie geladen */
  shownItems: T[] | null
  /** nach dem Loslassen: zeigt die neue Reihenfolge sofort und speichert sie */
  reorder: (reorderedItems: T[]) => Promise<void>
  /** wahr, solange gespeichert wird; die Griffe sind dann gesperrt */
  isSaving: boolean
}

/**
 * Die Reihenfolge einer Liste nach Drag and Drop: zeigt sie sofort (sonst spränge die Zeile kurz zurück), speichert sie
 * und meldet das Ergebnis per Toast. Scheitert das Speichern, steht wieder die geladene Reihenfolge da.
 *
 * @param loadedItems die geladene Liste, `null` solange sie fehlt
 * @param itemKey der Key eines Elements
 * @param saveKeysInOrder speichert alle Keys von oben nach unten und lädt danach die Liste neu; liefert, ob es klappte
 * @param listLabel für den Toast, z. B. „Rechte“
 */
export function useListingOrder<T>(
  loadedItems: T[] | null,
  itemKey: (item: T) => string,
  saveKeysInOrder: (keysInOrder: string[]) => Promise<boolean>,
  listLabel: string,
): ListingOrder<T> {
  const [pendingItems, setPendingItems] = useState<T[] | null>(null)

  async function reorder(reorderedItems: T[]) {
    setPendingItems(reorderedItems)
    const keysInOrder = reorderedItems.map(itemKey)
    const saved = await saveKeysInOrder(keysInOrder)
    setPendingItems(null)
    if (saved) {
      showToast({ kind: 'success', title: 'Reihenfolge gespeichert', text: listLabel + ': neue Reihenfolge ist sicher.' })
      return
    }
    showToast({ kind: 'error', title: 'Reihenfolge nicht gespeichert', text: listLabel + ': bitte neu laden.' })
  }

  let shownItems = loadedItems
  if (pendingItems !== null) {
    shownItems = pendingItems
  }
  const isSaving = pendingItems !== null
  return { shownItems, reorder, isSaving }
}
