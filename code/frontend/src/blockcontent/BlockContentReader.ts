import { Derivation } from './derivation/Derivation.ts'
import { DerivationOperation } from './derivation/DerivationOperation.ts'
import { DerivationStep } from './derivation/DerivationStep.ts'
import { Equation } from './math/Equation.ts'
import { FractionTerm } from './math/FractionTerm.ts'
import { FunctionTerm } from './math/FunctionTerm.ts'
import { GroupTerm } from './math/GroupTerm.ts'
import { MarkedTerm } from './math/MarkedTerm.ts'
import type { MathHighlightKey } from './math/MathHighlightKey.ts'
import type { MathTerm } from './math/MathTerm.ts'
import { NegativeTerm } from './math/NegativeTerm.ts'
import { NumberTerm } from './math/NumberTerm.ts'
import { PowerTerm } from './math/PowerTerm.ts'
import { ProductTerm } from './math/ProductTerm.ts'
import { RootTerm } from './math/RootTerm.ts'
import { SumTerm } from './math/SumTerm.ts'
import { SymbolTerm } from './math/SymbolTerm.ts'
import { TermMark } from './math/TermMark.ts'
import { SketchCoordinateSystem } from './sketch/SketchCoordinateSystem.ts'
import type { SketchPosition } from './sketch/SketchPosition.ts'
import type { BoxBlock, BoxPart, BlockContent, ContentBlock } from './BlockContent.ts'
import type { QuantitiesJson, TermJson } from './BlockContentJson.ts'
import { FormulaTextError } from './formulatext/FormulaTextError.ts'
import { FormulaTextParser } from './formulatext/FormulaTextParser.ts'
import { InlineMarkupParser, type InlineMarkupNode } from './inline/InlineMarkupParser.ts'
import type { InlineNode } from './inline/InlineNode.ts'
import { BlockContentError } from './BlockContentError.ts'
import type { SketchContent, SketchElement } from './SketchContent.ts'

/** Ein JSON-Objekt, dessen Felder noch nicht geprüft sind. */
type JsonObject = Record<string, unknown>

/** Die Farben, die eine Marke tragen kann, wie {@link MathHighlightKey}. */
const HIGHLIGHT_KEYS: string[] = ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH']

/**
 * Liest einen Inhalt aus Bausteinen: aus dem gespeicherten JSON-Text (bei einer Wissensseite das Feld `content` ihres
 * Solr-Dokuments) werden die Bausteine
 * zum Zeichnen ({@link BlockContent}). Das Format (Fassung 1, `contentFormatVersion`) steht in
 * `docu/blockcontent.md`:
 *
 * - `quantities`: die Größen der Seite, je Kennung ihr Zeichen und ihre Farbe, z. B.
 *   `{"radius": {"symbol": "r", "highlight": "THIRD"}}`. Eine Größe trägt auf der ganzen Seite dieselbe Farbe.
 * - `blocks`: die Bausteine von oben nach unten. `BOX`: ein Kasten mit `title`, `parts` (`PARAGRAPH`, `EQUATIONS`,
 *   `HINT`) und auf Wunsch `sketch`. `DERIVATION`: eine Rechnung mit `key`, `title` und `steps`; jeder Schritt hat
 *   seine `equation`, ab dem zweiten die `operation`, die ihn aus dem davor macht, und auf Wunsch eine `explanation`.
 * - Ein Term ist ein Baum: `QUANTITY`, `SYMBOL`, `NUMBER`, `SUM`, `PRODUCT`, `FRACTION`, `POWER`, `ROOT`, `FUNCTION`,
 *   `GROUP`, `NEGATIVE`. Eine `mark` (`key`, `highlight`) macht einen Term über die Zeilen einer Rechnung hinweg verfolgbar.
 *
 * Für jede Seite ein eigener Leser: Er merkt sich die Größen und die Rechnungen der Seite. Passt etwas nicht, wirft er
 * einen {@link BlockContentError} mit der Stelle im JSON.
 */
