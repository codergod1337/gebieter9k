import type { EquationJson, MarkJson, QuantitiesJson, TermJson } from '../BlockContentJson.ts'
import { getHighlightDigit } from './formulaHighlights.ts'

/**
 * Schreibt den Term-Baum des Inhalts (JSON) als getippte Formel, in genau der Schreibweise, die der
 * {@link FormulaTextParser} liest: Was der Schreiber ausgibt, liest der Leser wieder zum selben Baum. So zeigt der
 * Editor eine gespeicherte Formel als Text, den man ändern kann.
 */
export class FormulaTextPrinter {
  private readonly quantities: QuantitiesJson

  /** @param quantities die Größen der Seite: Eine Größe steht im Text nur mit ihrem Zeichen */
  constructor(quantities: QuantitiesJson) {
    this.quantities = quantities
  }

  /** Eine Gleichung als `links = rechts`, ein Verweis auf das Ergebnis einer Rechnung als `@name`. */
  printEquation(equation: EquationJson): string {
    if ('resultOf' in equation) {
      return '@' + equation.resultOf
    }
    return this.printSum(equation.left) + ' = ' + this.printSum(equation.right)
  }

  printTerm(term: TermJson): string {
    return this.printSum(term)
  }

  /** Ein Term dort, wo eine Summe stehen darf: alles ohne Klammern. */
  private printSum(term: TermJson): string {
    if (term.type === 'SUM' && !this.hasMark(term)) {
      let sumText = ''
      term.terms.forEach((summand, summandIndex) => {
        const negative = summand.type === 'NEGATIVE' && !this.hasMark(summand)
        if (negative && summand.type === 'NEGATIVE') {
          // an erster Stelle ein Minus direkt davor, sonst als Rechenzeichen
          sumText = sumText + (summandIndex === 0 ? '-' : ' - ') + this.printProduct(summand.term)
        } else {
          sumText = sumText + (summandIndex === 0 ? '' : ' + ') + this.printProduct(summand)
        }
      })
      return sumText
    }
    if (term.type === 'NEGATIVE' && !this.hasMark(term)) {
      return '-' + this.printProduct(term.term)
    }
    return this.printProduct(term)
  }

  /** Ein Term dort, wo ein Produkt stehen darf: eine Summe darin bekommt unsichtbare Klammern. */
  private printProduct(term: TermJson): string {
    if (term.type === 'PRODUCT' && !this.hasMark(term)) {
      const factorTexts = term.factors.map((factor) => this.printFraction(factor))
      return factorTexts.join(' · ')
    }
    return this.printFraction(term)
  }

  /** Ein Term dort, wo ein Bruch stehen darf. Zähler und Nenner mit mehreren Teilen stehen in Klammern, die der Leser wieder wegnimmt. */
  private printFraction(term: TermJson): string {
    if (term.type === 'FRACTION' && !this.hasMark(term)) {
      const numeratorText = this.printFractionPart(term.numerator)
      const denominatorText = this.printFractionPart(term.denominator)
      return numeratorText + ' / ' + denominatorText
    }
    return this.printPower(term)
  }

  private printFractionPart(term: TermJson): string {
    const isSimple = this.isSimpleOperand(term)
    if (isSimple && term.type !== 'GROUP') {
      return this.printPower(term)
    }
    // sichtbare Klammern im Zähler oder Nenner brauchen ein zweites Paar: Das äußere nimmt der Leser weg
    return '(' + this.printSum(term) + ')'
  }

  /** Ein Term dort, wo eine Potenz stehen darf. */
  private printPower(term: TermJson): string {
    if (term.type === 'POWER' && !this.hasMark(term)) {
      const baseText = this.printOperand(term.base)
      let exponentText = this.printOperand(term.exponent)
      const exponentNeedsBrackets = !this.isSimpleOperand(term.exponent) || term.exponent.type === 'GROUP'
      if (exponentNeedsBrackets) {
        exponentText = '(' + this.printSum(term.exponent) + ')'
      }
      return baseText + '^' + exponentText
    }
    return this.printOperand(term)
  }

