import type { FractionTerm } from './FractionTerm.ts'
import type { FunctionTerm } from './FunctionTerm.ts'
import type { GroupTerm } from './GroupTerm.ts'
import type { MarkedTerm } from './MarkedTerm.ts'
import type { NegativeTerm } from './NegativeTerm.ts'
import type { NumberTerm } from './NumberTerm.ts'
import type { PowerTerm } from './PowerTerm.ts'
import type { ProductTerm } from './ProductTerm.ts'
import type { RootTerm } from './RootTerm.ts'
import type { SumTerm } from './SumTerm.ts'
import type { SymbolTerm } from './SymbolTerm.ts'

/**
 * Wer mit dem Baum einer Formel etwas tut, z. B. ihn zeichnet ({@link MathTermReactRenderer}): je Art von Term eine
 * Methode. Kommt eine Art dazu, meldet die Typprüfung jeden Visitor, dem die neue Methode fehlt.
 */
export type MathTermVisitor<Result> = {
  visitSymbolTerm(symbolTerm: SymbolTerm): Result
  visitNumberTerm(numberTerm: NumberTerm): Result
  visitSumTerm(sumTerm: SumTerm): Result
  visitProductTerm(productTerm: ProductTerm): Result
  visitFractionTerm(fractionTerm: FractionTerm): Result
  visitPowerTerm(powerTerm: PowerTerm): Result
  visitRootTerm(rootTerm: RootTerm): Result
  visitFunctionTerm(functionTerm: FunctionTerm): Result
  visitGroupTerm(groupTerm: GroupTerm): Result
  visitNegativeTerm(negativeTerm: NegativeTerm): Result
  visitMarkedTerm(markedTerm: MarkedTerm): Result
}
