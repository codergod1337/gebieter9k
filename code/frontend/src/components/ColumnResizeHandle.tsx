import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MIN_COLUMN_REM, remToPx, rootFontSizePx } from './tableColumnWidths.ts'

type ColumnResizeHandleProps = {
  /** während des Ziehens, die Breite in Pixel */
  onResizing: (widthPx: number) => void
  /** beim Loslassen, die Breite in rem auf eine Stelle gerundet */
  onResized: (widthRem: number) => void
}

/** Die Anzeige während des Ziehens: die Breite der Spalte und wo der Mauszeiger ist */
type ResizeReadout = {
  widthPx: number
  x: number
  y: number
}

/** Abstand der Anzeige zum Mauszeiger, damit sie ihn nicht verdeckt */
const READOUT_OFFSET_PX = 14

/**
 * Der Griff am rechten Rand eines Spaltenkopfs, wie in der Vorlage: Ziehen mit Maus oder Stift ändert die Breite der
 * Spalte, der Kopf ist das Elternelement. Solange gezogen wird, steht am Mauszeiger die aktuelle Breite in Pixel und rem.
 */
export function ColumnResizeHandle({ onResizing, onResized }: ColumnResizeHandleProps) {
  const [readout, setReadout] = useState<ResizeReadout | null>(null)
  /** räumt die Fenster-Listener eines laufenden Zugs ab, auch wenn die Tabelle mitten im Zug verschwindet */
  const stopDragging = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      const stopRunningDrag = stopDragging.current
      if (stopRunningDrag !== null) {
        stopRunningDrag()
      }
    }
  }, [])

  function startResizing(event: ReactPointerEvent<HTMLSpanElement>) {
    const header = event.currentTarget.parentElement
    if (header === null) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const headerRect = header.getBoundingClientRect()
    const startWidthPx = headerRect.width
    const minWidthPx = remToPx(MIN_COLUMN_REM)

    function widthAt(clientX: number): number {
      const draggedWidthPx = startWidthPx + clientX - startX
      return Math.max(minWidthPx, draggedWidthPx)
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      const widthPx = widthAt(moveEvent.clientX)
      onResizing(widthPx)
      setReadout({ widthPx, x: moveEvent.clientX, y: moveEvent.clientY })
    }

    function handlePointerUp(upEvent: PointerEvent) {
      const stopRunningDrag = stopDragging.current
      if (stopRunningDrag !== null) {
        stopRunningDrag()
      }
      const widthPx = widthAt(upEvent.clientX)
      const widthRem = widthPx / rootFontSizePx()
      const roundedWidthRem = Math.round(widthRem * 10) / 10
      onResized(roundedWidthRem)
    }

    stopDragging.current = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      stopDragging.current = null
      setReadout(null)
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    setReadout({ widthPx: startWidthPx, x: event.clientX, y: event.clientY })
  }

  let readoutElement = null
  if (readout !== null) {
    const readoutStyle = { top: readout.y + READOUT_OFFSET_PX, left: readout.x + READOUT_OFFSET_PX }
    const readoutWidthPxText = String(Math.round(readout.widthPx))
    const readoutWidthRem = readout.widthPx / rootFontSizePx()
    const readoutWidthRemText = readoutWidthRem.toFixed(1)
    const readoutText = readoutWidthPxText + ' px · ' + readoutWidthRemText + ' rem'
    readoutElement = createPortal(
      <span className="th-resize-readout" role="status" style={readoutStyle}>
        {readoutText}
      </span>,
      document.body,
    )
  }

  return (
    <>
      <span className="th-resize-handle" aria-hidden="true" onPointerDown={startResizing} />
      {readoutElement}
    </>
  )
}
