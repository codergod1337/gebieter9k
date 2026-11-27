import type { ReactNode } from 'react'
import { getMathHighlightClassName } from '../math/getMathHighlightClassName.ts'
import { Sketch } from '../sketch/Sketch.tsx'
import { SketchAngle } from '../sketch/SketchAngle.tsx'
import { SketchAxes } from '../sketch/SketchAxes.tsx'
import { SketchPoint } from '../sketch/SketchPoint.tsx'
import { SketchRightAngle } from '../sketch/SketchRightAngle.tsx'
import { SketchSegment } from '../sketch/SketchSegment.tsx'
import type { KnowledgeSketch, KnowledgeSketchElement } from './KnowledgeSketch.ts'

type KnowledgeSketchViewProps = {
  sketch: KnowledgeSketch
}

/**
 * Zeichnet die Skizze einer Seite aus ihren Bausteinen (`knowledge/sketch/`): das Achsenkreuz mit Raster, Nullpunkt und
 * der 1 an beiden Achsen, darüber die Elemente in ihrer Reihenfolge. Jede Größe trägt die Farbe ihrer Marke, dieselbe
 * wie in den Formeln der Seite.
 */
export function KnowledgeSketchView({ sketch }: KnowledgeSketchViewProps) {
  const coordinateSystem = sketch.coordinateSystem

  function renderElement(element: KnowledgeSketchElement, elementIndex: number): ReactNode {
    if (element.type === 'POINT') {
      let hintDetail: string | undefined = undefined
      if (element.hintDetail !== null) {
        hintDetail = element.hintDetail
      }
      return (
        <SketchPoint
          key={elementIndex}
          coordinateSystem={coordinateSystem}
          position={element.position}
          label={element.label}
          hintName={element.hintName}
          hintDetail={hintDetail}
        />
      )
    }
    if (element.type === 'SEGMENT') {
      const highlightClassName = getMathHighlightClassName(element.highlightKey)
      return (
        <SketchSegment
          key={elementIndex}
          coordinateSystem={coordinateSystem}
          fromPosition={element.fromPosition}
          toPosition={element.toPosition}
          label={element.label}
          labelSide={element.labelSide}
          highlightClassName={highlightClassName}
        />
      )
    }
    if (element.type === 'ANGLE') {
      const highlightClassName = getMathHighlightClassName(element.highlightKey)
      return (
        <SketchAngle
          key={elementIndex}
          coordinateSystem={coordinateSystem}
          vertexPosition={element.vertexPosition}
          firstLegEndPosition={element.firstLegEndPosition}
          secondLegEndPosition={element.secondLegEndPosition}
          label={element.label}
          hintText={element.hintText}
          highlightClassName={highlightClassName}
        />
      )
    }
    return (
      <SketchRightAngle
        key={elementIndex}
        coordinateSystem={coordinateSystem}
        vertexPosition={element.vertexPosition}
        firstLegEndPosition={element.firstLegEndPosition}
        secondLegEndPosition={element.secondLegEndPosition}
      />
    )
  }

  return (
    <Sketch width={sketch.width} height={sketch.height} description={sketch.description}>
      <SketchAxes coordinateSystem={coordinateSystem} maxX={sketch.axisMaxX} maxY={sketch.axisMaxY} />
      {sketch.elements.map(renderElement)}
    </Sketch>
  )
}
