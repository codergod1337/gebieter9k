import { useImageZoom } from './useImageZoom.ts'

type ZoomableImageProps = {
  src: string
  alt: string
  /** Optional: wenn der Browser das Bild nicht laden oder nicht anzeigen kann. */
  onError?: () => void
}

/**
 * DAS große Bild, überall gleich (Nutzer 2026-11-26, „wie in jedem etwas besseren Grafikprogramm“): Es steht eingepasst
 * auf die Breite seines Platzes da, nie größer als in Originalgröße. Über einem verkleinerten Bild ist der Mauszeiger
 * die Lupe mit Plus; ein Klick zeigt es in Originalgröße in einem Bereich mit Scrollbalken. Dort zoomt das Mausrad in
 * Schritten zwischen „eingepasst“ und „Originalgröße“, die gedrückte rechte Maustaste verschiebt, ein weiterer Klick
 * passt wieder ein. Die Logik steckt in {@link useImageZoom}.
 *
 * Wie hoch der Bereich der Zoom-Ansicht ist, gibt der Ort vor, an dem das Bild steht: über die CSS-Variable
 * `--zoomable-image-zoomed-height` (base.css). Wer ein anderes Bild zeigt, gibt einen anderen `key` mit, dann beginnt
 * es wieder eingepasst.
 */
export function ZoomableImage({ src, alt, onError }: ZoomableImageProps) {
  const imageZoom = useImageZoom()
  let boxClassName = 'zoomable-image-box'
  if (imageZoom.zoomed) {
    boxClassName = 'zoomable-image-box zoomable-image-box-zoomed'
  } else if (imageZoom.zoomable) {
    boxClassName = 'zoomable-image-box zoomable-image-box-zoomable'
  }
  return (
    <div ref={imageZoom.frameRef} className="zoomable-image">
      <div ref={imageZoom.boxRef} className={boxClassName} {...imageZoom.boxHandlers}>
        <img
          ref={imageZoom.imageRef}
          className="zoomable-image-picture"
          src={src}
          alt={alt}
          draggable={false}
          style={imageZoom.imageStyle}
          onLoad={imageZoom.rememberNaturalSize}
          onClick={imageZoom.toggleZoom}
          onError={onError}
        />
      </div>
    </div>
  )
}
