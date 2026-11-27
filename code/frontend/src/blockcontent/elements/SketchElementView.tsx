import { SketchContentView } from '../sketch/SketchContentView.tsx'
import type { ElementViewProps } from './ElementViewProps.ts'

/** Eine Skizze im Inhalt. */
export function SketchElementView({ element }: ElementViewProps<'SKETCH'>) {
  return (
    <div className="blockcontent-sketch">
      <SketchContentView sketch={element.sketch} />
    </div>
  )
}
