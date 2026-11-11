import { useEffect, useState } from 'react'
import type { NaturalSize } from './imageCrop.ts'

/**
 * Die Originalmaße eines Bildes, vorab über ein Image-Objekt geladen, wie in der Vorlage: `null`, bis sie da sind oder
 * wenn das Bild nicht ladbar ist. Der Zuschnitt rechnet in Originalpixeln, die Maße müssen vor der Bühne feststehen.
 */
export function useImageNaturalSize(src: string | null): NaturalSize | null {
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null)

  useEffect(() => {
    if (src === null) {
      setNaturalSize(null)
      return
    }
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (!cancelled) {
        setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight })
      }
    }
    image.onerror = () => {
      if (!cancelled) {
        setNaturalSize(null)
      }
    }
    image.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  return naturalSize
}