export class BlockContentReader {
  /** Je Kennung einer Größe ihr Zeichen. */
  private readonly quantitySymbolsByKey = new Map<string, string>()

  /** Je Kennung einer Größe ihre Farbe; `null` ohne. */
  private readonly quantityHighlightKeysByKey = new Map<string, MathHighlightKey | null>()

  /** Die Größen, wie sie im JSON stehen: Daran erkennt der Leser der getippten Formeln sie in einem Text. */
  private readonly quantitiesJson: QuantitiesJson = {}

  private readonly inlineMarkupParser = new InlineMarkupParser()

  /** Je Kennung die Rechnungen der Seite: Eine Zusammenfassung kann auf ihr Ergebnis verweisen. */
  private readonly derivationsByKey = new Map<string, Derivation>()

  /**
   * Liest den ganzen Inhalt einer Seite.
   *
   * @throws BlockContentError wenn der Text kein JSON ist oder nicht dem Format entspricht
   */
  readContent(contentText: string): BlockContent {
    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(contentText)
    } catch {
      throw new BlockContentError('Der Inhalt ist kein gültiges JSON.')
    }
    const contentObject = this.requireObject(parsedContent, 'content')
    this.readQuantities(contentObject.quantities)
    const blockValues = this.requireList(contentObject.blocks, 'blocks')

    // erst alle Rechnungen: Ein Kasten darf auf das Ergebnis einer Rechnung verweisen, die weiter unten steht
    const derivationsByBlockIndex = new Map<number, Derivation>()
    blockValues.forEach((blockValue, blockIndex) => {
      const blockPath = 'blocks[' + blockIndex + ']'
      const blockObject = this.requireObject(blockValue, blockPath)
      if (blockObject.type === 'DERIVATION') {
        const derivation = this.readDerivation(blockObject, blockPath)
        derivationsByBlockIndex.set(blockIndex, derivation)
      }
    })

