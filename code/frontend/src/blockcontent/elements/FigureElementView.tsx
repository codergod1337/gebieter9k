import { FigureView } from '../figure/FigureView.tsx'
import type { ElementViewProps } from './ElementViewProps.ts'

/** Eine Figur im Inhalt: eine Skizze oder ein Plot ({@link FigureView}). */
export function FigureElementView({ element }: ElementViewProps<'FIGURE'>) {
  return (
    <div className="blockcontent-figure">
      <FigureView code={element.code} boundingBox={element.boundingBox} aspectRatio={element.aspectRatio} />
    </div>
  )
}