  /** Ob der Term für sich stehen kann, ohne dass man ihn klammern muss. */
  private isSimpleOperand(term: TermJson): boolean {
    if (this.hasMark(term)) {
      return true
    }
    return term.type === 'QUANTITY' || term.type === 'SYMBOL' || term.type === 'NUMBER' || term.type === 'GROUP' || term.type === 'ROOT'
  }

  /** Ein Term als Einzelstück; was mehrere Teile hat, bekommt unsichtbare Klammern `{ … }`. */
  private printOperand(term: TermJson): string {
    switch (term.type) {
      case 'QUANTITY':
        return this.printQuantity(term.key)
      case 'SYMBOL':
        return term.text + this.printMark(term.mark, this.getHighlightOfSymbol(term.text))
      case 'NUMBER':
        return term.text + this.printMark(term.mark, null)
      case 'GROUP':
        return '(' + this.printSum(term.term) + ')' + this.printMark(term.mark, null)
      case 'ROOT':
        return '√' + this.printMark(term.mark, null) + '(' + this.printSum(term.radicand) + ')'
      case 'FUNCTION': {
        const nameText = term.name + this.printMark(term.mark, null)
        const argument = term.argument
        if (argument.type === 'GROUP') {
          return nameText + this.printOperand(argument)
        }
        // ein Funktionsname aus einem Buchstaben wird nur vor einer Klammer als Funktion gelesen
        const nameIsWord = term.name.length >= 2
        const argumentFitsBare = this.isSimpleOperand(argument) || (argument.type === 'POWER' && !this.hasMark(argument))
        if (nameIsWord && argumentFitsBare) {
          return nameText + ' ' + this.printPower(argument)
        }
        return nameText + ' {' + this.printSum(argument) + '}'
      }
      case 'NEGATIVE':
        if (!this.hasMark(term)) {
          return '-' + this.printOperand(term.term)
        }
        return '{-' + this.printOperand(term.term) + '}' + this.printMark(term.mark, null)
      default: {
        // Summe, Produkt, Bruch, Potenz an einer Stelle, an der nur ein Einzelstück stehen darf, oder mit eigener Marke
        const unmarkedTerm = { ...term, mark: null } as TermJson
        return '{' + this.printSum(unmarkedTerm) + '}' + this.printMark(term.mark, null)
      }
    }
  }

  /** Eine Größe: ihr Zeichen; teilen sich mehrere Größen ein Zeichen, mit ihrer Kennung dahinter. */
  private printQuantity(quantityKey: string): string {
    const quantity = this.quantities[quantityKey]
    if (quantity === undefined) {
      return '?' + '#' + quantityKey
    }
    let sameSymbolCount = 0
    for (const otherQuantityKey of Object.keys(this.quantities)) {
      if (this.quantities[otherQuantityKey].symbol === quantity.symbol) {
        sameSymbolCount = sameSymbolCount + 1
      }
    }
    if (sameSymbolCount > 1) {
      return quantity.symbol + '#' + quantityKey
    }
    return quantity.symbol
  }

  /** Die Farbe der Größe, die wie dieses Zeichen aussieht: Die erbt eine Marke ohne Ziffer. */
  private getHighlightOfSymbol(symbol: string): string | null {
    for (const quantityKey of Object.keys(this.quantities)) {
      const quantity = this.quantities[quantityKey]
      if (quantity.symbol === symbol) {
        return quantity.highlight ?? null
      }
    }
    return null
  }

  private hasMark(term: TermJson): boolean {
    if (term.type === 'QUANTITY') {
      return false
    }
    return term.mark !== undefined && term.mark !== null
  }

  /** `#name`, und die Farbe als Ziffer nur, wenn sie von der geerbten abweicht. */
  private printMark(mark: MarkJson | null | undefined, inheritedHighlight: string | null): string {
    if (mark === undefined || mark === null) {
      return ''
    }
    const highlight = mark.highlight ?? null
    if (highlight === inheritedHighlight) {
      return '#' + mark.key
    }
    return '#' + mark.key + ':' + getHighlightDigit(highlight)
  }
}
