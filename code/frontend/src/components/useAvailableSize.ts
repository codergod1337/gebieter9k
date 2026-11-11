import { useCallback, useLayoutEffect, useState } from 'react'

/** Breite und Höhe eines Elements in Pixeln. */
export type AvailableSize = {
  width: number
  height: number
}

/**
 * Breite und Höhe eines Elements, gemessen mit einem ResizeObserver, wie in der Vorlage: `null` bis zur ersten Messung.
 * `ref` ist eine Callback-Ref: Ein Popup zeichnet seinen Inhalt erst beim Öffnen, der Beobachter hängt sich an, sobald
 * das Element da ist.
 */
export function useAvailableSize(): { ref: (element: HTMLDivElement | null) => void; size: AvailableSize | null } {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [size, setSize] = useState<AvailableSize | null>(null)
  const ref = useCallback((node: HTMLDivElement | null) => setElement(node), [])

  useLayoutEffect(() => {
    if (element === null || typeof ResizeObserver === 'undefined') {
      setSize(null)
      return
    }
    const resizeObserver = new ResizeObserver((entries) => {
      let width = element.clientWidth
      let height = element.clientHeight
      const firstEntry = entries[0]
      if (firstEntry !== undefined) {
        width = firstEntry.contentRect.width
        height = firstEntry.contentRect.height
      }
      setSize((currentSize) => {
        const unchanged = currentSize !== null && currentSize.width === width && currentSize.height === height
        if (unchanged) {
          return currentSize
        }
        return { width, height }
      })
    })
    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [element])

  return { ref, size }
}
