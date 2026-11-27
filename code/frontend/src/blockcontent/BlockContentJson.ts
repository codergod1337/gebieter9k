/**
 * Die Form des Inhalts als JSON (Fassung 1), so wie er gespeichert wird und wie der Editor ihn bearbeitet. Der
 * {@link BlockContentReader} prüft beim Lesen jedes Stück selbst; diese Typen beschreiben nur, was der Editor schreibt.
 * Das Format steht in `docu/blockcontent.md`.
 */

/** Die Marke eines Terms: seine Kennung über die Zeilen einer Rechnung hinweg und seine Farbe (`FIRST` … `FIFTH`). */
export type MarkJson = {
  key: string
  highlight?: string | null
}

export type TermJson =
  | { type: 'QUANTITY'; key: string }
  | { type: 'SYMBOL'; text: string; mark?: MarkJson | null }
  | { type: 'NUMBER'; text: string; mark?: MarkJson | null }
  | { type: 'SUM'; terms: TermJson[]; mark?: MarkJson | null }
  | { type: 'PRODUCT'; factors: TermJson[]; mark?: MarkJson | null }
  | { type: 'FRACTION'; numerator: TermJson; denominator: TermJson; mark?: MarkJson | null }
  | { type: 'POWER'; base: TermJson; exponent: TermJson; mark?: MarkJson | null }
  | { type: 'ROOT'; radicand: TermJson; mark?: MarkJson | null }
  | { type: 'FUNCTION'; name: string; argument: TermJson; mark?: MarkJson | null }
  | { type: 'GROUP'; term: TermJson; mark?: MarkJson | null }
  | { type: 'NEGATIVE'; term: TermJson; mark?: MarkJson | null }

/** Eine Gleichung: ausgeschrieben oder als Verweis auf das Ergebnis einer Rechnung der Seite. */
export type EquationJson = { left: TermJson; right: TermJson } | { resultOf: string }

/** Eine Größe der Seite: ihr Zeichen und ihre Farbe. */
export type QuantityJson = {
  symbol: string
  highlight?: string | null
}

/** Die Größen der Seite, je Kennung eine. */
export type QuantitiesJson = Record<string, QuantityJson>

export type OperationJson = {
  notation?: string | null
  operand?: TermJson | null
  applies?: string[]
  cancels?: string[]
}

export type DerivationStepJson = {
  equation: EquationJson
  operation?: OperationJson | null
  explanation?: string | null
}

export type BoxPartJson =
  | { type: 'PARAGRAPH'; text: string }
  | { type: 'HINT'; text: string }
  | { type: 'LIST'; ordered?: boolean; items: string[] }
  | { type: 'EQUATIONS'; heading?: string | null; equations: EquationJson[] }

/** Ein Ort in einer Skizze, in den Einheiten ihres Achsenkreuzes. */
export type PositionJson = {
  x: number
  y: number
}

export type SketchElementJson =
  | { type: 'POINT'; position: PositionJson; label?: string | null; hintName?: string | null; hintDetail?: string | null }
  | { type: 'SEGMENT'; from: PositionJson; to: PositionJson; label: string; labelSide: 'LEFT' | 'RIGHT'; quantity?: string | null }
  | {
      type: 'ANGLE'
      vertex: PositionJson
      firstLegEnd: PositionJson
      secondLegEnd: PositionJson
      label: string
      hint: string
      quantity?: string | null
    }
  | { type: 'RIGHT_ANGLE'; vertex: PositionJson; firstLegEnd: PositionJson; secondLegEnd: PositionJson }

/** Eine Skizze: ihr Feld, ihr Achsenkreuz und ihre Elemente in Zeichenreihenfolge. */
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

export type BlockJson =
  | { type: 'BOX'; title: string; parts: BoxPartJson[]; sketch?: SketchJson | null }
  | { type: 'DERIVATION'; key: string; title: string; steps: DerivationStepJson[] }

export type BlockContentJson = {
  quantities?: QuantitiesJson
  blocks: BlockJson[]
}
