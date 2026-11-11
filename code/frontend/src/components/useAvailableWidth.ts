import { type RefObject, useLayoutEffect, useRef, useState } from 'react'

/**
 * Die Breite eines Elements, gemessen mit einem ResizeObserver wie in der Vorlage: `null` bis zur ersten Messung, danach
 * bei jeder Änderung des Fensters oder der Seite aktuell. Der Aufrufer hängt `ref` an das Element, dessen Breite zählt.
 */
export function useAvailableWidth(): { ref: RefObject<HTMLDivElement | null>; width: number | null } {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (element === null || typeof ResizeObserver === 'undefined') {
      return
    }
    // der Observer meldet sich auch gleich beim Anlegen, das ist die erste Messung
    const resizeObserver = new ResizeObserver((entries) => {
      let measuredWidth = element.clientWidth
      const firstEntry = entries[0]
      if (firstEntry !== undefined) {
        measuredWidth = firstEntry.contentRect.width
      }
      setWidth((currentWidth) => (currentWidth === measuredWidth ? currentWidth : measuredWidth))
    })
    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [])

  return { ref, width }
}
