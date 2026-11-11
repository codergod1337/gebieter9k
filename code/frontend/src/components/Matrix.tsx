import { type MouseEvent, type PointerEvent, type ReactNode, useEffect, useRef } from 'react'
import { SortableArea } from './SortableArea.tsx'
import { usePanScroll } from './usePanScroll.ts'
import { useSortableItem } from './useSortableItem.tsx'

/** Abstand in Pixeln, in dem beim schnellen Wischen zwischen zwei Mauspositionen nachgesehen wird. */
const PAINT_STEP_PIXELS = 6

type MatrixProps<R, C> = {
  rows: R[]
  columns: C[]
  rowKey: (row: R) => string
  columnKey: (column: C) => string
  /** links, bleibt beim seitlichen Scrollen stehen */
  rowHeader: (row: R) => ReactNode
  /** oben, senkrecht gedreht, bleibt beim Scrollen nach unten stehen */
  columnHeader: (column: C) => ReactNode
  /** Beschriftung der Ecke: was in den Zeilen steht, z. B. User */
  rowsLabel: string
  /** Beschriftung der Ecke: was in den Spalten steht, z. B. AccessRoleCollection */
  columnsLabel: string
  /** zusätzlich oben rechts in der Ecke, z. B. die Pinsel */
  cornerContent?: ReactNode
  /** gesetzt: ×, sonst · */
  isMarked: (row: R, column: C) => boolean
  /** Optional: was in einer gesetzten Zelle steht, wenn es mehr als ein „×“ gibt, z. B. „L“ und „S“. Fehlt es: × */
  markText?: (row: R, column: C) => string
  /** eigene Klasse einer Zelle, z. B. `matrix-cell-pending`, solange sie nicht gespeichert ist */
  cellClassName?: (row: R, column: C) => string | undefined
  /** eigene Klasse einer Zeile, z. B. `matrix-group-row` für die Kopfzeile einer Gruppe */
  rowClassName?: (row: R) => string | undefined
  /**
   * Optional: eigener Inhalt einer Zelle statt „×“ bzw. „·“, z. B. ein Zähler „2/5“ in der Zeile einer Gruppe. Liefert
   * es `undefined`, zeigt die Zelle wie sonst, ob sie gesetzt ist.
   */
  cellContent?: (row: R, column: C) => ReactNode | undefined
  /** für Screenreader, z. B. „LEIBEIGENER für alice umschalten“ */
  cellLabel: (row: R, column: C) => string
  /** ein Klick: mit der Maus Drücken und Loslassen in derselben Zelle, oder Tastatur, oder Finger */
  onCellClick: (row: R, column: C) => void
  /**
   * Malen: Wer die linke Maustaste gedrückt hält und dabei die Startzelle verlässt, malt. Für jede überstrichene Zelle
   * einmal, die Startzelle eingeschlossen. Fehlt es, gibt es nur Klicks.
   */
  onCellPaint?: (row: R, column: C) => void
  /** nach dem Loslassen eines Malstrichs, z. B. zum Speichern */
  onPaintEnd?: () => void
  /** sperrt alle Zellen, z. B. während gespeichert wird */
  disabled?: boolean
  /**
   * Gesetzt: Die Zeilen lassen sich am Griff im Zeilenkopf per Drag and Drop verschieben, danach kommen sie hier in neuer
   * Reihenfolge an. Die Zellen hängen an `rowKey` und `columnKey`, nie an der Stelle, deshalb bleibt jede Verknüpfung
   * richtig, egal wie die Zeilen stehen.
   */
  onRowReorder?: (reorderedRows: R[]) => void
  /** sperrt die Griffe, z. B. während die neue Reihenfolge gespeichert wird */
  isRowReorderDisabled?: boolean
}

type SortableMatrixRowProps = {
  rowKeyText: string
  /** eigene Klasse der Zeile, `undefined` ohne */
  extraRowClassName: string | undefined
  disabled: boolean
  rowHeaderContent: ReactNode
  /** die Zellen der Zeile */
  children: ReactNode
}

