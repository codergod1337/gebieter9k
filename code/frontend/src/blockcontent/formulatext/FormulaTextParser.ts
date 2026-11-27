import type { EquationJson, MarkJson, QuantitiesJson, TermJson } from '../BlockContentJson.ts'
import { HIGHLIGHT_KEYS_BY_DIGIT } from './formulaHighlights.ts'
import { FormulaTextError } from './FormulaTextError.ts'

/** Ein Stück des getippten Texts: eine Zahl, ein Name oder ein Zeichen. */
type FormulaToken = {
  kind: 'NUMBER' | 'NAME' | 'SIGN'
  text: string
  /** Wo das Stück im Text beginnt, ab 0, für Fehlermeldungen. */
  position: number
}

/** Das Zeichen, mit dem eine Marke beginnt (`r#faktor`), und das vor ihrer Farbe (`2#quadrat:5`). */
const MARK_SIGN = '#'
const HIGHLIGHT_SIGN = ':'

/** Das Zeichen vor dem Verweis auf das Ergebnis einer Rechnung, z. B. `@xCoordinate`. */
const RESULT_REFERENCE_SIGN = '@'

/** Die Schreibweisen der Wurzel: das Zeichen oder das Wort. */
const ROOT_SIGN = '√'
const ROOT_WORD = 'sqrt'

/** Das echte Minuszeichen; der Bindestrich gilt genauso. */
const MINUS_SIGN = '−'

/** Alle Zeichen, die für sich stehen. `*` gilt wie `·`. */
const SIGNS = ['+', '-', MINUS_SIGN, '·', '*', '/', '^', '=', '(', ')', '{', '}', ROOT_SIGN, MARK_SIGN, HIGHLIGHT_SIGN, RESULT_REFERENCE_SIGN]

/**
 * Liest eine getippte Formel und macht daraus den Term-Baum des Inhalts (JSON), damit man im Editor Formeln schreibt
 * statt verschachtelter Objekte (Vorschlag vom 2026-11-27, vom Nutzer bestätigt). Die Schreibweise:
 *
 * - `a + b` Summe, `a - b` Differenz, `-a` negativ, `a · b` oder `a * b` Produkt, `a / b` Bruch, `a^2` Potenz, `√(a + b)` oder `sqrt(a + b)` Wurzel;
 * - `cos φ`, `arctan(y / x)`, `f(x)`: ein Name aus mindestens zwei Buchstaben vor einem Term ist eine Funktion, ein
 *   einzelner Buchstabe nur direkt vor einer Klammer;
 * - `( … )` sind sichtbare Klammern. Als Zähler, Nenner, Exponent oder unter der Wurzel fallen sie weg (der Bruchstrich
 *   klammert schon); `{ … }` klammert, ohne dass man es sieht;
 * - der Bruch bindet stärker als das Produkt: `r · x / r` ist r mal (x durch r);
 * - ein Zeichen, das wie eine Größe der Seite aussieht (`x`, `r`, `φ`), IST diese Größe und trägt ihre Farbe;
 * - `#name` gibt einem Term eine Kennung, an der die Rechnung ihn von Zeile zu Zeile verfolgt oder kürzt:
 *   `r#faktor`, `2#quadrat:5` (die Ziffer 1 bis 5 ist die Farbe, 0 keine; ohne Ziffer erbt ein Zeichen die Farbe der
 *   Größe, die so aussieht), `cos#kosinus φ` (der Funktionsname), `√#wurzel(…)` (das Wurzelzeichen);
 * - eine Gleichung ist `links = rechts`; `@name` verweist auf das Ergebnis der Rechnung mit dieser Kennung.
 *
 * Für jeden Text ein eigener Leser. Passt etwas nicht, wirft er einen {@link FormulaTextError}.
 */
export class FormulaTextParser {
  private readonly quantities: QuantitiesJson

  private tokens: FormulaToken[] = []

  private tokenIndex = 0

  /** @param quantities die Größen der Seite: An ihrem Zeichen erkennt der Leser sie im Text */
  constructor(quantities: QuantitiesJson) {
    this.quantities = quantities
  }

