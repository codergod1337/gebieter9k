/** Ein Stück eines Texts mit Auszeichnung, so wie es getippt ist: Die Formel ist hier noch ihr Text. */
export type InlineMarkupNode =
  | { type: 'TEXT'; text: string }
  | { type: 'BOLD'; children: InlineMarkupNode[] }
  | { type: 'ITALIC'; children: InlineMarkupNode[] }
  | { type: 'LINK'; address: string; children: InlineMarkupNode[] }
  | { type: 'FORMULA'; formulaText: string }

/** Das Zeichen, das dem nächsten Zeichen seine Bedeutung nimmt: `\*` ist ein Stern, kein Beginn von kursiv. */
const ESCAPE_SIGN = '\\'
const BOLD_MARKER = '**'
const ITALIC_MARKER = '*'
const FORMULA_MARKER = '$'

/**
 * Liest die Auszeichnung in einem Text (Absatz, Hinweis, Punkt einer Liste), so wie man sie tippt:
 *
 * - `**fett**`, `*kursiv*` (auch ineinander),
 * - `[Text](Adresse)` ein Link,
 * - `$r · cos φ$` eine Formel mitten im Satz, in der Schreibweise der getippten Formeln,
 * - `\` vor einem dieser Zeichen nimmt ihm die Bedeutung.
 *
 * Nachsichtig: Was nicht geschlossen ist (ein einzelner Stern, eine offene Klammer), bleibt einfach Text. So zeigt die
 * Vorschau beim Tippen nie einen Fehler, nur weil das zweite Sternchen noch fehlt. Kein HTML: Heraus kommen nur diese
 * Stücke, alles andere ist Text.
 */
export class InlineMarkupParser {
  parse(text: string): InlineMarkupNode[] {
    const nodes: InlineMarkupNode[] = []
    let plainText = ''
    let position = 0

    function closePlainText() {
      if (plainText !== '') {
        nodes.push({ type: 'TEXT', text: plainText })
        plainText = ''
      }
    }

    while (position < text.length) {
      const character = text[position]
      const escapedCharacterFollows = character === ESCAPE_SIGN && position + 1 < text.length
      if (escapedCharacterFollows) {
        plainText = plainText + text[position + 1]
        position = position + 2
        continue
      }
      if (character === FORMULA_MARKER) {
        const formulaEnd = this.findMarker(text, FORMULA_MARKER, position + 1)
        if (formulaEnd > position + 1) {
          closePlainText()
          const formulaText = text.slice(position + 1, formulaEnd)
          nodes.push({ type: 'FORMULA', formulaText })
          position = formulaEnd + 1
          continue
        }
      }
      if (text.startsWith(BOLD_MARKER, position)) {
        const boldStart = position + BOLD_MARKER.length
        const boldEnd = this.findMarker(text, BOLD_MARKER, boldStart)
        if (boldEnd > boldStart) {
          closePlainText()
          const boldText = text.slice(boldStart, boldEnd)
          nodes.push({ type: 'BOLD', children: this.parse(boldText) })
          position = boldEnd + BOLD_MARKER.length
          continue
        }
      }
      if (character === ITALIC_MARKER) {
        const italicEnd = this.findSingleItalicMarker(text, position + 1)
        if (italicEnd > position + 1) {
          closePlainText()
          const italicText = text.slice(position + 1, italicEnd)
          nodes.push({ type: 'ITALIC', children: this.parse(italicText) })
          position = italicEnd + 1
          continue
        }
      }
      if (character === '[') {
        const labelEnd = this.findMarker(text, ']', position + 1)
        const addressOpens = labelEnd > position && text[labelEnd + 1] === '('
        if (addressOpens) {
          const addressEnd = text.indexOf(')', labelEnd + 2)
          if (addressEnd > labelEnd + 2) {
            closePlainText()
            const labelText = text.slice(position + 1, labelEnd)
            const address = text.slice(labelEnd + 2, addressEnd).trim()
            nodes.push({ type: 'LINK', address, children: this.parse(labelText) })
            position = addressEnd + 1
            continue
          }
        }
      }
      plainText = plainText + character
      position = position + 1
    }
    closePlainText()
    return nodes
  }

  /** Wo das Zeichen ab dieser Stelle das nächste Mal steht, ohne `\` davor; -1, wenn nirgends. */
  private findMarker(text: string, marker: string, fromPosition: number): number {
    let position = fromPosition
    while (position < text.length) {
      if (text[position] === ESCAPE_SIGN) {
        position = position + 2
        continue
      }
      if (text.startsWith(marker, position)) {
        return position
      }
      position = position + 1
    }
    return -1
  }

  /** Wo ein einzelner Stern steht, der kursiv schließt: Doppelsterne (fett darin) zählen nicht. */
  private findSingleItalicMarker(text: string, fromPosition: number): number {
    let position = fromPosition
    while (position < text.length) {
      if (text[position] === ESCAPE_SIGN) {
        position = position + 2
        continue
      }
      if (text.startsWith(BOLD_MARKER, position)) {
        position = position + BOLD_MARKER.length
        continue
      }
      if (text[position] === ITALIC_MARKER) {
        return position
      }
      position = position + 1
    }
    return -1
  }
}