/** Eine Zeile der Matrix, die sich am Griff im Zeilenkopf verschieben lässt. Beim Ziehen hebt das Theme sie an. */
function SortableMatrixRow({
  rowKeyText,
  extraRowClassName,
  disabled,
  rowHeaderContent,
  children,
}: SortableMatrixRowProps) {
  const sortableItem = useSortableItem(rowKeyText, disabled)
  let rowClassName = 'sortable-row'
  if (sortableItem.isDragging) {
    rowClassName = 'sortable-row sortable-row-dragging'
  }
  if (extraRowClassName !== undefined) {
    rowClassName = rowClassName + ' ' + extraRowClassName
  }
  return (
    <tr ref={sortableItem.ref} style={sortableItem.style} className={rowClassName}>
      <th scope="row" className="matrix-row-head">
        <span className="matrix-row-head-sortable">
          {sortableItem.dragHandle}
          {rowHeaderContent}
        </span>
      </th>
      {children}
    </tr>
  )
}

/** Eine Zelle über ihre Stelle in `rows` und `columns`. */
type CellIndex = {
  rowIndex: number
  columnIndex: number
}

/** Ein laufender Malstrich mit der Maus. */
type PaintStroke = {
  start: CellIndex
  lastX: number
  lastY: number
  /** erst wahr, sobald die Startzelle verlassen wurde. Bis dahin ist es ein Klick. */
  isPainting: boolean
  paintedCellIds: Set<string>
}

/**
 * Die Matrix für alle Zuordnungen „Zeile gegen Spalte“, wie in der Vorlage. Sie steht ohne ContentBox direkt unter
 * dem Subheader (siehe `Admin`). Kopfzeile und erste Spalte bleiben stehen, die Ecke sagt diagonal geteilt, was gegen
 * was steht. Jede Zelle ist ganz der Knopf, beim Zeigen färben sich Zeile und Spalte leicht mit (Fadenkreuz).
 * Gescrollt wird in sich: Mausrad, Finger oder mit gedrückter rechter Maustaste. Mit `onCellPaint` lässt sich mit
 * gedrückter linker Maustaste über die Zellen malen, ohne dass etwas stockt: Der Aufrufer sammelt und speichert erst
 * beim Loslassen.
 */
