/**
 * Der Anker einer Gleichung in der Adresse einer Seite: `#eq-<guid>`, z. B.
 * `/wissen/physik/…/vierervektoren#eq-3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b`. Mit so einer Adresse lässt sich eine
 * Gleichung von überall verlinken (Nutzer 2026-11-27: „ich möchte die auch verlinken“): Die Seite klappt auf, was die
 * Gleichung verbirgt, rollt zu ihr und hebt sie hervor.
 */
const EQUATION_ANCHOR_PREFIX = 'eq-'

/** Die id des Elements einer Gleichung im Dokument, zugleich ihr Anker ohne das `#`. */
export function getEquationAnchorId(equationGuid: string): string {
  return EQUATION_ANCHOR_PREFIX + equationGuid
}

/** Der Anker einer Gleichung, so wie er in einer Adresse steht. */
export function getEquationHash(equationGuid: string): string {
  return '#' + getEquationAnchorId(equationGuid)
}

/** Die Kennung der Gleichung, die der Anker einer Adresse meint; `null`, wenn er keine Gleichung meint. */
export function readEquationGuidFromHash(hash: string): string | null {
  const anchorStart = '#' + EQUATION_ANCHOR_PREFIX
  if (!hash.startsWith(anchorStart) || hash.length === anchorStart.length) {
    return null
  }
  return hash.slice(anchorStart.length)
}
