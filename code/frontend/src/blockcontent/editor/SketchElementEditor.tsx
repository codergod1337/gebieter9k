import type { ElementEditorProps } from './ElementEditorProps.ts'
import { SketchEditor } from './SketchEditor.tsx'

/** Eine Skizze im Editor: ihr Feld, ihr Achsenkreuz und ihre Elemente als Liste ({@link SketchEditor}). */
export function SketchElementEditor({ element, onChange }: ElementEditorProps<'SKETCH'>) {
  return <SketchEditor sketch={element.sketch} onChange={(changedSketch) => onChange({ ...element, sketch: changedSketch })} />
}
