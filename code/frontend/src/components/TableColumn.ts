import type { ReactNode } from 'react'

/** Eine Spalte der zentralen {@link Table} (`components/Table.tsx`), wie in der Vorlage. */
export type TableColumn<T> = {
  /** Der Spaltenkopf als Text, auch im Detail-Popup und in den Spalteneinstellungen. */
  header: string
  /** Die feste Kennung der Spalte für die Einstellungen des Users (Breite, ausgeblendet). Fehlt sie, gilt der header. */
  key?: string
  /** Erklärung der Spalte im Hoverlay am Spaltenkopf, beim Zeigen oder Anklicken, auch im Detail-Popup. */
  headerHint?: ReactNode
  cell: (row: T) => ReactNode
  /** Eine Klasse für jede Zelle der Spalte, z. B. `text-center` für Checkboxen. */
  cellClassName?: string
  /** unwichtig: fällt weg, wenn die Breite nicht reicht, und der User kann sie ausblenden; im Detail-Popup zu sehen */
  unimportant?: boolean
  /**
   * Breite aus dem Code, z. B. `9rem`, der Ausgangspunkt. Sobald eine Spalte eine hat, rechnet die Tabelle mit festem
   * Layout: Spalten ohne Breite teilen sich den Rest. Zieht der User eine Spalte, ist ihre Breite fix.
   */
  width?: string
  /** Der Spaltenkopf steht senkrecht, von unten nach oben gelesen: für schmale Spalten mit einem Schalter. */
  verticalHeader?: boolean
}

/** Die Kennung einer Spalte: key, sonst der header. */
export function tableColumnKeyOf<T>(column: TableColumn<T>): string {
  if (column.key !== undefined) {
    return column.key
  }
  return column.header
}
