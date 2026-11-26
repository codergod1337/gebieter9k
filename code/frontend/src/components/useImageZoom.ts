import {
  type CSSProperties,
  type MouseEvent,
  type RefObject,
  type SyntheticEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { NaturalSize } from './imageCrop.ts'
import { useAvailableWidth } from './useAvailableWidth.ts'
import { usePanScroll } from './usePanScroll.ts'

/** Ein Schritt am Mausrad vergrößert bzw. verkleinert das Bild um diesen Faktor. */
const ZOOM_STEP_FACTOR = 1.25

/**
 * So viel Weg am Mausrad ist ein Schritt. Ein Rad mit Raste meldet je Raste etwa so viel; ein Touchpad meldet viele
 * kleine Wege, die zusammengezählt werden. Meldet der Browser Zeilen statt Pixel, zählt eine Zeile so viele Pixel.
 */
const WHEEL_PIXELS_PER_STEP = 100
const WHEEL_PIXELS_PER_LINE = 40

/** Die Griffe fürs Verschieben mit der rechten Maustaste, so wie {@link usePanScroll} sie liefert. */
type PanScrollHandlers = ReturnType<typeof usePanScroll<HTMLDivElement>>['handlers']

/** Ein Punkt des Bildes, der nach dem Zoomen wieder unter dem Mauszeiger stehen soll. */
type ZoomAnchor = {
  /** Der Punkt im Bild, in Originalpixeln. */
  imageX: number
  imageY: number
  /** Wo der Mauszeiger im Fenster steht. */
  pointerClientX: number
  pointerClientY: number
  /** Beim Wechsel in die Zoom-Ansicht: ihren Bereich erst ganz ins Fenster holen. */
  bringBoxIntoView: boolean
}

/** Rückmeldung von {@link useImageZoom}: was {@link ZoomableImage} an seine Elemente hängt. */
export type ImageZoom = {
  /** Für das äußere Element: An seiner Breite wird gemessen, wie viel Platz das Bild hat. */
  frameRef: RefObject<HTMLDivElement | null>
  /** Für das Element direkt um das Bild: In der Zoom-Ansicht rollt es in sich. */
  boxRef: RefObject<HTMLDivElement | null>
  imageRef: RefObject<HTMLImageElement | null>
  /** Ob das Bild breiter ist als sein Platz, also verkleinert dasteht und sich vergrößern lässt. */
  zoomable: boolean
  /** Ob die Zoom-Ansicht offen ist (Bereich mit Scrollbalken). */
  zoomed: boolean
  /** In der Zoom-Ansicht die Maße des Bildes in Pixeln; eingepasst `undefined`, dann macht es das CSS. */
  imageStyle: CSSProperties | undefined
  /** In der Zoom-Ansicht die Griffe fürs Verschieben mit der rechten Maustaste, sonst `undefined`. */
  boxHandlers: PanScrollHandlers | undefined
  rememberNaturalSize: (event: SyntheticEvent<HTMLImageElement>) => void
  toggleZoom: (event: MouseEvent<HTMLImageElement>) => void
}

/**
 * Die Logik von {@link ZoomableImage}, wie in einem Grafikprogramm:
 * - Eingepasst: Das Bild ist so breit wie sein Platz, aber nie größer als in Originalgröße.
 * - Ein Klick auf ein verkleinertes Bild öffnet die Zoom-Ansicht in Originalgröße: ein Bereich mit Scrollbalken. Die
 *   angeklickte Stelle bleibt unter dem Mauszeiger.
 * - Dort zoomt das Mausrad in Schritten zwischen „eingepasst“ und „Originalgröße“, um den Mauszeiger herum; die
 *   gedrückte rechte Maustaste verschiebt das Bild ({@link usePanScroll}).
 * - Ein weiterer Klick passt das Bild wieder ein.
 */
export function useImageZoom(): ImageZoom {
  const availableWidth = useAvailableWidth()
  const panScroll = usePanScroll<HTMLDivElement>()
  const boxRef = panScroll.ref
  const imageRef = useRef<HTMLImageElement>(null)
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null)
  /** Der Maßstab in der Zoom-Ansicht (1 = Originalgröße); `null`: Das Bild steht eingepasst da. */
  const [zoomScale, setZoomScale] = useState<number | null>(null)
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null)
  /** Der Weg am Mausrad, der noch keinen ganzen Schritt ergeben hat. */
  const pendingWheelPixelsRef = useRef<number>(0)

  // der Maßstab, mit dem das Bild genau in die Breite seines Platzes passt; höchstens 1
  let fitScale = 1
  const frameWidth = availableWidth.width
  if (naturalSize !== null && frameWidth !== null && frameWidth > 0 && naturalSize.width > frameWidth) {
    fitScale = frameWidth / naturalSize.width
  }
  const zoomable = fitScale < 1
  let zoomed = false
  let shownScale = fitScale
  if (zoomable && zoomScale !== null) {
    zoomed = true
    shownScale = Math.max(fitScale, zoomScale)
  }

  // Nach jedem Zoomen, vor dem Malen: den gemerkten Punkt des Bildes wieder unter den Mauszeiger rollen
  useLayoutEffect(() => {
    const zoomAnchor = zoomAnchorRef.current
    const box = boxRef.current
    if (zoomAnchor === null || box === null || !zoomed) {
      return
    }
    zoomAnchorRef.current = null
    if (zoomAnchor.bringBoxIntoView) {
      // sofort, nicht weich: Gleich danach wird gemessen, wo der Bereich im Fenster steht
      box.scrollIntoView({ block: 'end', behavior: 'instant' })
    }
    const boxRect = box.getBoundingClientRect()
    const pointerOffsetX = zoomAnchor.pointerClientX - boxRect.left - box.clientLeft
    const pointerOffsetY = zoomAnchor.pointerClientY - boxRect.top - box.clientTop
    box.scrollLeft = zoomAnchor.imageX * shownScale - pointerOffsetX
    box.scrollTop = zoomAnchor.imageY * shownScale - pointerOffsetY
  }, [boxRef, zoomed, shownScale])

  // Das Mausrad zoomt in der Zoom-Ansicht. Als eigener Listener: Nur ein nicht passiver darf das Rollen der Seite
  // unterbinden, React hängt Rad-Ereignisse passiv an.
  useEffect(() => {
    const box = boxRef.current
    if (box === null || !zoomed) {
      return undefined
    }
    const zoomBox = box

    function zoomWithWheel(event: WheelEvent) {
      event.preventDefault()
      const image = imageRef.current
      if (image === null) {
        return
      }
      let wheelPixels = event.deltaY
      if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) {
        wheelPixels = event.deltaY * WHEEL_PIXELS_PER_LINE
      }
      const collectedWheelPixels = pendingWheelPixelsRef.current + wheelPixels
      if (Math.abs(collectedWheelPixels) < WHEEL_PIXELS_PER_STEP) {
        pendingWheelPixelsRef.current = collectedWheelPixels
        return
      }
      pendingWheelPixelsRef.current = 0

      // Rad nach vorn (negativer Weg) vergrößert, nach hinten verkleinert; nie über die beiden Grenzen hinaus
      let changedScale = shownScale / ZOOM_STEP_FACTOR
      if (collectedWheelPixels < 0) {
        changedScale = shownScale * ZOOM_STEP_FACTOR
      }
      changedScale = Math.min(1, changedScale)
      changedScale = Math.max(fitScale, changedScale)
      if (changedScale === shownScale) {
        return
      }
      const imageRect = image.getBoundingClientRect()
      const imageX = (event.clientX - imageRect.left) / shownScale
      const imageY = (event.clientY - imageRect.top) / shownScale
      zoomAnchorRef.current = {
        imageX,
        imageY,
        pointerClientX: event.clientX,
        pointerClientY: event.clientY,
        bringBoxIntoView: false,
      }
      setZoomScale(changedScale)
    }

    zoomBox.addEventListener('wheel', zoomWithWheel, { passive: false })
    return () => {
      zoomBox.removeEventListener('wheel', zoomWithWheel)
    }
  }, [boxRef, zoomed, shownScale, fitScale])

  function rememberNaturalSize(event: SyntheticEvent<HTMLImageElement>) {
    const loadedImage = event.currentTarget
    setNaturalSize({ width: loadedImage.naturalWidth, height: loadedImage.naturalHeight })
  }

  /** Klick aufs Bild: eingepasst → Originalgröße, mit der angeklickten Stelle unter dem Mauszeiger; sonst zurück. */
  function toggleZoom(event: MouseEvent<HTMLImageElement>) {
    if (!zoomable || naturalSize === null) {
      return
    }
    if (zoomed) {
      zoomAnchorRef.current = null
      setZoomScale(null)
      return
    }
    const imageRect = event.currentTarget.getBoundingClientRect()
    const fittedScale = imageRect.width / naturalSize.width
    const imageX = (event.clientX - imageRect.left) / fittedScale
    const imageY = (event.clientY - imageRect.top) / fittedScale
    zoomAnchorRef.current = {
      imageX,
      imageY,
      pointerClientX: event.clientX,
      pointerClientY: event.clientY,
      bringBoxIntoView: true,
    }
    pendingWheelPixelsRef.current = 0
    setZoomScale(1)
  }

  let imageStyle: CSSProperties | undefined = undefined
  let boxHandlers: PanScrollHandlers | undefined = undefined
  if (zoomed && naturalSize !== null) {
    const zoomedWidth = Math.round(naturalSize.width * shownScale)
    const zoomedHeight = Math.round(naturalSize.height * shownScale)
    imageStyle = { width: zoomedWidth + 'px', height: zoomedHeight + 'px' }
    boxHandlers = panScroll.handlers
  }

  return {
    frameRef: availableWidth.ref,
    boxRef,
    imageRef,
    zoomable,
    zoomed,
    imageStyle,
    boxHandlers,
    rememberNaturalSize,
    toggleZoom,
  }
}
