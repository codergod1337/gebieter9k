import { type MouseEvent, type ReactNode, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { ColumnResizeHandle } from './ColumnResizeHandle.tsx'
import { Hoverlay } from './Hoverlay.tsx'
import { SortableArea } from './SortableArea.tsx'
import { type TableColumn, tableColumnKeyOf } from './TableColumn.ts'
import { TableColumnSettingsPopup } from './TableColumnSettingsPopup.tsx'
import { columnWidthPx, columnWidthsPx, fittingColumns } from './tableColumnWidths.ts'
import { useAvailableWidth } from './useAvailableWidth.ts'
import { useIsMobile } from './useIsMobile.ts'
import { useSortableItem } from './useSortableItem.tsx'
import { useTableUsersSettings } from './useTableUsersSettings.ts'

export type { TableColumn } from './TableColumn.ts'

type TableProps<T> = {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Inhalt der Aktionsspalte ganz rechts, z. B. der DeleteButton */
  actions?: (row: T) => ReactNode
  /** Titel des Detail-Popups, z. B. der Name des Feldes */
  detailTitle: (row: T) => ReactNode
  /** Text, wenn es keine Zeilen gibt */
  emptyText: string
  /** Macht die Zeilen per Drag and Drop verschiebbar (Griff ganz links). Bekommt die Zeilen in neuer Reihenfolge. */
  onReorder?: (reorderedRows: T[]) => void
  /** Sperrt den Griff, z. B. solange eine neue Reihenfolge gespeichert wird */
  reorderDisabled?: boolean
  /** Breite der Aktionsspalte beim festen Layout. Standard: Platz für zwei Knöpfe. */
  actionsWidth?: string
  /**
   * Die Kennung der Tabelle für die Einstellungen des Users: Mit ihr merkt sich die Tabelle je User die gezogenen
   * Spaltenbreiten und die ausgeblendeten unwichtigen Spalten als eigene Einstellung `TABLE_<Kennung>`. Nach der
   * Key-Regel, z. B. `SOLR_FIELD`. Ohne Kennung gibt es weder Ziehen noch Ausblenden.
   */
  settingKey?: string
}

/** Die Breite der ersten Spalte mit dem Griff im festen Layout, wenn sie selbst keine nennt. */
const DRAG_COLUMN_DEFAULT_WIDTH = '5rem'

type RowProps<T> = {
  row: T
  columns: TableColumn<T>[]
  actions?: (row: T) => ReactNode
  /** sobald eine Spalte fehlt: Tipp auf die Zeile öffnet die Details */
  onOpenDetails?: () => void
}

/** Die Zellen einer Zeile. Mit dragHandle sitzt der Griff in der ersten Spalte, links vom Inhalt. */
function RowCells<T>({ row, columns, actions, dragHandle }: RowProps<T> & { dragHandle?: ReactNode }) {
  return (
    <>
      {columns.map((column, index) => {
        const columnKey = tableColumnKeyOf(column)
        const cellContent = column.cell(row)
        if (dragHandle !== undefined && index === 0) {
          return (
            <td key={columnKey} className="drag-cell">
              <span className="drag-cell-inner">
                {dragHandle}
                <span>{cellContent}</span>
              </span>
            </td>
          )
        }
        return (
          <td key={columnKey} className={column.cellClassName}>
            {cellContent}
          </td>
        )
      })}
      {actions !== undefined && (
        // Aktionen öffnen nicht zusätzlich das Detail-Popup
        <td className="actions-cell text-end text-nowrap" onClick={(event) => event.stopPropagation()}>
          {actions(row)}
        </td>
      )}
    </>
  )
}

/**
 * Ein Klick in der Zeile öffnet die Details nur, wenn er kein Bedienelement trifft: Ein Knopf, eine Checkbox oder ein
 * Link in einer Zelle tut sein Eigenes, ohne dass zusätzlich das Detail-Popup aufgeht.
 */
function createRowClickHandler(onOpenDetails: (() => void) | undefined) {
  if (onOpenDetails === undefined) {
    return undefined
  }
  return (event: MouseEvent<HTMLTableRowElement>) => {
    const clickedElement = event.target as HTMLElement
    const clickedControl = clickedElement.closest('button, input, select, textarea, a, label')
    if (clickedControl !== null) {
      return
    }
    onOpenDetails()
  }
}

function StaticRow<T>(props: RowProps<T>) {
  let rowClassName: string | undefined = undefined
  if (props.onOpenDetails !== undefined) {
    rowClassName = 'details-trigger'
  }
  const rowClickHandler = createRowClickHandler(props.onOpenDetails)
  return (
    <tr className={rowClassName} onClick={rowClickHandler}>
      <RowCells {...props} />
    </tr>
  )
}

/** Zeile mit Griff in der ersten Spalte, daran lässt sie sich mit Maus, Finger oder Tastatur verschieben. */
function SortableRow<T>({ id, disabled, ...props }: RowProps<T> & { id: string; disabled: boolean }) {
  const sortableItem = useSortableItem(id, disabled)
  const rowClassNames = ['sortable-row']
  if (sortableItem.isDragging) {
    rowClassNames.push('sortable-row-dragging')
  }
  if (props.onOpenDetails !== undefined) {
    rowClassNames.push('details-trigger')
  }
  const rowClassName = rowClassNames.join(' ')
  const rowClickHandler = createRowClickHandler(props.onOpenDetails)
  return (
    <tr ref={sortableItem.ref} style={sortableItem.style} className={rowClassName} onClick={rowClickHandler}>
      <RowCells {...props} dragHandle={sortableItem.dragHandle} />
    </tr>
  )
}

/**
 * Die Tabelle für alle Listen, aus der Vorlage übernommen: Kopfzeile, Zeilen im Wechsel, ganz rechts die Aktionen.
 * Die Breite misst {@link useAvailableWidth}, welche Spalten passen und wie breit jede wird, rechnet
 * `tableColumnWidths.ts`: gezogene Spalten bleiben exakt, alle anderen teilen sich den Rest, unwichtige fallen bei
 * Platzmangel von rechts weg. Die Einstellungen des Users hält {@link useTableUsersSettings} (Breiten, ausgeblendete
 * Spalten), gezogen wird am rechten Rand eines Kopfs ({@link ColumnResizeHandle}), das Zahnrad im ersten Kopf öffnet die
 * Spalteneinstellungen. Ein Stern am Kopf zeigt jede gezogene Spalte. Eine Erklärung je Spalte (`headerHint`) zeigt das
 * Hoverlay am Kopf, beim Zeigen oder Anklicken. Fehlt eine Spalte, zeigt ein Tipp auf die Zeile alle Spalten im Popup.
 * Mit `onReorder` lassen sich die Zeilen per Drag and Drop verschieben.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  actions,
  detailTitle,
  emptyText,
  onReorder,
  reorderDisabled = false,
  actionsWidth = '6rem',
  settingKey,
}: TableProps<T>) {
  const isMobile = useIsMobile()
  const { ref: containerRef, width: availableWidth } = useAvailableWidth()
  const tableUsersSettings = useTableUsersSettings(settingKey)
  const { adjustable, settingName, settings, setColumnWidth, toggleHidden, resetWidths, resetAll } = tableUsersSettings
  const [detailRow, setDetailRow] = useState<T | null>(null)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  /** die Breite der Spalte, die gerade gezogen wird, in Pixel, bis zum Loslassen */
  const [draftWidth, setDraftWidth] = useState<{ columnKey: string; widthPx: number } | null>(null)

  // die Spalten, wie der User sie eingestellt hat: ausgeblendete unwichtige weg, gezogene Breiten statt der aus dem Code
  const shownColumns = columns.filter((column) => {
    const columnKey = tableColumnKeyOf(column)
    const hiddenByUsers = column.unimportant === true && settings.hidden.includes(columnKey)
    return !hiddenByUsers
  })
  const configuredColumns = shownColumns.map((column) => {
    const columnKey = tableColumnKeyOf(column)
    if (draftWidth !== null && draftWidth.columnKey === columnKey) {
      return { ...column, width: draftWidth.widthPx + 'px' }
    }
    const savedWidthRem = settings.widths[columnKey]
    if (savedWidthRem === undefined) {
      return column
    }
    return { ...column, width: savedWidthRem + 'rem' }
  })
  const fixedLayout = configuredColumns.some((column) => column.width !== undefined)

  // die Spalten, die der User gezogen hat: ihre Breite ist fix, alle anderen teilen sich den Rest
  const savedWidthColumnKeys = Object.keys(settings.widths)
  const fixedKeys = new Set(savedWidthColumnKeys)
  if (draftWidth !== null) {
    fixedKeys.add(draftWidth.columnKey)
  }
  let actionsPx = 0
  if (actions !== undefined && availableWidth !== null) {
    actionsPx = columnWidthPx(actionsWidth, availableWidth)
  }
  let firstColumnFallbackWidth: string | undefined = undefined
  if (onReorder !== undefined) {
    firstColumnFallbackWidth = DRAG_COLUMN_DEFAULT_WIDTH
  }

  let visibleColumns = configuredColumns
  if (fixedLayout && availableWidth !== null) {
    visibleColumns = fittingColumns(configuredColumns, fixedKeys, availableWidth, actionsPx, firstColumnFallbackWidth)
  } else if (!fixedLayout && isMobile) {
    visibleColumns = configuredColumns.filter((column) => column.unimportant !== true)
  }
  const columnsHidden = visibleColumns.length < columns.length
  let columnCount = visibleColumns.length
  if (actions !== undefined) {
    columnCount = columnCount + 1
  }
  // jede Breite in Pixel, die Summe genau die Zeile: dann verteilt der Browser nichts mehr um
  let widthsPx: number[] | null = null
  let tableStyle: { width: string } | undefined = undefined
  if (fixedLayout && availableWidth !== null) {
    widthsPx = columnWidthsPx(visibleColumns, fixedKeys, availableWidth, actionsPx, firstColumnFallbackWidth)
    const columnWidthSumPx = widthsPx.reduce((sum, widthPx) => sum + widthPx, 0)
    const tableWidthPx = columnWidthSumPx + actionsPx
    tableStyle = { width: tableWidthPx + 'px' }
  }

  /** Der Spaltenkopf, mit Hoverlay, wenn es eine Erklärung gibt: beim Zeigen oder Anklicken. */
  function headerOf(column: TableColumn<T>): ReactNode {
    if (column.headerHint === undefined) {
      return column.header
    }
    return (
      <Hoverlay text={column.headerHint}>
        <span className="table-header-hinted" tabIndex={0}>
          {column.header}
        </span>
      </Hoverlay>
    )
  }

  /** Der Stern am Kopf einer gezogenen Spalte: ihre Breite steht fest, sie füllt nicht mehr auf. */
  function fixedWidthMarkerOf(columnKey: string): ReactNode {
    if (!adjustable || !fixedLayout || !fixedKeys.has(columnKey)) {
      return null
    }
    return (
      <Hoverlay text="Diese Breite hast du gezogen, sie bleibt fest.">
        <span className="th-fixed-width">*</span>
      </Hoverlay>
    )
  }

  function handleSettingsClick() {
    setSettingsOpen(true)
  }

  let settingsButton: ReactNode = null
  if (adjustable) {
    settingsButton = (
      <Hoverlay text="Spalten einstellen">
        <button type="button" className="table-settings-button" aria-label="Spalten einstellen" onClick={handleSettingsClick}>
          <i className="bi bi-gear" aria-hidden="true"></i>
        </button>
      </Hoverlay>
    )
  }

  function renderHeaderCell(column: TableColumn<T>, index: number) {
    const columnKey = tableColumnKeyOf(column)
    const headerClassNames: string[] = []
    if (onReorder !== undefined && index === 0) {
      headerClassNames.push('drag-cell')
    }
    if (column.verticalHeader === true) {
      headerClassNames.push('th-vertical')
    }
    let headerClassName: string | undefined = undefined
    if (headerClassNames.length > 0) {
      headerClassName = headerClassNames.join(' ')
    }
    const headerContent = headerOf(column)
    const fixedWidthMarker = fixedWidthMarkerOf(columnKey)
    let headerInner: ReactNode
    if (index === 0 && settingsButton !== null && column.verticalHeader !== true) {
      // der Einstellungsknopf sitzt in der ersten Kopfzelle, rechts vom Text
      headerInner = (
        <span className="th-first-inner">
          <span className="th-first-text">{headerContent}</span>
          {fixedWidthMarker}
          {settingsButton}
        </span>
      )
    } else if (column.verticalHeader === true) {
      headerInner = (
        <>
          <span className="th-vertical-text">{headerContent}</span>
          {fixedWidthMarker}
          {index === 0 && settingsButton}
        </>
      )
    } else {
      headerInner = (
        <>
          {headerContent}
          {fixedWidthMarker}
        </>
      )
    }

    function handleResizing(widthPx: number) {
      setDraftWidth({ columnKey, widthPx })
    }

    function handleResized(widthRem: number) {
      setDraftWidth(null)
      setColumnWidth(columnKey, widthRem)
    }

    return (
      <th key={columnKey} className={headerClassName}>
        {headerInner}
        {adjustable && fixedLayout && <ColumnResizeHandle onResizing={handleResizing} onResized={handleResized} />}
      </th>
    )
  }

  function renderRow(row: T) {
    const key = rowKey(row)
    let onOpenDetails: (() => void) | undefined = undefined
    if (columnsHidden) {
      onOpenDetails = () => setDetailRow(row)
    }
    if (onReorder !== undefined) {
      return (
        <SortableRow
          key={key}
          id={key}
          disabled={reorderDisabled}
          row={row}
          columns={visibleColumns}
          actions={actions}
          onOpenDetails={onOpenDetails}
        />
      )
    }
    return <StaticRow key={key} row={row} columns={visibleColumns} actions={actions} onOpenDetails={onOpenDetails} />
  }

  let tableClassName = 'table table-striped table-hover align-middle mb-0 data-table'
  if (fixedLayout) {
    tableClassName = tableClassName + ' data-table-fixed'
  }

  const tableBody = (
    <tbody>
      {rows.map(renderRow)}
      {rows.length === 0 && (
        <tr>
          <td colSpan={columnCount}>{emptyText}</td>
        </tr>
      )}
    </tbody>
  )

  const table = (
    <table className={tableClassName} style={tableStyle}>
      {fixedLayout && (
        <colgroup>
          {visibleColumns.map((column, index) => {
            // vor der ersten Messung die Breiten aus dem Code; die Spalte mit dem Griff braucht dabei eine
            let colWidth = column.width
            if (widthsPx !== null) {
              colWidth = widthsPx[index] + 'px'
            } else if (colWidth === undefined && onReorder !== undefined && index === 0) {
              colWidth = DRAG_COLUMN_DEFAULT_WIDTH
            }
            let colStyle: { width: string } | undefined = undefined
            if (colWidth !== undefined) {
              colStyle = { width: colWidth }
            }
            const columnKey = tableColumnKeyOf(column)
            return <col key={columnKey} style={colStyle} />
          })}
          {actions !== undefined && <col style={{ width: actionsWidth }} />}
        </colgroup>
      )}
      <thead>
        <tr>
          {visibleColumns.map(renderHeaderCell)}
          {actions !== undefined && <th className="actions-cell"></th>}
        </tr>
      </thead>
      {onReorder !== undefined && (
        <SortableArea items={rows} itemKey={rowKey} onReorder={onReorder}>
          {tableBody}
        </SortableArea>
      )}
      {onReorder === undefined && tableBody}
    </table>
  )

  const hideableColumns = columns
    .filter((column) => column.unimportant === true)
    .map((column) => ({ key: tableColumnKeyOf(column), header: column.header }))
  const hasWidths = savedWidthColumnKeys.length > 0

  return (
    <>
      <div ref={containerRef} className="data-table-container">
        {table}
      </div>
      {detailRow !== null && (
        <Modal show onHide={() => setDetailRow(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{detailTitle(detailRow)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <dl className="details-list">
              {columns.map((column) => (
                <div key={tableColumnKeyOf(column)}>
                  <dt>{headerOf(column)}</dt>
                  <dd>{column.cell(detailRow)}</dd>
                </div>
              ))}
            </dl>
          </Modal.Body>
          {actions !== undefined && (
            // Nach einer Aktion (z. B. Löschen mit eigener Sicherheitsabfrage) schließt das Detail-Popup
            <Modal.Footer onClick={() => setDetailRow(null)}>{actions(detailRow)}</Modal.Footer>
          )}
        </Modal>
      )}
      {adjustable && settingName !== null && settingsOpen && (
        <TableColumnSettingsPopup
          onClose={() => setSettingsOpen(false)}
          settingName={settingName}
          hideableColumns={hideableColumns}
          hidden={settings.hidden}
          hasWidths={hasWidths}
          onToggleHidden={toggleHidden}
          onResetWidths={resetWidths}
          onResetAll={resetAll}
        />
      )}
    </>
  )
}
