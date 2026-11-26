import { Fragment, type ReactNode } from 'react'
import type { FractionTerm } from './FractionTerm.ts'
import type { FunctionTerm } from './FunctionTerm.ts'
import { getMathHighlightClassName } from './getMathHighlightClassName.ts'
import type { GroupTerm } from './GroupTerm.ts'
import type { MarkedTerm } from './MarkedTerm.ts'
import { MathStretchySign } from './MathStretchySign.tsx'
import type { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'
import type { NumberTerm } from './NumberTerm.ts'
import type { PowerTerm } from './PowerTerm.ts'
import type { ProductTerm } from './ProductTerm.ts'
import type { RootTerm } from './RootTerm.ts'
import type { SumTerm } from './SumTerm.ts'
import type { SymbolTerm } from './SymbolTerm.ts'
import type { TermMark } from './TermMark.ts'

/**
 * Zeichnet den Baum einer Formel als HTML: je Art von Term eine Methode, jeder Term wird ein eigenes Element. Den Satz
 * (Bruchstrich, Hochstellung, Wurzel) macht das CSS in base.css über die Klassen `math-…`, Schrift und Farben setzt
 * das Theme.
 *
 * Weil jeder Term ein eigenes Element ist, lässt er sich einzeln färben und bewegen. Ein markierter Term trägt seine
 * Kennung im Attribut `data-tracking-key` (siehe `trackedTerm.ts`); daran findet die Herleitung ihn in zwei Schritten
 * wieder.
 */
export class MathTermReactRenderer implements MathTermVisitor<ReactNode> {
  visitSymbolTerm(symbolTerm: SymbolTerm): ReactNode {
    return <span className="math-symbol">{symbolTerm.symbol}</span>
  }

  visitNumberTerm(numberTerm: NumberTerm): ReactNode {
    return <span className="math-number">{numberTerm.numberText}</span>
  }

  visitSumTerm(sumTerm: SumTerm): ReactNode {
    return this.renderJoinedTerms(sumTerm.summands, '+')
  }

  visitProductTerm(productTerm: ProductTerm): ReactNode {
    return this.renderJoinedTerms(productTerm.factors, '·')
  }

  visitFractionTerm(fractionTerm: FractionTerm): ReactNode {
    const renderedNumerator = fractionTerm.numerator.accept(this)
    const renderedDenominator = fractionTerm.denominator.accept(this)
    return (
      <span className="math-fraction">
        <span className="math-fraction-numerator">{renderedNumerator}</span>
        <span className="math-fraction-denominator">{renderedDenominator}</span>
      </span>
    )
  }

  visitPowerTerm(powerTerm: PowerTerm): ReactNode {
    const renderedBase = powerTerm.base.accept(this)
    const renderedExponent = powerTerm.exponent.accept(this)
    return (
      <span className="math-power">
        {renderedBase}
        <sup className="math-power-exponent">{renderedExponent}</sup>
      </span>
    )
  }

  visitRootTerm(rootTerm: RootTerm): ReactNode {
    const renderedRadicand = rootTerm.radicand.accept(this)
    const highlightClassName = this.getHighlightClassName(rootTerm.signMark)
    const trackingKey = this.getTrackingKey(rootTerm.signMark)
    // Haken und Linie über dem Radikanden tragen dieselbe Farbe; der Radikand selbst steht wieder in der Schriftfarbe
    const signClassName = this.joinClassNames('math-root-sign', highlightClassName)
    const lineClassName = this.joinClassNames('math-root-line', highlightClassName)
    return (
      <span className="math-root">
        <span className={signClassName} data-tracking-key={trackingKey}>
          <MathStretchySign shape="ROOT" />
        </span>
        <span className={lineClassName}>
          <span className="math-root-radicand">{renderedRadicand}</span>
        </span>
      </span>
    )
  }

  visitFunctionTerm(functionTerm: FunctionTerm): ReactNode {
    const renderedArgument = functionTerm.argument.accept(this)
    const highlightClassName = this.getHighlightClassName(functionTerm.nameMark)
    const trackingKey = this.getTrackingKey(functionTerm.nameMark)
    const nameClassName = this.joinClassNames('math-function-name', highlightClassName)
    return (
      <span className="math-function">
        <span className={nameClassName} data-tracking-key={trackingKey}>
          {functionTerm.functionName}
        </span>
        <span className="math-function-argument">{renderedArgument}</span>
      </span>
    )
  }

  visitGroupTerm(groupTerm: GroupTerm): ReactNode {
    const renderedTerm = groupTerm.term.accept(this)
    return (
      <span className="math-group">
        <span className="math-group-sign">
          <MathStretchySign shape="LEFT_PARENTHESIS" />
        </span>
        <span className="math-group-content">{renderedTerm}</span>
        <span className="math-group-sign">
          <MathStretchySign shape="RIGHT_PARENTHESIS" />
        </span>
      </span>
    )
  }

  visitMarkedTerm(markedTerm: MarkedTerm): ReactNode {
    const renderedTerm = markedTerm.term.accept(this)
    const highlightClassName = this.getHighlightClassName(markedTerm.termMark)
    const trackingKey = this.getTrackingKey(markedTerm.termMark)
    const markClassName = this.joinClassNames('math-mark', highlightClassName)
    return (
      <span className={markClassName} data-tracking-key={trackingKey}>
        {renderedTerm}
      </span>
    )
  }

  /** Mehrere Terme nebeneinander, dazwischen je einmal das Rechenzeichen, z. B. `x² + y²`. */
  private renderJoinedTerms(terms: MathTerm[], operatorSign: string): ReactNode {
    const renderedParts: ReactNode[] = []
    terms.forEach((term, termIndex) => {
      if (termIndex > 0) {
        const operatorKey = 'operator' + termIndex
        renderedParts.push(
          <span key={operatorKey} className="math-operator">
            {operatorSign}
          </span>,
        )
      }
      const renderedTerm = term.accept(this)
      const termKey = 'term' + termIndex
      renderedParts.push(<Fragment key={termKey}>{renderedTerm}</Fragment>)
    })
    return <>{renderedParts}</>
  }

  /** Die Klasse zur Farbe einer Marke; ohne Marke oder ohne Farbe ein leerer Text. */
  private getHighlightClassName(termMark: TermMark | null): string {
    if (termMark === null) {
      return ''
    }
    return getMathHighlightClassName(termMark.highlightKey)
  }

  /** Die Kennung einer Marke fürs Attribut; ohne Marke `undefined`, dann schreibt React das Attribut nicht. */
  private getTrackingKey(termMark: TermMark | null): string | undefined {
    if (termMark === null) {
      return undefined
    }
    return termMark.trackingKey
  }

  private joinClassNames(baseClassName: string, addedClassName: string): string {
    if (addedClassName === '') {
      return baseClassName
    }
    return baseClassName + ' ' + addedClassName
  }
}