    const blocks: ContentBlock[] = []
    blockValues.forEach((blockValue, blockIndex) => {
      const blockPath = 'blocks[' + blockIndex + ']'
      const blockObject = this.requireObject(blockValue, blockPath)
      const blockType = this.requireText(blockObject.type, blockPath + '.type')
      // ein leerer Titel oder Absatz ist erlaubt: Im Editor entsteht er, bevor man ihn füllt
      const title = this.requireTextOrEmpty(blockObject.title, blockPath + '.title')
      if (blockType === 'DERIVATION') {
        const derivation = derivationsByBlockIndex.get(blockIndex)
        if (derivation !== undefined) {
          blocks.push({ type: 'DERIVATION', title, derivation })
        }
        return
      }
      if (blockType === 'BOX') {
        const boxBlock = this.readBoxBlock(blockObject, title, blockPath)
        blocks.push(boxBlock)
        return
      }
      throw new BlockContentError(blockPath + '.type: unbekannter Baustein "' + blockType + '"')
    })
    return { blocks }
  }

  /** Die Größen der Seite; ohne `quantities` hat die Seite keine. */
  private readQuantities(quantitiesValue: unknown) {
    if (quantitiesValue === undefined || quantitiesValue === null) {
      return
    }
    const quantitiesObject = this.requireObject(quantitiesValue, 'quantities')
    for (const quantityKey of Object.keys(quantitiesObject)) {
      const quantityPath = 'quantities.' + quantityKey
      const quantityObject = this.requireObject(quantitiesObject[quantityKey], quantityPath)
      const symbol = this.requireText(quantityObject.symbol, quantityPath + '.symbol')
      const highlightKey = this.readHighlightKey(quantityObject.highlight, quantityPath + '.highlight')
      this.quantitySymbolsByKey.set(quantityKey, symbol)
      this.quantitiesJson[quantityKey] = { symbol, highlight: highlightKey }
      this.quantityHighlightKeysByKey.set(quantityKey, highlightKey)
    }
  }

  private readDerivation(blockObject: JsonObject, blockPath: string): Derivation {
    const derivationKey = this.requireText(blockObject.key, blockPath + '.key')
    if (this.derivationsByKey.has(derivationKey)) {
      throw new BlockContentError(blockPath + '.key: Die Rechnung "' + derivationKey + '" gibt es schon.')
    }
    const stepValues = this.requireList(blockObject.steps, blockPath + '.steps')
    if (stepValues.length === 0) {
      throw new BlockContentError(blockPath + '.steps: Eine Rechnung braucht mindestens einen Schritt.')
    }
    const steps: DerivationStep[] = []
    stepValues.forEach((stepValue, stepIndex) => {
      const stepPath = blockPath + '.steps[' + stepIndex + ']'
      const stepObject = this.requireObject(stepValue, stepPath)
      const equation = this.readEquation(stepObject.equation, stepPath + '.equation')
      const explanation = this.readOptionalText(stepObject.explanation, stepPath + '.explanation')
      let operation: DerivationOperation | null = null
      const isFirstStep = stepIndex === 0
      const operationGiven = stepObject.operation !== undefined && stepObject.operation !== null
      if (isFirstStep && operationGiven) {
        throw new BlockContentError(stepPath + '.operation: Der erste Schritt ist der Ausgang, er hat keine Umformung.')
      }
      if (!isFirstStep) {
        operation = this.readOperation(stepObject.operation, stepPath + '.operation')
      }
      const step = new DerivationStep(equation, operation, explanation)
      steps.push(step)
    })
    const derivation = new Derivation(derivationKey, steps)
    this.derivationsByKey.set(derivationKey, derivation)
    return derivation
  }

  private readOperation(operationValue: unknown, operationPath: string): DerivationOperation {
    const operationObject = this.requireObject(operationValue, operationPath)
    const notation = this.readOptionalText(operationObject.notation, operationPath + '.notation')
    let operand: MathTerm | null = null
    if (operationObject.operand !== undefined && operationObject.operand !== null) {
      operand = this.readTerm(operationObject.operand, operationPath + '.operand')
    }
    const appliedTermKeys = this.readOptionalTextList(operationObject.applies, operationPath + '.applies')
    const cancelledTermKeys = this.readOptionalTextList(operationObject.cancels, operationPath + '.cancels')
    return new DerivationOperation(notation, operand, appliedTermKeys, cancelledTermKeys)
  }

  /** Eine Gleichung: ausgeschrieben mit `left` und `right` oder als Verweis `resultOf` auf das Ergebnis einer Rechnung. */
  private readEquation(equationValue: unknown, equationPath: string): Equation {
    const equationObject = this.requireObject(equationValue, equationPath)
    if (equationObject.resultOf !== undefined) {
      const derivationKey = this.requireText(equationObject.resultOf, equationPath + '.resultOf')
      const derivation = this.derivationsByKey.get(derivationKey)
      if (derivation === undefined) {
        throw new BlockContentError(equationPath + '.resultOf: Die Rechnung "' + derivationKey + '" gibt es nicht.')
      }
      return derivation.getResultEquation()
    }
    const leftSide = this.readTerm(equationObject.left, equationPath + '.left')
    const rightSide = this.readTerm(equationObject.right, equationPath + '.right')
    return new Equation(leftSide, rightSide)
  }

  private readTerm(termValue: unknown, termPath: string): MathTerm {
    const termObject = this.requireObject(termValue, termPath)
    const termType = this.requireText(termObject.type, termPath + '.type')
    const mark = this.readOptionalMark(termObject.mark, termPath + '.mark')
    switch (termType) {
      case 'QUANTITY': {
        const quantityKey = this.requireText(termObject.key, termPath + '.key')
        return this.createQuantityTerm(quantityKey, termPath + '.key')
      }
      case 'SYMBOL': {
        const symbol = this.requireText(termObject.text, termPath + '.text')
        const symbolTerm = new SymbolTerm(symbol)
        return this.markTerm(symbolTerm, mark)
      }
      case 'NUMBER': {
        const numberText = this.requireText(termObject.text, termPath + '.text')
        const numberTerm = new NumberTerm(numberText)
        return this.markTerm(numberTerm, mark)
      }
      case 'SUM': {
        const summands = this.readTerms(termObject.terms, termPath + '.terms')
        const sumTerm = new SumTerm(summands)
        return this.markTerm(sumTerm, mark)
      }
      case 'PRODUCT': {
        const factors = this.readTerms(termObject.factors, termPath + '.factors')
        const productTerm = new ProductTerm(factors)
        return this.markTerm(productTerm, mark)
      }
      case 'FRACTION': {
        const numerator = this.readTerm(termObject.numerator, termPath + '.numerator')
        const denominator = this.readTerm(termObject.denominator, termPath + '.denominator')
        const fractionTerm = new FractionTerm(numerator, denominator)
        return this.markTerm(fractionTerm, mark)
      }
      case 'POWER': {
        const base = this.readTerm(termObject.base, termPath + '.base')
        const exponent = this.readTerm(termObject.exponent, termPath + '.exponent')
        const powerTerm = new PowerTerm(base, exponent)
        return this.markTerm(powerTerm, mark)
      }
      case 'ROOT': {
        // die Marke einer Wurzel gilt ihrem Zeichen: Das Zeichen ist es, was beim Wurzelziehen dazukommt
        const radicand = this.readTerm(termObject.radicand, termPath + '.radicand')
        return new RootTerm(radicand, mark)
      }
      case 'FUNCTION': {
        // die Marke einer Funktion gilt ihrem Namen, z. B. dem „arctan“, das auf beiden Seiten dazukommt
        const functionName = this.requireText(termObject.name, termPath + '.name')
        const argument = this.readTerm(termObject.argument, termPath + '.argument')
        return new FunctionTerm(functionName, argument, mark)
      }
      case 'GROUP': {
        const groupedTerm = this.readTerm(termObject.term, termPath + '.term')
        const groupTerm = new GroupTerm(groupedTerm)
        return this.markTerm(groupTerm, mark)
      }
      case 'NEGATIVE': {
        const negatedTerm = this.readTerm(termObject.term, termPath + '.term')
        const negativeTerm = new NegativeTerm(negatedTerm)
        return this.markTerm(negativeTerm, mark)
      }
      default:
        throw new BlockContentError(termPath + '.type: unbekannter Term "' + termType + '"')
    }
  }

  private readTerms(termsValue: unknown, termsPath: string): MathTerm[] {
    const termValues = this.requireList(termsValue, termsPath)
    const terms: MathTerm[] = []
    termValues.forEach((termValue, termIndex) => {
      const term = this.readTerm(termValue, termsPath + '[' + termIndex + ']')
      terms.push(term)
    })
    return terms
  }

  /** Eine Größe der Seite als Term: ihr Zeichen mit ihrer Marke (Kennung = Kennung der Größe, ihre Farbe). */
  private createQuantityTerm(quantityKey: string, quantityKeyPath: string): MathTerm {
    const symbol = this.quantitySymbolsByKey.get(quantityKey)
    if (symbol === undefined) {
      throw new BlockContentError(quantityKeyPath + ': Die Größe "' + quantityKey + '" steht nicht in quantities.')
    }
    const highlightKey = this.getQuantityHighlightKey(quantityKey)
    const symbolTerm = new SymbolTerm(symbol)
    const quantityMark = new TermMark(quantityKey, highlightKey)
    return new MarkedTerm(symbolTerm, quantityMark)
  }

  private getQuantityHighlightKey(quantityKey: string): MathHighlightKey | null {
    const highlightKey = this.quantityHighlightKeysByKey.get(quantityKey)
    if (highlightKey === undefined) {
      return null
    }
    return highlightKey
  }

  private markTerm(term: MathTerm, mark: TermMark | null): MathTerm {
    if (mark === null) {
      return term
    }
    return new MarkedTerm(term, mark)
  }

  private readOptionalMark(markValue: unknown, markPath: string): TermMark | null {
    if (markValue === undefined || markValue === null) {
      return null
    }
    const markObject = this.requireObject(markValue, markPath)
    const trackingKey = this.requireText(markObject.key, markPath + '.key')
    const highlightKey = this.readHighlightKey(markObject.highlight, markPath + '.highlight')
    return new TermMark(trackingKey, highlightKey)
  }

  private readHighlightKey(highlightValue: unknown, highlightPath: string): MathHighlightKey | null {
    if (highlightValue === undefined || highlightValue === null) {
      return null
    }
    const highlightText = this.requireText(highlightValue, highlightPath)
    if (!HIGHLIGHT_KEYS.includes(highlightText)) {
      throw new BlockContentError(highlightPath + ': unbekannte Farbe "' + highlightText + '"')
    }
    return highlightText as MathHighlightKey
  }

  private readBoxBlock(blockObject: JsonObject, title: string, blockPath: string): BoxBlock {
    const partValues = this.requireList(blockObject.parts, blockPath + '.parts')
    const parts: BoxPart[] = []
    partValues.forEach((partValue, partIndex) => {
      const partPath = blockPath + '.parts[' + partIndex + ']'
      const partObject = this.requireObject(partValue, partPath)
      const partType = this.requireText(partObject.type, partPath + '.type')
      if (partType === 'PARAGRAPH') {
        const text = this.requireTextOrEmpty(partObject.text, partPath + '.text')
        const inlines = this.readInlineText(text, partPath + '.text')
        parts.push({ type: 'PARAGRAPH', text, inlines })
        return
      }
      if (partType === 'HINT') {
        const text = this.requireTextOrEmpty(partObject.text, partPath + '.text')
        const inlines = this.readInlineText(text, partPath + '.text')
        parts.push({ type: 'HINT', text, inlines })
        return
      }
      if (partType === 'LIST') {
        const ordered = partObject.ordered === true
        const itemValues = this.requireList(partObject.items, partPath + '.items')
        const items: InlineNode[][] = []
        itemValues.forEach((itemValue, itemIndex) => {
          const itemPath = partPath + '.items[' + itemIndex + ']'
          const itemText = this.requireTextOrEmpty(itemValue, itemPath)
          const itemInlines = this.readInlineText(itemText, itemPath)
          items.push(itemInlines)
        })
        parts.push({ type: 'LIST', ordered, items })
        return
      }
      if (partType === 'EQUATIONS') {
        const heading = this.readOptionalText(partObject.heading, partPath + '.heading')
        const equationValues = this.requireList(partObject.equations, partPath + '.equations')
        const equations: Equation[] = []
        equationValues.forEach((equationValue, equationIndex) => {
          const equation = this.readEquation(equationValue, partPath + '.equations[' + equationIndex + ']')
          equations.push(equation)
        })
        parts.push({ type: 'EQUATIONS', heading, equations })
        return
      }
      throw new BlockContentError(partPath + '.type: unbekannter Teil "' + partType + '"')
    })
    let sketch: SketchContent | null = null
    if (blockObject.sketch !== undefined && blockObject.sketch !== null) {
      sketch = this.readSketch(blockObject.sketch, blockPath + '.sketch')
    }
    return { type: 'BOX', title, parts, sketch }
  }

  /** Ein Text mit Auszeichnung: fett, kursiv, Links und Formeln mitten im Satz ({@link InlineMarkupParser}). */
  private readInlineText(text: string, textPath: string): InlineNode[] {
    const markupNodes = this.inlineMarkupParser.parse(text)
    return this.createInlineNodes(markupNodes, textPath)
  }

  private createInlineNodes(markupNodes: InlineMarkupNode[], textPath: string): InlineNode[] {
    const inlineNodes: InlineNode[] = []
    for (const markupNode of markupNodes) {
      if (markupNode.type === 'TEXT') {
        inlineNodes.push(markupNode)
      } else if (markupNode.type === 'FORMULA') {
        inlineNodes.push(this.createInlineFormula(markupNode.formulaText, textPath))
      } else if (markupNode.type === 'LINK') {
        const children = this.createInlineNodes(markupNode.children, textPath)
        inlineNodes.push({ type: 'LINK', address: markupNode.address, children })
      } else {
        const children = this.createInlineNodes(markupNode.children, textPath)
        inlineNodes.push({ type: markupNode.type, children })
      }
    }
    return inlineNodes
  }

  /**
   * Eine Formel mitten im Satz, getippt wie im Formelfeld. Lässt sie sich nicht lesen, bleibt ihr Text stehen und sagt
   * beim Zeigen, was nicht passt: Der Rest der Seite bleibt lesbar.
   */
  private createInlineFormula(formulaText: string, textPath: string): InlineNode {
    let termJson: TermJson
    try {
      const formulaTextParser = new FormulaTextParser(this.quantitiesJson)
      termJson = formulaTextParser.parseTerm(formulaText)
    } catch (caughtError) {
      let message = String(caughtError)
      if (caughtError instanceof FormulaTextError) {
        message = caughtError.message
      }
      return { type: 'PROBLEM', text: '$' + formulaText + '$', message }
    }
    const term = this.readTerm(termJson, textPath)
    return { type: 'FORMULA', term }
  }

  private readSketch(sketchValue: unknown, sketchPath: string): SketchContent {
    const sketchObject = this.requireObject(sketchValue, sketchPath)
    const width = this.requireNumber(sketchObject.width, sketchPath + '.width')
    const height = this.requireNumber(sketchObject.height, sketchPath + '.height')
    const originX = this.requireNumber(sketchObject.originX, sketchPath + '.originX')
    const originY = this.requireNumber(sketchObject.originY, sketchPath + '.originY')
    const unitLength = this.requireNumber(sketchObject.unitLength, sketchPath + '.unitLength')
    const axisMaxX = this.requireNumber(sketchObject.axisMaxX, sketchPath + '.axisMaxX')
    const axisMaxY = this.requireNumber(sketchObject.axisMaxY, sketchPath + '.axisMaxY')
    const description = this.requireTextOrEmpty(sketchObject.description, sketchPath + '.description')
    const coordinateSystem = new SketchCoordinateSystem(originX, originY, unitLength)
    const elementValues = this.requireList(sketchObject.elements, sketchPath + '.elements')
    const elements: SketchElement[] = []
    elementValues.forEach((elementValue, elementIndex) => {
      const element = this.readSketchElement(elementValue, sketchPath + '.elements[' + elementIndex + ']')
      elements.push(element)
    })
    return { width, height, coordinateSystem, axisMaxX, axisMaxY, description, elements }
  }

  private readSketchElement(elementValue: unknown, elementPath: string): SketchElement {
    const elementObject = this.requireObject(elementValue, elementPath)
    const elementType = this.requireText(elementObject.type, elementPath + '.type')
    if (elementType === 'POINT') {
      const position = this.readPosition(elementObject.position, elementPath + '.position')
      const label = this.readOptionalText(elementObject.label, elementPath + '.label')
      const hintName = this.readOptionalText(elementObject.hintName, elementPath + '.hintName')
      const hintDetail = this.readOptionalText(elementObject.hintDetail, elementPath + '.hintDetail')
      return { type: 'POINT', position, label, hintName, hintDetail }
    }
    if (elementType === 'SEGMENT') {
      const fromPosition = this.readPosition(elementObject.from, elementPath + '.from')
      const toPosition = this.readPosition(elementObject.to, elementPath + '.to')
      const label = this.requireTextOrEmpty(elementObject.label, elementPath + '.label')
      const labelSideText = this.requireText(elementObject.labelSide, elementPath + '.labelSide')
      if (labelSideText !== 'LEFT' && labelSideText !== 'RIGHT') {
        throw new BlockContentError(elementPath + '.labelSide: erwartet ist LEFT oder RIGHT.')
      }
      const highlightKey = this.readQuantityHighlightKey(elementObject.quantity, elementPath + '.quantity')
      return { type: 'SEGMENT', fromPosition, toPosition, label, labelSide: labelSideText, highlightKey }
    }
    if (elementType === 'ANGLE' || elementType === 'RIGHT_ANGLE') {
      const vertexPosition = this.readPosition(elementObject.vertex, elementPath + '.vertex')
      const firstLegEndPosition = this.readPosition(elementObject.firstLegEnd, elementPath + '.firstLegEnd')
      const secondLegEndPosition = this.readPosition(elementObject.secondLegEnd, elementPath + '.secondLegEnd')
      if (elementType === 'RIGHT_ANGLE') {
        return { type: 'RIGHT_ANGLE', vertexPosition, firstLegEndPosition, secondLegEndPosition }
      }
      const label = this.requireTextOrEmpty(elementObject.label, elementPath + '.label')
      const hintText = this.requireTextOrEmpty(elementObject.hint, elementPath + '.hint')
      const highlightKey = this.readQuantityHighlightKey(elementObject.quantity, elementPath + '.quantity')
      return { type: 'ANGLE', vertexPosition, firstLegEndPosition, secondLegEndPosition, label, hintText, highlightKey }
    }
    throw new BlockContentError(elementPath + '.type: unbekanntes Element "' + elementType + '"')
  }

  /** Die Farbe eines Elements der Skizze: die seiner Größe; ohne `quantity` keine. */
  private readQuantityHighlightKey(quantityValue: unknown, quantityPath: string): MathHighlightKey | null {
    if (quantityValue === undefined || quantityValue === null) {
      return null
    }
    const quantityKey = this.requireText(quantityValue, quantityPath)
    if (!this.quantitySymbolsByKey.has(quantityKey)) {
      throw new BlockContentError(quantityPath + ': Die Größe "' + quantityKey + '" steht nicht in quantities.')
    }
    return this.getQuantityHighlightKey(quantityKey)
  }

  private readPosition(positionValue: unknown, positionPath: string): SketchPosition {
    const positionObject = this.requireObject(positionValue, positionPath)
    const x = this.requireNumber(positionObject.x, positionPath + '.x')
    const y = this.requireNumber(positionObject.y, positionPath + '.y')
    return { x, y }
  }

  private requireObject(value: unknown, path: string): JsonObject {
    const isObject = typeof value === 'object' && value !== null && !Array.isArray(value)
    if (!isObject) {
      throw new BlockContentError(path + ': erwartet ist ein Objekt.')
    }
    return value as JsonObject
  }

  private requireList(value: unknown, path: string): unknown[] {
    if (!Array.isArray(value)) {
      throw new BlockContentError(path + ': erwartet ist eine Liste.')
    }
    return value
  }

  private requireText(value: unknown, path: string): string {
    if (typeof value !== 'string' || value === '') {
      throw new BlockContentError(path + ': erwartet ist ein Text.')
    }
    return value
  }

  /** Ein Text, der auch leer sein darf. */
  private requireTextOrEmpty(value: unknown, path: string): string {
    if (typeof value !== 'string') {
      throw new BlockContentError(path + ': erwartet ist ein Text.')
    }
    return value
  }

  private requireNumber(value: unknown, path: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new BlockContentError(path + ': erwartet ist eine Zahl.')
    }
    return value
  }

  /** Ein freiwilliger Text; fehlt er oder ist er leer (im Editor geleert), gilt er als nicht vorhanden. */
  private readOptionalText(value: unknown, path: string): string | null {
    if (value === undefined || value === null || value === '') {
      return null
    }
    return this.requireText(value, path)
  }

  private readOptionalTextList(value: unknown, path: string): string[] {
    if (value === undefined || value === null) {
      return []
    }
    const textValues = this.requireList(value, path)
    const texts: string[] = []
    textValues.forEach((textValue, textIndex) => {
      const text = this.requireText(textValue, path + '[' + textIndex + ']')
      texts.push(text)
    })
    return texts
  }
}
