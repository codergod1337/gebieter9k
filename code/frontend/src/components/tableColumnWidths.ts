import type { TableColumn } from './TableColumn.ts'
import { tableColumnKeyOf } from './TableColumn.ts'

/**
 * Die Breitenrechnung der zentralen Table, ohne React, aus der Vorlage übernommen: Breiten in Pixel, welche Spalten in
 * eine Breite passen, und wie breit jede sichtbare Spalte wird. Die Table ruft sie mit der gemessenen Breite
 * (useAvailableWidth) und gibt dem Browser jede Breite in Pixel vor, die Summe ist genau die Zeile. So verteilt der
 * Browser nichts mehr um: Eine Spalte, die der User gezogen hat, bleibt exakt so breit, alle anderen teilen sich den Rest.
 */

/**
 * Der Sockel der Spalte ohne Breite im festen Layout: so viel Platz behält sie, bevor unwichtige Spalten wegfallen.
 * Ohne den Sockel bekäme sie bei schmalem Fenster null Breite und bräche Zeichen für Zeichen um, die Kopfzeile würde
 * seitenhoch.
 */
export const FLEXIBLE_COLUMN_MIN_REM = 8

/** So schmal darf der User eine Spalte ziehen, und so schmal wird eine Code-Spalte höchstens zusammengedrückt */
export const MIN_COLUMN_REM = 2

/** Ein paar Pixel Luft für Rahmen, damit die Rechnung nicht am letzten Pixel kippt */
const FIT_TOLERANCE_PX = 2

export function rootFontSizePx(): number {
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(rootFontSize) && rootFontSize > 0 ? rootFontSize : 16
}

export function remToPx(rem: number): number {
  return rem * rootFontSizePx()
}

/** Eine Spaltenbreite in Pixel: rem und em über die Grundschrift, Prozent über die verfügbare Breite, sonst Pixel; ohne Breite der Sockel */
export function columnWidthPx(width: string | undefined, availablePx: number): number {
  if (width === undefined) {
    return remToPx(FLEXIBLE_COLUMN_MIN_REM)
  }
  const value = parseFloat(width)
  if (!Number.isFinite(value)) {
    return remToPx(FLEXIBLE_COLUMN_MIN_REM)
  }
  if (width.endsWith('rem') || width.endsWith('em')) {
    return remToPx(value)
  }
  if (width.endsWith('%')) {
    return (availablePx * value) / 100
  }
  return value
}

/** Die Breite aus dem Code: die der Spalte, bei der ersten Spalte ohne eigene ersatzweise die Griffbreite */
function codeWidthOf<T>(column: TableColumn<T>, index: number, firstColumnFallbackWidth: string | undefined): string | undefined {
  return column.width ?? (index === 0 ? firstColumnFallbackWidth : undefined)
}

/**
 * Die Spalten, die in die verfügbare Breite passen: Passt die Summe der Breiten nicht, fällt die rechteste unwichtige
 * Spalte weg, so lange, bis es passt oder keine unwichtige mehr da ist. Zuerst fallen die, die der User nicht gezogen
 * hat; eine gezogene unwichtige Spalte fällt erst, wenn sonst keine mehr da ist (User 2026-10-23: die gezogenen
 * interessieren ihn). Die erste Spalte und die Aktionsspalte fallen nie. firstColumnFallbackWidth gilt für die erste
 * Spalte ohne eigene Breite, z. B. die Griffspalte beim Verschieben.
 */
export function fittingColumns<T>(
  columns: TableColumn<T>[],
  fixedKeys: ReadonlySet<string>,
  availablePx: number,
  actionsPx: number,
  firstColumnFallbackWidth: string | undefined,
): TableColumn<T>[] {
  const kept = [...columns]
  const neededPx = () => kept.reduce((sum, column, index) => sum + columnWidthPx(codeWidthOf(column, index, firstColumnFallbackWidth), availablePx), actionsPx)
  const lastDroppable = (fixed: boolean) => {
    for (let index = kept.length - 1; index >= 1; index--) {
      if (kept[index].unimportant && fixedKeys.has(tableColumnKeyOf(kept[index])) === fixed) {
        return index
      }
    }
    return -1
  }
  while (neededPx() > availablePx + FIT_TOLERANCE_PX) {
    let dropIndex = lastDroppable(false)
    if (dropIndex < 0) {
      dropIndex = lastDroppable(true)
    }
    if (dropIndex < 0) {
      break
    }
    kept.splice(dropIndex, 1)
  }
  return kept
}

