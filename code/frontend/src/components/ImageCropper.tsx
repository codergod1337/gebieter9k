import { type PointerEvent, type ReactNode, useEffect, useState } from 'react'
import { clampCrop, clampFreeCrop, type ImageCrop, maximalCrop, type NaturalSize } from './imageCrop.ts'

type ImageCropperProps = {
  src: string
  /** Die Originalmaße, der Aufrufer misst sie vorab (useImageNaturalSize). */
  naturalSize: NaturalSize | null
  /** Das erzwungene Verhältnis Breite zu Höhe, 1 für ein Quadrat; `null`: frei, das Seitenverhältnis wählt der User. */
  aspectRatio: number | null
  value: ImageCrop | null
  /** Bei jedem Zug, schon begrenzt; der Aufrufer nimmt beim Bestätigen den letzten Wert. */
  onChange: (changedCrop: ImageCrop) => void
  /** So viel Platz hat die Bühne, gemessen vom Aufrufer (useAvailableSize). */
  maxWidth: number
  maxHeight: number
  hint?: ReactNode
}

type DragMode = 'draw' | 'move' | 'corner'

type ImagePoint = {
  x: number
  y: number
}

/**
 * Der Zuschnitt eines Bildes, aus der Vorlage übernommen: mit erzwungenem Verhältnis ist die Bühne das Maximal-Rechteck,
 * der Rand außerhalb des Bildes ein Schachbrett; frei (ohne Verhältnis) ist die Bühne das Bild selbst. Start ist das ganze
 * Bild; ein kleineres Rechteck aufziehen, verschieben oder an den Ecken anpassen. Jeder Kandidat läuft durch den
 * Begrenzer (clampCrop bzw. clampFreeCrop).
 * <p>
 * Anders als in der Vorlage über Pointer-Ereignisse statt Maus-Ereignissen: So geht es auch mit dem Finger, und weil die
 * Bühne den Zeiger festhält (setPointerCapture), bricht ein Zug nicht ab, wenn er über den Rand hinausgeht.
 */
