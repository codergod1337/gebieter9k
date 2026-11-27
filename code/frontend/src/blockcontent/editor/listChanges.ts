/** Kleine Helfer für Listen im Editor: Jede Änderung liefert eine NEUE Liste, die alte bleibt, wie sie ist. */

/** Die Liste mit einem anderen Eintrag an dieser Stelle. */
export function replaceListItem<T>(list: T[], index: number, changedItem: T): T[] {
  const changedList = [...list]
  changedList[index] = changedItem
  return changedList
}

/** Die Liste ohne den Eintrag an dieser Stelle. */
export function removeListItem<T>(list: T[], index: number): T[] {
  return list.filter((_item, itemIndex) => itemIndex !== index)
}

/** Die Liste mit dem Eintrag um einen Platz verschoben (`-1` nach oben, `1` nach unten); am Rand bleibt sie, wie sie ist. */
export function moveListItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= list.length) {
    return list
  }
  const changedList = [...list]
  const movedItem = changedList[index]
  changedList[index] = changedList[targetIndex]
  changedList[targetIndex] = movedItem
  return changedList
}