/**
 * Die Breite jeder sichtbaren Spalte in Pixel (User 2026-10-23): Eine gezogene Spalte (fixedKeys) ist exakt so breit,
 * wie sie gezogen wurde. Alle anderen teilen sich den Rest der Zeile: Spalten ohne Code-Breite bekommen ihn zu gleichen
 * Teilen, die Code-Spalten behalten ihre Breite; gibt es keine Spalte ohne Code-Breite, wachsen oder schrumpfen die
 * Code-Spalten anteilig, bis die Summe die Zeile füllt. Unter den Sockel geht keine Spalte ohne Breite, unter
 * MIN_COLUMN_REM keine Code-Spalte; reicht es trotzdem nicht, läuft die Tabelle über. Sind alle Spalten gezogen, ist die
 * Summe kleiner als die Zeile, rechts bleibt Luft.
 */
export function columnWidthsPx<T>(
  columns: TableColumn<T>[],
  fixedKeys: ReadonlySet<string>,
  availablePx: number,
  actionsPx: number,
  firstColumnFallbackWidth: string | undefined,
): number[] {
  const widths: (number | null)[] = columns.map((column, index) => {
    if (!fixedKeys.has(tableColumnKeyOf(column))) {
      return null
    }
    return columnWidthPx(codeWidthOf(column, index, firstColumnFallbackWidth), availablePx)
  })
  const fixedSum = widths.reduce<number>((sum, px) => sum + (px ?? 0), 0)
  const rest = availablePx - actionsPx - fixedSum
  const flexibleIndexes: number[] = []
  const codeIndexes: number[] = []
  columns.forEach((column, index) => {
    if (widths[index] !== null) {
      return
    }
    if (codeWidthOf(column, index, firstColumnFallbackWidth) === undefined) {
      flexibleIndexes.push(index)
    } else {
      codeIndexes.push(index)
    }
  })
  if (flexibleIndexes.length === 0 && codeIndexes.length === 0) {
    return widths.map((px) => px ?? 0)
  }
  const minCodePx = remToPx(MIN_COLUMN_REM)
  const codePx = (index: number) => columnWidthPx(codeWidthOf(columns[index], index, firstColumnFallbackWidth), availablePx)
  const codeSum = codeIndexes.reduce((sum, index) => sum + codePx(index), 0)
  if (flexibleIndexes.length > 0) {
    const flexibleMinPx = remToPx(FLEXIBLE_COLUMN_MIN_REM)
    const flexibleRest = rest - codeSum
    if (flexibleRest >= flexibleIndexes.length * flexibleMinPx) {
      // der Normalfall: die Code-Spalten bleiben, die Spalten ohne Breite teilen sich den Rest
      flexibleIndexes.forEach((index) => (widths[index] = flexibleRest / flexibleIndexes.length))
      codeIndexes.forEach((index) => (widths[index] = codePx(index)))
    } else {
      // zu eng: die Spalten ohne Breite behalten den Sockel, die Code-Spalten rücken anteilig zusammen
      flexibleIndexes.forEach((index) => (widths[index] = flexibleMinPx))
      const codeRest = Math.max(0, rest - flexibleIndexes.length * flexibleMinPx)
      const scale = codeSum > 0 ? codeRest / codeSum : 0
      codeIndexes.forEach((index) => (widths[index] = Math.max(minCodePx, codePx(index) * scale)))
    }
  } else {
    // keine Spalte ohne Breite: die Code-Spalten füllen die Zeile anteilig
    const scale = codeSum > 0 ? Math.max(0, rest) / codeSum : 0
    codeIndexes.forEach((index) => (widths[index] = Math.max(minCodePx, codePx(index) * scale)))
  }
  return widths.map((px) => px ?? 0)
}
