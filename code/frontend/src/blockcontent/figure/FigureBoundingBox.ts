/**
 * Der Ausschnitt einer Figur in ihren eigenen Koordinaten: welcher x-Wert am linken und am rechten Rand liegt, welcher
 * y-Wert oben und unten. Gespeichert als Liste `[left, top, right, bottom]`, in der Reihenfolge der Bibliothek.
 */
export type FigureBoundingBox = {
  left: number
  top: number
  right: number
  bottom: number
}