  /** Liest eine Gleichung: `links = rechts` oder `@name` (das Ergebnis einer Rechnung). */
  parseEquation(equationText: string): EquationJson {
    this.startReading(equationText)
    const firstToken = this.peekToken()
    if (firstToken !== null && firstToken.text === RESULT_REFERENCE_SIGN) {
      this.takeToken()
      const nameToken = this.takeToken()
      if (nameToken === null || nameToken.kind !== 'NAME') {
        throw new FormulaTextError('Hinter @ fehlt die Kennung der Rechnung.')
      }
      this.requireEnd()
      return { resultOf: nameToken.text }
    }
    const left = this.parseSum()
    this.requireSign('=', 'Es fehlt das Gleichheitszeichen.')
    const right = this.parseSum()
    this.requireEnd()
    return { left, right }
  }

  /** Liest einen einzelnen Term, z. B. den hinter der Notiz einer Umformung („· r“). */
  parseTerm(termText: string): TermJson {
    this.startReading(termText)
    const term = this.parseSum()
    this.requireEnd()
    return term
  }

  private startReading(text: string) {
    this.tokens = this.splitIntoTokens(text)
    this.tokenIndex = 0
    if (this.tokens.length === 0) {
      throw new FormulaTextError('Die Formel ist leer.')
    }
  }

  private splitIntoTokens(text: string): FormulaToken[] {
    const tokens: FormulaToken[] = []
    let position = 0
    while (position < text.length) {
      const character = text[position]
      if (/\s/.test(character)) {
        position = position + 1
        continue
      }
      if (/[0-9]/.test(character)) {
        const numberMatch = /^[0-9]+([.,][0-9]+)?/.exec(text.slice(position))
        const numberText = numberMatch === null ? character : numberMatch[0]
        tokens.push({ kind: 'NUMBER', text: numberText, position })
        position = position + numberText.length
        continue
      }
      if (/\p{L}/u.test(character)) {
        const nameMatch = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(text.slice(position))
        const nameText = nameMatch === null ? character : nameMatch[0]
        tokens.push({ kind: 'NAME', text: nameText, position })
        position = position + nameText.length
        continue
      }
      if (SIGNS.includes(character)) {
        tokens.push({ kind: 'SIGN', text: character, position })
        position = position + 1
        continue
      }
      throw new FormulaTextError('Das Zeichen „' + character + '“ an Stelle ' + (position + 1) + ' kenne ich nicht.')
    }
    return tokens
  }

  private peekToken(): FormulaToken | null {
    if (this.tokenIndex >= this.tokens.length) {
      return null
    }
    return this.tokens[this.tokenIndex]
  }

  private takeToken(): FormulaToken | null {
    const token = this.peekToken()
    if (token !== null) {
      this.tokenIndex = this.tokenIndex + 1
    }
    return token
  }

  private isNextSign(signText: string): boolean {
    const token = this.peekToken()
    return token !== null && token.kind === 'SIGN' && token.text === signText
  }

  private requireSign(signText: string, messageWhenMissing: string) {
    if (!this.isNextSign(signText)) {
      throw new FormulaTextError(messageWhenMissing)
    }
    this.takeToken()
  }

  private requireEnd() {
    const token = this.peekToken()
    if (token !== null) {
      throw new FormulaTextError('Mit „' + token.text + '“ an Stelle ' + (token.position + 1) + ' kann ich hier nichts anfangen.')
    }
  }

  private isNextMinus(): boolean {
    return this.isNextSign('-') || this.isNextSign(MINUS_SIGN)
  }

  /** `a + b - c`: eine Differenz ist eine Summe mit einem negativen Summanden; ein Minus ganz vorn gilt dem ersten Produkt. */
  private parseSum(): TermJson {
    const summands: TermJson[] = []
    if (this.isNextMinus()) {
      this.takeToken()
      summands.push({ type: 'NEGATIVE', term: this.parseProduct() })
    } else {
      summands.push(this.parseProduct())
    }
    while (this.isNextSign('+') || this.isNextMinus()) {
      const negative = this.isNextMinus()
      this.takeToken()
      const product = this.parseProduct()
      if (negative) {
        summands.push({ type: 'NEGATIVE', term: product })
      } else {
        summands.push(product)
      }
    }
    if (summands.length === 1) {
      return summands[0]
    }
    return { type: 'SUM', terms: summands }
  }

