/** Ein Ort in einer Skizze, in den Einheiten ihres Achsenkreuzes. */
export type PositionJson = {
  x: number
  y: number
}

/** Ein Element einer Skizze, so wie es gespeichert wird. `highlight` ist ein Platz der Palette (`FIRST` … `FIFTH`). */
export type SketchElementJson =
  | { type: 'POINT'; position: PositionJson; label?: string | null; hintName?: string | null; hintDetail?: string | null }
  | { type: 'SEGMENT'; from: PositionJson; to: PositionJson; label: string; labelSide: 'LEFT' | 'RIGHT'; highlight?: string | null }
  | {
      type: 'ANGLE'
      vertex: PositionJson
      firstLegEnd: PositionJson
      secondLegEnd: PositionJson
      label: string
      hint: string
      highlight?: string | null
    }
  | { type: 'RIGHT_ANGLE'; vertex: PositionJson; firstLegEnd: PositionJson; secondLegEnd: PositionJson }

/** Eine Skizze, so wie sie gespeichert wird: ihr Feld, ihr Achsenkreuz und ihre Elemente in Zeichenreihenfolge. */
export type SketchJson = {
  width: number
  height: number
  originX: number
  originY: number
  unitLength: number
  axisMaxX: number
  axisMaxY: number
  description: string
  elements: SketchElementJson[]
}
