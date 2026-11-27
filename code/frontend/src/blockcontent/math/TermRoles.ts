/**
 * Welche markierten Terme in EINER Zeile einer Herleitung eine besondere Rolle haben. Der Zeichner schreibt sie an die
 * Elemente der Terme, die Herleitung zeigt daran, was mit ihnen geschieht:
 * - gekürzt: Der Term fällt mit der nächsten Umformung weg. Er steht durchgestrichen da, und das bleibt so, wie auf
 *   dem Papier: Man sieht auch später, WO gekürzt wurde.
 * - gebracht: Der Term ist mit der Umformung in diese Zeile gekommen, z. B. das `r` auf beiden Seiten nach „· r“. Beim
 *   Abspielen kommt er aus der Notiz der Umformung.
 */
export class TermRoles {
  /** Die Kennungen der Terme dieser Zeile, die mit der nächsten Umformung gekürzt werden. */
  readonly cancelledTrackingKeys: string[]

  /** Die Kennungen der Terme dieser Zeile, die die Umformung davor gebracht hat. */
  readonly appliedTrackingKeys: string[]

  constructor(cancelledTrackingKeys: string[], appliedTrackingKeys: string[]) {
    this.cancelledTrackingKeys = cancelledTrackingKeys
    this.appliedTrackingKeys = appliedTrackingKeys
  }

  isCancelled(trackingKey: string): boolean {
    return this.cancelledTrackingKeys.includes(trackingKey)
  }

  isApplied(trackingKey: string): boolean {
    return this.appliedTrackingKeys.includes(trackingKey)
  }
}

/** Für jede Formel außerhalb einer Herleitung: Kein Term hat eine besondere Rolle. */
export const NO_TERM_ROLES = new TermRoles([], [])