export function Matrix<R, C>({
  rows,
  columns,
  rowKey,
  columnKey,
  rowHeader,
  columnHeader,
  rowsLabel,
  columnsLabel,
  cornerContent,
  isMarked,
  markText,
  cellClassName,
  rowClassName,
  cellContent,
  cellLabel,
  onCellClick,
  onCellPaint,
  onPaintEnd,
  disabled = false,
  onRowReorder,
  isRowReorderDisabled = false,
}: MatrixProps<R, C>) {
  const panScroll = usePanScroll<HTMLDivElement>()
  const scrollRef = panScroll.ref
  const panHandlers = panScroll.handlers
  const strokeRef = useRef<PaintStroke | null>(null)
  const lastPointerTypeRef = useRef<string>('mouse')
  // Die Handler am window gelten für einen ganzen Malstrich: Sie lesen die jeweils neuesten Werte hieraus
  const latestRef = useRef({ rows, columns, onCellClick, onCellPaint, onPaintEnd })
  useEffect(() => {
    latestRef.current = { rows, columns, onCellClick, onCellPaint, onPaintEnd }
  })

  /** Die Zelle unter einem Punkt des Bildschirms, `null` außerhalb der Matrix. */
  function getCellAt(x: number, y: number): CellIndex | null {
    const elementAtPoint = document.elementFromPoint(x, y)
    if (elementAtPoint === null) {
      return null
    }
    const cellElement = elementAtPoint.closest<HTMLElement>('[data-matrix-cell]')
    const scrollContainer = scrollRef.current
    if (cellElement === null || scrollContainer === null || !scrollContainer.contains(cellElement)) {
      return null
    }
    const rowIndex = Number(cellElement.dataset.rowIndex)
    const columnIndex = Number(cellElement.dataset.columnIndex)
    return { rowIndex, columnIndex }
  }

  function paintCell(stroke: PaintStroke, cell: CellIndex) {
    const cellId = cell.rowIndex + ':' + cell.columnIndex
    if (stroke.paintedCellIds.has(cellId)) {
      return
    }
    stroke.paintedCellIds.add(cellId)
    const latest = latestRef.current
    const row = latest.rows[cell.rowIndex]
    const column = latest.columns[cell.columnIndex]
    if (row !== undefined && column !== undefined && latest.onCellPaint !== undefined) {
      latest.onCellPaint(row, column)
    }
  }

  /** Alle Zellen auf der Strecke seit der letzten Position, damit beim schnellen Wischen keine übersprungen wird. */
  function paintTo(stroke: PaintStroke, x: number, y: number) {
    const distance = Math.hypot(x - stroke.lastX, y - stroke.lastY)
    const stepCount = Math.max(1, Math.ceil(distance / PAINT_STEP_PIXELS))
    for (let step = 1; step <= stepCount; step++) {
      const stepX = stroke.lastX + ((x - stroke.lastX) * step) / stepCount
      const stepY = stroke.lastY + ((y - stroke.lastY) * step) / stepCount
      const cell = getCellAt(stepX, stepY)
      if (cell === null) {
        continue
      }
      if (!stroke.isPainting) {
        const isStartCell = cell.rowIndex === stroke.start.rowIndex && cell.columnIndex === stroke.start.columnIndex
        if (isStartCell) {
          continue
        }
        // Startzelle verlassen: ab jetzt wird gemalt, die Startzelle zuerst
        stroke.isPainting = true
        scrollRef.current?.classList.add('painting')
        paintCell(stroke, stroke.start)
      }
      paintCell(stroke, cell)
    }
    stroke.lastX = x
    stroke.lastY = y
  }

  function handleWindowPointerMove(event: globalThis.PointerEvent) {
    const stroke = strokeRef.current
    if (stroke === null) {
      return
    }
    const isLeftButtonPressed = (event.buttons & 1) !== 0
    if (!isLeftButtonPressed) {
      endPaint(true)
      return
    }
    paintTo(stroke, event.clientX, event.clientY)
  }

  function handleWindowPointerUp() {
    endPaint(true)
  }

  function handleWindowPointerCancel() {
    endPaint(false)
  }

  /** Ende eines Strichs. Wurde nicht gemalt und regulär losgelassen, war es ein Klick auf die Startzelle. */
  function endPaint(wasReleased: boolean) {
    const stroke = strokeRef.current
    window.removeEventListener('pointermove', handleWindowPointerMove)
    window.removeEventListener('pointerup', handleWindowPointerUp)
    window.removeEventListener('pointercancel', handleWindowPointerCancel)
    strokeRef.current = null
    scrollRef.current?.classList.remove('painting')
    if (stroke === null) {
      return
    }
    const latest = latestRef.current
    if (stroke.isPainting) {
      if (latest.onPaintEnd !== undefined) {
        latest.onPaintEnd()
      }
      return
    }
    const row = latest.rows[stroke.start.rowIndex]
    const column = latest.columns[stroke.start.columnIndex]
    if (wasReleased && row !== undefined && column !== undefined) {
      latest.onCellClick(row, column)
    }
  }

  function startPaint(event: PointerEvent<HTMLDivElement>) {
    lastPointerTypeRef.current = event.pointerType
    // nur mit der linken Maustaste oder einem Stift, der Finger scrollt
    const isLeftButton = event.button === 0
    const isTouch = event.pointerType === 'touch'
    if (onCellPaint === undefined || disabled || !isLeftButton || isTouch) {
      return
    }
    const targetElement = event.target as HTMLElement
    const cellElement = targetElement.closest<HTMLElement>('[data-matrix-cell]')
    if (cellElement === null) {
      return
    }
    // sonst markiert der Browser beim Ziehen Text
    event.preventDefault()
    const startCell: CellIndex = {
      rowIndex: Number(cellElement.dataset.rowIndex),
      columnIndex: Number(cellElement.dataset.columnIndex),
    }
    strokeRef.current = {
      start: startCell,
      lastX: event.clientX,
      lastY: event.clientY,
      isPainting: false,
      paintedCellIds: new Set(),
    }
    window.addEventListener('pointermove', handleWindowPointerMove)
    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerCancel)
  }

  function handleScrollPointerDown(event: PointerEvent<HTMLDivElement>) {
    panHandlers.onPointerDown(event)
    startPaint(event)
  }

  /** Der Klick des Knopfes. Beim Malen mit der Maus erledigt das schon `endPaint`, sonst käme er doppelt. */
  function handleCellButtonClick(event: MouseEvent<HTMLButtonElement>, row: R, column: C) {
    // detail 0: per Tastatur ausgelöst
    const isKeyboardClick = event.detail === 0
    const wasTouch = lastPointerTypeRef.current === 'touch'
    const handledByStroke = onCellPaint !== undefined && !isKeyboardClick && !wasTouch
    if (!handledByStroke) {
      onCellClick(row, column)
    }
  }

  function renderCellContent(row: R, column: C) {
    if (cellContent !== undefined) {
      const ownCellContent = cellContent(row, column)
      if (ownCellContent !== undefined) {
        return ownCellContent
      }
    }
    if (isMarked(row, column)) {
      let shownMarkText = '×'
      if (markText !== undefined) {
        shownMarkText = markText(row, column)
      }
      return <span className="matrix-mark">{shownMarkText}</span>
    }
    return <span className="matrix-empty">·</span>
  }

  /** Die Zellen einer Zeile; `rowIndex` ist ihre Stelle in `rows`, nur fürs Malen. */
  function renderRowCells(row: R, rowIndex: number) {
    return columns.map((column, columnIndex) => (
      <td
        key={columnKey(column)}
        className={getCellClassNames(row, column)}
        data-matrix-cell=""
        data-row-index={rowIndex}
        data-column-index={columnIndex}>
        <button
          type="button"
          className="matrix-cell-button"
          disabled={disabled}
          aria-label={cellLabel(row, column)}
          aria-pressed={isMarked(row, column)}
          onClick={(event) => handleCellButtonClick(event, row, column)}>
          {renderCellContent(row, column)}
        </button>
      </td>
    ))
  }

  /** Der Körper der Tabelle, mit `onRowReorder` in einer SortableArea und mit Griffen in den Zeilenköpfen. */
  function renderTableBody() {
    const tableBody = (
      <tbody>
        {rows.map((row, rowIndex) => {
          const rowKeyText = rowKey(row)
          const rowHeaderContent = rowHeader(row)
          const rowCells = renderRowCells(row, rowIndex)
          let extraRowClassName: string | undefined = undefined
          if (rowClassName !== undefined) {
            extraRowClassName = rowClassName(row)
          }
          if (onRowReorder !== undefined) {
            return (
              <SortableMatrixRow
                key={rowKeyText}
                rowKeyText={rowKeyText}
                extraRowClassName={extraRowClassName}
                disabled={isRowReorderDisabled}
                rowHeaderContent={rowHeaderContent}>
                {rowCells}
              </SortableMatrixRow>
            )
          }
          return (
            <tr key={rowKeyText} className={extraRowClassName}>
              <th scope="row" className="matrix-row-head">
                {rowHeaderContent}
              </th>
              {rowCells}
            </tr>
          )
        })}
      </tbody>
    )
    if (onRowReorder === undefined) {
      return tableBody
    }
    return (
      <SortableArea items={rows} itemKey={rowKey} onReorder={onRowReorder}>
        {tableBody}
      </SortableArea>
    )
  }

  function getCellClassNames(row: R, column: C): string {
    let cellClassNames = 'matrix-cell'
    if (cellClassName !== undefined) {
      const extraCellClassName = cellClassName(row, column)
      if (extraCellClassName !== undefined) {
        cellClassNames = cellClassNames + ' ' + extraCellClassName
      }
    }
    return cellClassNames
  }

  return (
    <div
      ref={scrollRef}
      className="matrix-scroll"
      onPointerMove={panHandlers.onPointerMove}
      onPointerUp={panHandlers.onPointerUp}
      onPointerCancel={panHandlers.onPointerCancel}
      onContextMenu={panHandlers.onContextMenu}
      onPointerDown={handleScrollPointerDown}>
      <table className="matrix">
        <thead>
          <tr>
            <th className="matrix-corner">
              {cornerContent !== undefined && <div className="matrix-corner-tools">{cornerContent}</div>}
              <span className="matrix-corner-rows">{rowsLabel}</span>
              <span className="matrix-corner-columns">{columnsLabel}</span>
            </th>
            {columns.map((column) => (
              <th key={columnKey(column)} className="matrix-column-head">
                <span className="matrix-column-head-content">{columnHeader(column)}</span>
              </th>
            ))}
          </tr>
        </thead>
        {renderTableBody()}
      </table>
    </div>
  )
}