export function ImageCropper({ src, naturalSize, aspectRatio, value, onChange, maxWidth, maxHeight, hint }: ImageCropperProps) {
  const [dragMode, setDragMode] = useState<DragMode | null>(null)
  const [anchor, setAnchor] = useState<ImagePoint | null>(null)
  const [moveStart, setMoveStart] = useState<{ point: ImagePoint; crop: ImageCrop } | null>(null)
  const [stageElement, setStageElement] = useState<HTMLDivElement | null>(null)

  /** Das ganze Bild als Ausschnitt: Start und, ohne festes Verhältnis, auch die Bühne. */
  function fullImageCrop(size: NaturalSize, ratio: number | null): ImageCrop {
    if (ratio === null) {
      return { x1: 0, y1: 0, x2: size.width, y2: size.height }
    }
    return maximalCrop(size.width, size.height, ratio)
  }

  let stage: ImageCrop | null = null
  if (naturalSize !== null) {
    stage = fullImageCrop(naturalSize, aspectRatio)
  }
  let stageWidth = 0
  let stageHeight = 0
  if (stage !== null) {
    stageWidth = stage.x2 - stage.x1
    stageHeight = stage.y2 - stage.y1
  }

  // Start: der bestehende Zuschnitt durch den Begrenzer, sonst das ganze Bild
  useEffect(() => {
    if (naturalSize === null) {
      return
    }
    if (value === null) {
      const fullCrop = fullImageCrop(naturalSize, aspectRatio)
      onChange(fullCrop)
    } else {
      const repairedCrop = limitCrop(value)
      onChange(repairedCrop)
    }
    // nur beim Bekanntwerden der Maße oder einem neuen Verhältnis, nicht bei jedem Zug
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naturalSize, aspectRatio])

  function limitCrop(candidate: ImageCrop): ImageCrop {
    if (naturalSize === null) {
      return candidate
    }
    if (aspectRatio === null) {
      return clampFreeCrop(candidate, naturalSize.width, naturalSize.height)
    }
    return clampCrop(candidate, naturalSize.width, naturalSize.height, aspectRatio)
  }

  /** Zeigerposition in Originalpixeln, auf die Bühne geklemmt. */
  function toImagePoint(event: PointerEvent<HTMLDivElement>): ImagePoint | null {
    if (stageElement === null || stage === null) {
      return null
    }
    const stageRect = stageElement.getBoundingClientRect()
    if (stageRect.width <= 0 || stageRect.height <= 0) {
      return null
    }
    const shareX = Math.max(0, Math.min(1, (event.clientX - stageRect.left) / stageRect.width))
    const shareY = Math.max(0, Math.min(1, (event.clientY - stageRect.top) / stageRect.height))
    return { x: stage.x1 + shareX * stageWidth, y: stage.y1 + shareY * stageHeight }
  }

  /** Nahe einer Ecke? Dann bleibt beim Ziehen die gegenüberliegende fest. */
  function findOppositeCorner(point: ImagePoint, threshold: number): ImagePoint | null {
    if (value === null) {
      return null
    }
    const corners = [
      { x: value.x1, y: value.y1, opposite: { x: value.x2, y: value.y2 } },
      { x: value.x2, y: value.y1, opposite: { x: value.x1, y: value.y2 } },
      { x: value.x1, y: value.y2, opposite: { x: value.x2, y: value.y1 } },
      { x: value.x2, y: value.y2, opposite: { x: value.x1, y: value.y1 } },
    ]
    for (const corner of corners) {
      const nearCorner = Math.abs(point.x - corner.x) < threshold && Math.abs(point.y - corner.y) < threshold
      if (nearCorner) {
        return corner.opposite
      }
    }
    return null
  }

  /** Ausschnitt aus festem Anker und Zeigerposition, Verhältnis erzwungen, danach begrenzt. */
  function cropFromAnchor(fixedAnchor: ImagePoint, point: ImagePoint): ImageCrop {
    if (aspectRatio === null) {
      return limitCrop({ x1: fixedAnchor.x, y1: fixedAnchor.y, x2: point.x, y2: point.y })
    }
    const deltaX = point.x - fixedAnchor.x
    const deltaY = point.y - fixedAnchor.y
    let cropWidth: number
    let cropHeight: number
    if (Math.abs(deltaX) / aspectRatio > Math.abs(deltaY)) {
      cropWidth = Math.abs(deltaX)
      cropHeight = cropWidth / aspectRatio
    } else {
      cropHeight = Math.abs(deltaY)
      cropWidth = cropHeight * aspectRatio
    }
    let x1 = fixedAnchor.x
    if (deltaX < 0) {
      x1 = fixedAnchor.x - cropWidth
    }
    let y1 = fixedAnchor.y
    if (deltaY < 0) {
      y1 = fixedAnchor.y - cropHeight
    }
    return limitCrop({ x1, y1, x2: x1 + cropWidth, y2: y1 + cropHeight })
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    const point = toImagePoint(event)
    if (point === null) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    const cornerThreshold = stageWidth * 0.05
    const oppositeCorner = findOppositeCorner(point, cornerThreshold)
    if (oppositeCorner !== null) {
      setDragMode('corner')
      setAnchor(oppositeCorner)
      return
    }
    const insideCrop = value !== null && point.x >= value.x1 && point.x <= value.x2 && point.y >= value.y1 && point.y <= value.y2
    if (insideCrop && value !== null) {
      setDragMode('move')
      setMoveStart({ point, crop: { ...value } })
    } else {
      setDragMode('draw')
      setAnchor(point)
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragMode === null) {
      return
    }
    const point = toImagePoint(event)
    if (point === null) {
      return
    }
    if ((dragMode === 'draw' || dragMode === 'corner') && anchor !== null) {
      const drawnCrop = cropFromAnchor(anchor, point)
      onChange(drawnCrop)
    } else if (dragMode === 'move' && moveStart !== null) {
      const deltaX = point.x - moveStart.point.x
      const deltaY = point.y - moveStart.point.y
      const movedCrop = {
        x1: moveStart.crop.x1 + deltaX,
        y1: moveStart.crop.y1 + deltaY,
        x2: moveStart.crop.x2 + deltaX,
        y2: moveStart.crop.y2 + deltaY,
      }
      const limitedCrop = limitCrop(movedCrop)
      onChange(limitedCrop)
    }
  }

  function handlePointerUp() {
    if (dragMode === null) {
      return
    }
    setDragMode(null)
    setAnchor(null)
    setMoveStart(null)
    if (value !== null) {
      const limitedCrop = limitCrop(value)
      onChange(limitedCrop)
    }
  }

  if (stage === null) {
    return <div className="image-cropper-stage" />
  }

  // die Bühne aus beiden Grenzen, nie größer als der Platz
  let stageAspectRatio = stageWidth / stageHeight
  if (aspectRatio !== null) {
    stageAspectRatio = aspectRatio
  }
  const stagePixelWidth = Math.max(1, Math.min(maxWidth, maxHeight * stageAspectRatio))
  const stagePixelHeight = stagePixelWidth / stageAspectRatio
  let cropPercent: { x: number; y: number; width: number; height: number } | null = null
  if (value !== null) {
    cropPercent = {
      x: ((value.x1 - stage.x1) / stageWidth) * 100,
      y: ((value.y1 - stage.y1) / stageHeight) * 100,
      width: ((value.x2 - value.x1) / stageWidth) * 100,
      height: ((value.y2 - value.y1) / stageHeight) * 100,
    }
  }
  let naturalWidth = 0
  let naturalHeight = 0
  if (naturalSize !== null) {
    naturalWidth = naturalSize.width
    naturalHeight = naturalSize.height
  }
  const imageStyle = {
    position: 'absolute' as const,
    left: ((0 - stage.x1) / stageWidth) * 100 + '%',
    top: ((0 - stage.y1) / stageHeight) * 100 + '%',
    width: (naturalWidth / stageWidth) * 100 + '%',
    height: (naturalHeight / stageHeight) * 100 + '%',
  }
  let stageCursor = 'crosshair'
  if (dragMode === 'move') {
    stageCursor = 'grabbing'
  } else if (dragMode === 'corner') {
    stageCursor = 'nwse-resize'
  }
  const stageStyle = { width: stagePixelWidth + 'px', height: stagePixelHeight + 'px', cursor: stageCursor }

  return (
    <div className="d-flex flex-column gap-2 align-items-center">
      {hint !== undefined && <p className="text-body-secondary small mb-0 align-self-start">{hint}</p>}
      <div
        ref={setStageElement}
        className="image-cropper-stage image-cropper-stage-ready"
        style={stageStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}>
        <img src={src} alt="" draggable={false} style={imageStyle} />
        {cropPercent !== null && (
          <>
            <div
              className="image-cropper-mask"
              style={{
                clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${cropPercent.y}%, ${cropPercent.x}% ${cropPercent.y}%, ${cropPercent.x}% ${cropPercent.y + cropPercent.height}%, ${cropPercent.x + cropPercent.width}% ${cropPercent.y + cropPercent.height}%, ${cropPercent.x + cropPercent.width}% ${cropPercent.y}%, 0% ${cropPercent.y}%)`,
              }}
            />
            <div
              className="image-cropper-frame"
              style={{ left: cropPercent.x + '%', top: cropPercent.y + '%', width: cropPercent.width + '%', height: cropPercent.height + '%' }}
            />
            {[
              { left: cropPercent.x, top: cropPercent.y },
              { left: cropPercent.x + cropPercent.width, top: cropPercent.y },
              { left: cropPercent.x, top: cropPercent.y + cropPercent.height },
              { left: cropPercent.x + cropPercent.width, top: cropPercent.y + cropPercent.height },
            ].map((handlePosition) => (
              <div
                key={handlePosition.left + '-' + handlePosition.top}
                className="image-cropper-handle"
                style={{ left: handlePosition.left + '%', top: handlePosition.top + '%' }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