  /** `a · b · c` */
  private parseProduct(): TermJson {
    const factors: TermJson[] = [this.parseFraction()]
    while (this.isNextSign('·') || this.isNextSign('*')) {
      this.takeToken()
      factors.push(this.parseFraction())
    }
    if (factors.length === 1) {
      return factors[0]
    }
    return { type: 'PRODUCT', factors }
  }

  /** `a / b`; Klammern um Zähler oder Nenner fallen weg. */
  private parseFraction(): TermJson {
    let fraction = this.parsePower()
    while (this.isNextSign('/')) {
      this.takeToken()
      const denominator = this.parsePower()
      const numeratorWithoutBrackets = this.dropBrackets(fraction)
      const denominatorWithoutBrackets = this.dropBrackets(denominator)
      fraction = { type: 'FRACTION', numerator: numeratorWithoutBrackets, denominator: denominatorWithoutBrackets }
    }
    return fraction
  }

  /** `a^b`; Klammern um den Exponenten fallen weg. */
  private parsePower(): TermJson {
    const base = this.parseOperand()
    if (!this.isNextSign('^')) {
      return base
    }
    this.takeToken()
    const exponent = this.parseOperand()
    const exponentWithoutBrackets = this.dropBrackets(exponent)
    return { type: 'POWER', base, exponent: exponentWithoutBrackets }
  }

  /** Sichtbare Klammern ohne eigene Marke, die nur gruppieren, fallen dort weg, wo die Schreibweise schon klammert. */
  private dropBrackets(term: TermJson): TermJson {
    if (term.type === 'GROUP' && (term.mark === undefined || term.mark === null)) {
      return term.term
    }
    return term
  }

  /** Eine Zahl, ein Zeichen, eine Funktion, eine Wurzel oder etwas in Klammern, jeweils mit ihrer Marke. */
  private parseOperand(): TermJson {
    const token = this.takeToken()
    if (token === null) {
      throw new FormulaTextError('Die Formel hört mittendrin auf.')
    }
    if (token.kind === 'NUMBER') {
      const mark = this.parseOptionalMark(null)
      return this.withMark({ type: 'NUMBER', text: token.text }, mark)
    }
    if (token.kind === 'NAME') {
      if (token.text === ROOT_WORD) {
        return this.parseRoot()
      }
      return this.parseName(token.text)
    }
    if (token.text === ROOT_SIGN) {
      return this.parseRoot()
    }
    // ein Minus an einer Stelle, an der ein Einzelstück steht (`x^-1`, `a · -b`), gilt nur diesem Stück
    if (token.text === '-' || token.text === MINUS_SIGN) {
      return { type: 'NEGATIVE', term: this.parseOperand() }
    }
    if (token.text === '(') {
      const groupedTerm = this.parseSum()
      this.requireSign(')', 'Es fehlt eine schließende Klammer „)“.')
      const mark = this.parseOptionalMark(null)
      return this.withMark({ type: 'GROUP', term: groupedTerm }, mark)
    }
    if (token.text === '{') {
      const innerTerm = this.parseSum()
      this.requireSign('}', 'Es fehlt eine schließende Klammer „}“.')
      const mark = this.parseOptionalMark(null)
      if (mark === null) {
        return innerTerm
      }
      if (innerTerm.type === 'QUANTITY') {
        throw new FormulaTextError('Eine Größe trägt schon ihre eigene Kennung, die Marke #' + mark.key + ' passt dort nicht.')
      }
      return { ...innerTerm, mark }
    }
    throw new FormulaTextError('Mit „' + token.text + '“ an Stelle ' + (token.position + 1) + ' kann ich hier nichts anfangen.')
  }

  /** Die Wurzel: ihre Marke gilt dem Wurzelzeichen; Klammern um das, was darunter steht, fallen weg. */
  private parseRoot(): TermJson {
    const mark = this.parseOptionalMark(null)
    const radicand = this.parseOperand()
    const radicandWithoutBrackets = this.dropBrackets(radicand)
    return this.withMark({ type: 'ROOT', radicand: radicandWithoutBrackets }, mark)
  }

