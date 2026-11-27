import { BlockContentError } from '../BlockContentError.ts'
import { InlineMarkupParser } from '../inline/InlineMarkupParser.ts'
import type { InlineNode } from '../inline/InlineNode.ts'
import type { FigureBoundingBox } from '../figure/FigureBoundingBox.ts'
import type { ContentElement, EquationElement } from './ContentElement.ts'
import { type JsonObject, requireList, requireNumber, requireObject, requireText, requireTextOrEmpty } from './jsonValues.ts'

/** Eine UUID: fünf Gruppen aus Ziffern und den Buchstaben a bis f, getrennt durch Bindestriche. */
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Liest die Elemente eines Inhalts aus ihrem JSON ({@link ElementJson}) und macht sie fertig zum Zeichnen: Texte werden
 * auf ihre Auszeichnung gelesen, Gleichungen bekommen ihre laufende Nummer. Für jeden Inhalt ein eigener Leser: Er
 * zählt die Gleichungen und merkt sich die vergebenen Kennungen. Passt etwas nicht, wirft er einen
 * {@link BlockContentError} mit der Stelle im JSON.
 */
export class ElementReader {
  private readonly inlineMarkupParser = new InlineMarkupParser()

  /** Die Gleichungen in der Reihenfolge des Inhalts; ihre Stelle + 1 ist ihre Nummer. */
  private readonly equations: EquationElement[] = []

  /** Die festen Kennungen, die schon vergeben sind (Gleichungen und Aufklapper teilen sich einen Raum). */
  private readonly takenGuids: string[] = []

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
        const guid = this.readFreeGuid(elementObject, elementPath)
        const title = requireTextOrEmpty(elementObject.title, elementPath + '.title')
        const elements = this.readElements(elementObject.elements, elementPath + '.elements', false)
        return { type: 'COLLAPSIBLE', guid, title, elements }
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
        const guid = this.readFreeGuid(elementObject, elementPath)
        const latex = requireTextOrEmpty(elementObject.latex, elementPath + '.latex')
        const number = this.equations.length + 1
        const equation: EquationElement = { type: 'EQUATION', guid, number, latex }
        this.equations.push(equation)
        return equation
      }
      case 'FIGURE': {
        const code = requireTextOrEmpty(elementObject.code, elementPath + '.code')
        const boundingBox = this.readBoundingBox(elementObject.boundingBox, elementPath + '.boundingBox')
        const aspectRatio = requireNumber(elementObject.aspectRatio, elementPath + '.aspectRatio')
        if (aspectRatio <= 0) {
          throw new BlockContentError(elementPath + '.aspectRatio: Das Seitenverhältnis (Breite durch Höhe) ist größer als 0.')
        }
        return { type: 'FIGURE', code, boundingBox, aspectRatio }
      }
      default:
        throw new BlockContentError(elementPath + '.type: unbekanntes Element "' + elementType + '"')
    }
  }

  /** Der Ausschnitt einer Figur: vier Zahlen `[left, top, right, bottom]`, links kleiner als rechts, unten kleiner als oben. */
  private readBoundingBox(boundingBoxValue: unknown, boundingBoxPath: string): FigureBoundingBox {
    const boundingBoxValues = requireList(boundingBoxValue, boundingBoxPath)
    if (boundingBoxValues.length !== 4) {
      throw new BlockContentError(boundingBoxPath + ': erwartet sind vier Zahlen [left, top, right, bottom].')
    }
    const left = requireNumber(boundingBoxValues[0], boundingBoxPath + '[0]')
    const top = requireNumber(boundingBoxValues[1], boundingBoxPath + '[1]')
    const right = requireNumber(boundingBoxValues[2], boundingBoxPath + '[2]')
    const bottom = requireNumber(boundingBoxValues[3], boundingBoxPath + '[3]')
    if (left >= right || bottom >= top) {
      throw new BlockContentError(boundingBoxPath + ': links muss kleiner sein als rechts und unten kleiner als oben.')
    }
    return { left, top, right, bottom }
  }

  /** Die feste Kennung eines Elements: eine UUID; jede darf es im Inhalt nur einmal geben. */
  private readFreeGuid(elementObject: JsonObject, elementPath: string): string {
    const guid = requireText(elementObject.guid, elementPath + '.guid')
    if (!GUID_PATTERN.test(guid)) {
      throw new BlockContentError(elementPath + '.guid: erwartet ist eine UUID, z. B. 3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b.')
    }
    if (this.takenGuids.includes(guid)) {
      throw new BlockContentError(elementPath + '.guid: Die Kennung "' + guid + '" gibt es schon.')
    }
    this.takenGuids.push(guid)
    return guid
  }

  /** Ein Text mit Auszeichnung: fett, kursiv, Links und Formeln mitten im Satz ({@link InlineMarkupParser}). */
  private readInlineText(text: string): InlineNode[] {
    return this.inlineMarkupParser.parse(text)
  }
}
