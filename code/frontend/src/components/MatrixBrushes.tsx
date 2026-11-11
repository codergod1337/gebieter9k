import { Hoverlay } from './Hoverlay.tsx'

/** Ein Pinsel: der Wert, den er malt. */
export type MatrixBrush<V> = {
  value: V
  /** kurz, steht auf dem Knopf, z. B. × */
  label: string
  /** im Hoverlay, z. B. „Pinsel: verleihen“ */
  hint: string
}

type MatrixBrushesProps<V> = {
  brushes: MatrixBrush<V>[]
  value: V
  onChange: (value: V) => void
}

/** Die Pinsel einer Matrix, oben in der Ecke (`cornerContent`), wie in der Vorlage. Genau einer ist gewählt. */
export function MatrixBrushes<V>({ brushes, value, onChange }: MatrixBrushesProps<V>) {
  return (
    <div className="matrix-brushes" role="radiogroup" aria-label="Pinsel">
      {brushes.map((brush) => {
        const isSelected = Object.is(brush.value, value)
        let brushClassName = 'matrix-brush'
        if (isSelected) {
          brushClassName = 'matrix-brush active'
        }
        return (
          <Hoverlay key={brush.label} text={brush.hint}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={brush.hint}
              className={brushClassName}
              onClick={() => onChange(brush.value)}>
              {brush.label}
            </button>
          </Hoverlay>
        )
      })}
    </div>
  )
}
