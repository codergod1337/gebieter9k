/** Höchstens so viele Stellen nach dem Komma zeigt eine Skizze. */
const SKETCH_NUMBER_MAX_FRACTION_DIGITS = 2

/** Eine Zahl so, wie eine Skizze sie zeigt: deutsch mit Komma, ohne überflüssige Nullen, z. B. `4` oder `36,87`. */
export function formatSketchNumber(value: number): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: SKETCH_NUMBER_MAX_FRACTION_DIGITS })
}
