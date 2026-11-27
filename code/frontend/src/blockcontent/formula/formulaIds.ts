/**
 * Die ids an Teilen einer Formel. Ein Teil bekommt seine id im LaTeX als Hülle `\htmlData{id=r1}{…}` (ein Befehl, den
 * die Bibliothek mitbringt); im gesetzten Bild trägt sein Element dann `data-id="r1"`. Eine id gilt innerhalb EINER
 * Formel; dieselbe id darf in einer anderen Formel wieder vorkommen. Vergeben wird sie nur, wo eine Animation den Teil
 * braucht (Nutzer 2026-11-27: „jedem element eine id mitgeben KÖNNEN, genau dann wenn es in eine animation muss“).
 */

/** Die Hülle bis vor ihren Inhalt, z. B. `\htmlData{id=r1}`; die Gruppe ist die id. */
const ID_WRAPPER_PATTERN = /\\htmlData\{\s*id\s*=\s*([A-Za-z][A-Za-z0-9]*)\s*\}/g

/** Eine id: Buchstaben und Ziffern, vorn ein Buchstabe. */
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/

/** Ob sich der Text als id eignet. */
export function isFormulaId(text: string): boolean {
  return ID_PATTERN.test(text)
}

/** Die ids einer Formel in der Reihenfolge, in der sie im LaTeX stehen, jede einmal. */
export function readFormulaIds(latex: string): string[] {
  const formulaIds: string[] = []
  for (const wrapperMatch of latex.matchAll(ID_WRAPPER_PATTERN)) {
    const formulaId = wrapperMatch[1]
    if (!formulaIds.includes(formulaId)) {
      formulaIds.push(formulaId)
    }
  }
  return formulaIds
}

/**
 * Was das Formelfeld einsetzt, damit der markierte Teil diese id bekommt: die Hülle, und an der Stelle `#@` das, was
 * gerade markiert ist.
 */
export function createFormulaIdInsertion(formulaId: string): string {
  return '\\htmlData{id=' + formulaId + '}{#@}'
}

/** Wo die Klammer schließt, die an dieser Stelle öffnet; -1, wenn sie nicht schließt. `\{` und `\}` zählen nicht. */
function findClosingBrace(latex: string, openingBracePosition: number): number {
  let depth = 0
  let position = openingBracePosition
  while (position < latex.length) {
    const character = latex[position]
    if (character === '\\') {
      position = position + 2
      continue
    }
    if (character === '{') {
      depth = depth + 1
    } else if (character === '}') {
      depth = depth - 1
      if (depth === 0) {
        return position
      }
    }
    position = position + 1
  }
  return -1
}

/** Das LaTeX ohne diese id: Die Hülle fällt weg, ihr Inhalt bleibt als Gruppe stehen. Ohne die id bleibt es, wie es ist. */
export function removeFormulaId(latex: string, formulaId: string): string {
  for (const wrapperMatch of latex.matchAll(ID_WRAPPER_PATTERN)) {
    if (wrapperMatch[1] !== formulaId) {
      continue
    }
    const wrapperStart = wrapperMatch.index
    const contentStart = wrapperStart + wrapperMatch[0].length
    if (latex[contentStart] !== '{') {
      continue
    }
    const contentEnd = findClosingBrace(latex, contentStart)
    if (contentEnd < 0) {
      continue
    }
    const latexBefore = latex.slice(0, wrapperStart)
    const contentGroup = latex.slice(contentStart, contentEnd + 1)
    const latexAfter = latex.slice(contentEnd + 1)
    return latexBefore + contentGroup + latexAfter
  }
  return latex
}

/** So findet man im gesetzten Bild das Element eines Teils mit dieser id. */
export function getFormulaIdSelector(formulaId: string): string {
  return '[data-id="' + formulaId + '"]'
}

/** Das Element des Teils mit dieser id in einem gesetzten Bild; `null`, wenn es die id dort nicht gibt. */
export function findFormulaIdElement(formulaContainer: HTMLElement, formulaId: string): HTMLElement | null {
  const formulaIdSelector = getFormulaIdSelector(formulaId)
  return formulaContainer.querySelector<HTMLElement>(formulaIdSelector)
}

/**
 * Das gesetzte Bild, in dem die Teile mit diesen ids als gekürzt gelten (`data-cancelled`): Daran zieht das CSS
 * (animation.css) den Strich durch sie, und der Abspieler einer Animation deckt ihn auf.
 */
export function markCancelledFormulaIds(markup: string, cancelledFormulaIds: string[]): string {
  let markedMarkup = markup
  for (const cancelledFormulaId of cancelledFormulaIds) {
    if (!isFormulaId(cancelledFormulaId)) {
      continue
    }
    const idAttribute = 'data-id="' + cancelledFormulaId + '"'
    const cancelledAttributes = idAttribute + ' data-cancelled="true"'
    markedMarkup = markedMarkup.replaceAll(idAttribute, cancelledAttributes)
  }
  return markedMarkup
}
