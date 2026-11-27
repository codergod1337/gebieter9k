import { BlockContentError } from '../BlockContentError.ts'
import { InlineMarkupParser } from '../inline/InlineMarkupParser.ts'
import type { InlineNode } from '../inline/InlineNode.ts'
import { SketchReader } from '../sketch/SketchReader.ts'
import type { ContentElement, EquationElement } from './ContentElement.ts'
import { type JsonObject, requireList, requireObject, requireText, requireTextOrEmpty } from './jsonValues.ts'

/**
 * Liest die Elemente eines Inhalts aus ihrem JSON ({@link ElementJson}) und macht sie fertig zum Zeichnen: Texte werden
 * auf ihre Auszeichnung gelesen, Gleichungen bekommen ihre laufende Nummer. Für jeden Inhalt ein eigener Leser: Er
 * zählt die Gleichungen und merkt sich die vergebenen Kennungen. Passt etwas nicht, wirft er einen
 * {@link BlockContentError} mit der Stelle im JSON.
 */
export class ElementReader {
  private readonly inlineMarkupParser = new InlineMarkupParser()

  private readonly sketchReader = new SketchReader()

  /** Die Gleichungen in der Reihenfolge des Inhalts; ihre Stelle + 1 ist ihre Nummer. */
  private readonly equations: EquationElement[] = []

  /** Die festen Kennungen, die schon vergeben sind (Gleichungen und Aufklapper teilen sich einen Raum). */
  private readonly takenIds: string[] = []

  /** Die Elemente der obersten Ebene; nur dort darf eine ContentBox stehen. */
  readTopLevelElements(elementsValue: unknown, elementsPath: string): ContentElement[] {
    return this.readElements(elementsValue, elementsPath, true)
  }

  /** Alle gelesenen Gleichungen in der Reihenfolge des Inhalts. */
  getEquations(): EquationElement[] {
    return this.equations
  }

  private readElements(elementsValue: unknown, elementsPath: string, onTopLevel: boolean): ContentElement[] {
    const elementValues = requireList(elementsValue, elementsPath)
    const elements: ContentElement[] = []
    elementValues.forEach((elementValue, elementIndex) => {
      const elementPath = elementsPath + '[' + elementIndex + ']'
      const element = this.readElement(elementValue, elementPath, onTopLevel)
      elements.push(element)
    })
    return elements
  }

  private readElement(elementValue: unknown, elementPath: string, onTopLevel: boolean): ContentElement {
    const elementObject = requireObject(elementValue, elementPath)
    const elementType = requireText(elementObject.type, elementPath + '.type')
    switch (elementType) {
      case 'CONTENT_BOX': {
        if (!onTopLevel) {
          throw new BlockContentError(elementPath + ': Eine ContentBox steht nur auf oberster Ebene, nicht in einer ContentBox oder einem Aufklapper.')
        }
        // ein leerer Titel oder Text ist erlaubt: Im Editor entsteht das Element, bevor man es füllt
        const title = requireTextOrEmpty(elementObject.title, elementPath + '.title')
        const elements = this.readElements(elementObject.elements, elementPath + '.elements', false)
        return { type: 'CONTENT_BOX', title, elements }
      }
      case 'COLLAPSIBLE': {
        const id = this.readFreeId(elementObject, elementPath)
        const title = requireTextOrEmpty(elementObject.title, elementPath + '.title')
        const elements = this.readElements(elementObject.elements, elementPath + '.elements', false)
        return { type: 'COLLAPSIBLE', id, title, elements }
      }
      case 'HEADING': {
        const text = requireTextOrEmpty(elementObject.text, elementPath + '.text')
        return { type: 'HEADING', text }
      }
      case 'PARAGRAPH': {
        const text = requireTextOrEmpty(elementObject.text, elementPath + '.text')
        const inlines = this.readInlineText(text)
        return { type: 'PARAGRAPH', text, inlines }
      }
      case 'HINT': {
        const text = requireTextOrEmpty(elementObject.text, elementPath + '.text')
        const inlines = this.readInlineText(text)
        return { type: 'HINT', text, inlines }
      }
      case 'LIST': {
        const ordered = elementObject.ordered === true
        const itemValues = requireList(elementObject.items, elementPath + '.items')
        const items: InlineNode[][] = []
        itemValues.forEach((itemValue, itemIndex) => {
          const itemText = requireTextOrEmpty(itemValue, elementPath + '.items[' + itemIndex + ']')
          const itemInlines = this.readInlineText(itemText)
          items.push(itemInlines)
        })
        return { type: 'LIST', ordered, items }
      }
      case 'EQUATION': {
        const id = this.readFreeId(elementObject, elementPath)
        const latex = requireTextOrEmpty(elementObject.latex, elementPath + '.latex')
        const number = this.equations.length + 1
        const equation: EquationElement = { type: 'EQUATION', id, number, latex }
        this.equations.push(equation)
        return equation
      }
      case 'SKETCH': {
        const sketch = this.sketchReader.readSketch(elementObject.sketch, elementPath + '.sketch')
        return { type: 'SKETCH', sketch }
      }
      default:
        throw new BlockContentError(elementPath + '.type: unbekanntes Element "' + elementType + '"')
    }
  }

  /** Die feste Kennung eines Elements; jede darf es im Inhalt nur einmal geben. */
  private readFreeId(elementObject: JsonObject, elementPath: string): string {
    const id = requireText(elementObject.id, elementPath + '.id')
    if (this.takenIds.includes(id)) {
      throw new BlockContentError(elementPath + '.id: Die Kennung "' + id + '" gibt es schon.')
    }
    this.takenIds.push(id)
    return id
  }

  /** Ein Text mit Auszeichnung: fett, kursiv, Links und Formeln mitten im Satz ({@link InlineMarkupParser}). */
  private readInlineText(text: string): InlineNode[] {
    return this.inlineMarkupParser.parse(text)
  }
}
