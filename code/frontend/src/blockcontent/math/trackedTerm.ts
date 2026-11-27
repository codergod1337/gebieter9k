/**
 * So findet man im Dokument die Elemente markierter Terme: Der Zeichner ({@link MathTermReactRenderer}) schreibt die
 * Kennung einer Marke als Attribut `data-tracking-key` an das Element des Terms.
 */
export const TRACKED_TERM_SELECTOR = '[data-tracking-key]'

/** Die Kennung am Element eines markierten Terms; `null`, wenn das Element keine trägt. */
export function readTrackingKey(trackedElement: HTMLElement): string | null {
  const trackingKey = trackedElement.dataset.trackingKey
  if (trackingKey === undefined) {
    return null
  }
  return trackingKey
}
