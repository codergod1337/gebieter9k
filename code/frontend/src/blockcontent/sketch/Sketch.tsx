import type { ReactNode } from 'react'

type SketchProps = {
  /** Breite und Höhe des Felds in den Einheiten der Skizze; gezeigt wird sie so breit, wie Platz ist. */
  width: number
  height: number
  /** Für Screenreader: was die Skizze zeigt. */
  description: string
  children: ReactNode
}

/**
 * Der Rahmen jeder Skizze in einem Inhalt aus Bausteinen: ein SVG mit festem Feld, in das die Bausteine gezeichnet werden
 * ({@link SketchAxes}, {@link SketchPoint}, {@link SketchSegment}, {@link SketchAngle}). Lage und Maße in base.css
 * (`.sketch`), Farben im Theme.
 */
export function Sketch({ width, height, description, children }: SketchProps) {
  const viewBox = '0 0 ' + width + ' ' + height
  return (
    <svg className="sketch" viewBox={viewBox} role="img" aria-label={description}>
      {children}
    </svg>
  )
}
