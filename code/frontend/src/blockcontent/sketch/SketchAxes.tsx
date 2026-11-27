import type { ReactNode } from 'react'
import type { SketchCoordinateSystem } from './SketchCoordinateSystem.ts'

type SketchAxesProps = {
  coordinateSystem: SketchCoordinateSystem
  /** Bis zu welchem Wert die x-Achse und die y-Achse gezeichnet sind; das Raster und die Teilstriche reichen so weit. */
  maxX: number
  maxY: number
}

/** So weit ragen die Achsen über den Nullpunkt hinaus nach links und unten, in Einheiten des gezeichneten Systems. */
const AXIS_OVERHANG_UNITS = 0.45

/** Länge und halbe Breite der Pfeilspitze, halbe Länge eines Teilstrichs: in Einheiten der Skizze. */
const ARROW_LENGTH = 11
const ARROW_HALF_WIDTH = 5
const TICK_HALF_LENGTH = 4

/**
 * Das Achsenkreuz einer Skizze, in jeder Skizze gleich (Nutzer 2026-11-27: „jede skizze hat einen nullpunkt und eine 1
 * reinskaliert“): ein feines Raster, beide Achsen mit Pfeil und Namen, an jeder ganzen Zahl ein Teilstrich, beschriftet
 * sind der Nullpunkt mit „0“ und auf jeder Achse die „1“. So sieht man den Maßstab, ohne dass Zahlen die Skizze füllen.
 */
export function SketchAxes({ coordinateSystem, maxX, maxY }: SketchAxesProps) {
  const originX = coordinateSystem.toSketchX(0)
  const originY = coordinateSystem.toSketchY(0)
  const xAxisStartX = coordinateSystem.toSketchX(-AXIS_OVERHANG_UNITS)
  const xAxisEndX = coordinateSystem.toSketchX(maxX)
  const yAxisStartY = coordinateSystem.toSketchY(-AXIS_OVERHANG_UNITS)
  const yAxisEndY = coordinateSystem.toSketchY(maxY)

  // Raster und Teilstriche an jeder ganzen Zahl, die noch vor der Pfeilspitze liegt
  const gridLines: ReactNode[] = []
  const ticks: ReactNode[] = []
  for (let xValue = 1; xValue < maxX; xValue = xValue + 1) {
    const sketchX = coordinateSystem.toSketchX(xValue)
    const gridKey = 'gridX' + xValue
    const tickKey = 'tickX' + xValue
    gridLines.push(<line key={gridKey} className="sketch-grid-line" x1={sketchX} y1={originY} x2={sketchX} y2={yAxisEndY} />)
    ticks.push(
      <line key={tickKey} className="sketch-axis-tick" x1={sketchX} y1={originY - TICK_HALF_LENGTH} x2={sketchX} y2={originY + TICK_HALF_LENGTH} />,
    )
  }
  for (let yValue = 1; yValue < maxY; yValue = yValue + 1) {
    const sketchY = coordinateSystem.toSketchY(yValue)
    const gridKey = 'gridY' + yValue
    const tickKey = 'tickY' + yValue
    gridLines.push(<line key={gridKey} className="sketch-grid-line" x1={originX} y1={sketchY} x2={xAxisEndX} y2={sketchY} />)
    ticks.push(
      <line key={tickKey} className="sketch-axis-tick" x1={originX - TICK_HALF_LENGTH} y1={sketchY} x2={originX + TICK_HALF_LENGTH} y2={sketchY} />,
    )
  }

  // die Pfeilspitzen
  const xArrowBackX = xAxisEndX - ARROW_LENGTH
  const xArrowPoints =
    xAxisEndX + ',' + originY + ' ' + xArrowBackX + ',' + (originY - ARROW_HALF_WIDTH) + ' ' + xArrowBackX + ',' + (originY + ARROW_HALF_WIDTH)
  const yArrowBackY = yAxisEndY + ARROW_LENGTH
  const yArrowPoints =
    originX + ',' + yAxisEndY + ' ' + (originX - ARROW_HALF_WIDTH) + ',' + yArrowBackY + ' ' + (originX + ARROW_HALF_WIDTH) + ',' + yArrowBackY

  const unitSketchX = coordinateSystem.toSketchX(1)
  const unitSketchY = coordinateSystem.toSketchY(1)

  return (
    <g className="sketch-axes">
      {gridLines}
      <line className="sketch-axis" x1={xAxisStartX} y1={originY} x2={xArrowBackX} y2={originY} />
      <polygon className="sketch-axis-arrow" points={xArrowPoints} />
      <line className="sketch-axis" x1={originX} y1={yAxisStartY} x2={originX} y2={yArrowBackY} />
      <polygon className="sketch-axis-arrow" points={yArrowPoints} />
      {ticks}
      <text className="sketch-axis-name" x={xAxisEndX - 2} y={originY + 22}>
        x
      </text>
      <text className="sketch-axis-name" x={originX - 16} y={yAxisEndY + 8}>
        y
      </text>
      <text className="sketch-axis-number" x={originX - 11} y={originY + 17}>
        0
      </text>
      <text className="sketch-axis-number" x={unitSketchX} y={originY + 19}>
        1
      </text>
      <text className="sketch-axis-number" x={originX - 12} y={unitSketchY + 5}>
        1
      </text>
    </g>
  )
}
