import { type MouseEvent, type PointerEvent, useRef } from 'react'

/** Wo das Verschieben begann: Mausposition und Scrollstand des Containers. */
type PanStart = {
  pointerX: number
  pointerY: number
  scrollLeft: number
  scrollTop: number
}

/**
 * Verschieben mit gedrückter rechter Maustaste, für Flächen, die breiter und höher als das Fenster sind (Matrix), wie
 * in der Vorlage. Der Container scrollt in sich selbst. Das Kontextmenü ist dort aus, sonst ginge es beim Loslassen auf.
 *
 *   const { ref, handlers } = usePanScroll<HTMLDivElement>()
 *   <div ref={ref} {...handlers}>…</div>
 */
export function usePanScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const panStartRef = useRef<PanStart | null>(null)

  function onPointerDown(event: PointerEvent<T>) {
    const container = ref.current
    const isRightMouseButton = event.button === 2
    if (!isRightMouseButton || container === null) {
      return
    }
    panStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    }
    container.setPointerCapture(event.pointerId)
    container.classList.add('panning')
  }

  function onPointerMove(event: PointerEvent<T>) {
    const container = ref.current
    const panStart = panStartRef.current
    if (panStart === null || container === null) {
      return
    }
    const movedX = event.clientX - panStart.pointerX
    const movedY = event.clientY - panStart.pointerY
    container.scrollLeft = panStart.scrollLeft - movedX
    container.scrollTop = panStart.scrollTop - movedY
  }

  function stopPan(event: PointerEvent<T>) {
    const container = ref.current
    if (panStartRef.current === null || container === null) {
      return
    }
    panStartRef.current = null
    container.releasePointerCapture(event.pointerId)
    container.classList.remove('panning')
  }

  function onContextMenu(event: MouseEvent<T>) {
    event.preventDefault()
  }

  return {
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopPan,
      onPointerCancel: stopPan,
      onContextMenu,
    },
  }
}
