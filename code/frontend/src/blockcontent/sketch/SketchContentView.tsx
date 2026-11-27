import type { ReactNode } from 'react'
import { getSketchHighlightClassName } from './getSketchHighlightClassName.ts'
import { Sketch } from './Sketch.tsx'
import { SketchAngle } from './SketchAngle.tsx'
import { SketchAxes } from './SketchAxes.tsx'
import { SketchPoint } from './SketchPoint.tsx'
import { SketchRightAngle } from './SketchRightAngle.tsx'
import { SketchSegment } from './SketchSegment.tsx'
import type { SketchContent, SketchElement } from './SketchContent.ts'

type SketchContentViewProps = {
  sketch: SketchContent
}

/**
 * Zeichnet eine Skizze aus ihren Bausteinen (`blockcontent/sketch/`): das Achsenkreuz mit Raster, Nullpunkt und der 1 an
 * beiden Achsen, darüber die Elemente in ihrer Reihenfolge. Eine Strecke oder ein Winkel trägt die Farbe, die an ihm steht
 * (ein Platz der Palette des Themes).
 */
export function SketchContentView({ sketch }: SketchContentViewProps) {
  const coordinateSystem = sketch.coordinateSystem

  function renderElement(element: SketchElement, elementIndex: number): ReactNode {
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
      const highlightClassName = getSketchHighlightClassName(element.highlightKey)
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
      const highlightClassName = getSketchHighlightClassName(element.highlightKey)
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