  /**
   * Ein Name: eine Funktion (mindestens zwei Buchstaben vor einem Term, oder ein Buchstabe direkt vor einer Klammer),
   * eine Größe der Seite oder ein Zeichen.
   */
  private parseName(name: string): TermJson {
    const quantityKeys = this.findQuantityKeysBySymbol(name)
    const looksLikeQuantity = quantityKeys.length > 0
    const quantityHighlight = looksLikeQuantity ? this.getQuantityHighlight(quantityKeys[0]) : null
    const mark = this.parseOptionalMark(quantityHighlight)
    // ein einzelner Buchstabe ist nur vor einer Klammer eine Funktion (f(x)), sonst ein Zeichen
    const bracketNext = this.isNextSign('(') || this.isNextSign('{')
    const isFunction = !looksLikeQuantity && ((name.length >= 2 && this.isOperandNext()) || bracketNext)
    if (isFunction) {
      // die Marke einer Funktion gilt ihrem Namen
      const argument = this.parsePower()
      return this.withMark({ type: 'FUNCTION', name, argument }, mark)
    }
    if (mark === null) {
      if (quantityKeys.length === 1) {
        return { type: 'QUANTITY', key: quantityKeys[0] }
      }
      if (quantityKeys.length > 1) {
        throw new FormulaTextError(
          'Das Zeichen „' + name + '“ gehört zu mehreren Größen (' + quantityKeys.join(', ') + '): bitte mit #Kennung sagen, welche.',
        )
      }
      return { type: 'SYMBOL', text: name }
    }
    // „r#radius“ mit der Kennung einer Größe, die so aussieht, ist diese Größe
    if (quantityKeys.includes(mark.key)) {
      return { type: 'QUANTITY', key: mark.key }
    }
    return { type: 'SYMBOL', text: name, mark }
  }

  /** Ob als Nächstes etwas steht, womit ein Term beginnt. */
  private isOperandNext(): boolean {
    const token = this.peekToken()
    if (token === null) {
      return false
    }
    if (token.kind === 'NUMBER' || token.kind === 'NAME') {
      return true
    }
    return token.text === '(' || token.text === '{' || token.text === ROOT_SIGN
  }

  /**
   * Die Marke hinter einem Term: `#name` oder `#name:Ziffer`.
   *
   * @param inheritedHighlight die Farbe, die ohne Ziffer gilt (die der Größe, die so aussieht); `null` ohne
   */
  private parseOptionalMark(inheritedHighlight: string | null): MarkJson | null {
    if (!this.isNextSign(MARK_SIGN)) {
      return null
    }
    this.takeToken()
    const nameToken = this.takeToken()
    if (nameToken === null || nameToken.kind !== 'NAME') {
      throw new FormulaTextError('Hinter # fehlt die Kennung.')
    }
    let highlight = inheritedHighlight
    if (this.isNextSign(HIGHLIGHT_SIGN)) {
      this.takeToken()
      const digitToken = this.takeToken()
      const digitKnown = digitToken !== null && digitToken.kind === 'NUMBER' && digitToken.text in HIGHLIGHT_KEYS_BY_DIGIT
      if (digitToken === null || !digitKnown) {
        throw new FormulaTextError('Hinter #' + nameToken.text + ': steht die Farbe als Ziffer von 0 (keine) bis 5.')
      }
      highlight = HIGHLIGHT_KEYS_BY_DIGIT[digitToken.text]
    }
    return { key: nameToken.text, highlight }
  }

  private withMark<T extends TermJson>(term: T, mark: MarkJson | null): T {
    if (mark === null) {
      return term
    }
    return { ...term, mark }
  }

  /** Die Kennungen der Größen, deren Zeichen genau so aussieht. */
  private findQuantityKeysBySymbol(symbol: string): string[] {
    const quantityKeys: string[] = []
    for (const quantityKey of Object.keys(this.quantities)) {
      if (this.quantities[quantityKey].symbol === symbol) {
        quantityKeys.push(quantityKey)
      }
    }
    return quantityKeys
  }

  private getQuantityHighlight(quantityKey: string): string | null {
    const highlight = this.quantities[quantityKey].highlight
    if (highlight === undefined) {
      return null
    }
    return highlight
  }
}
