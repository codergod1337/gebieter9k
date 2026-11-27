import { BlockContentError } from '../BlockContentError.ts'
import { readOptionalText, requireList, requireNumber, requireObject, requireText, requireTextOrEmpty } from '../elements/jsonValues.ts'
import type { SketchContent, SketchElement } from './SketchContent.ts'
import { SketchCoordinateSystem } from './SketchCoordinateSystem.ts'
import { SKETCH_HIGHLIGHT_KEYS, type SketchHighlightKey } from './SketchHighlightKey.ts'
import type { SketchPosition } from './SketchPosition.ts'

/**
 * Liest eine Skizze aus ihrem JSON ({@link SketchJson}): Feld, Achsenkreuz und Elemente (`POINT`, `SEGMENT`, `ANGLE`,
 * `RIGHT_ANGLE`). Passt etwas nicht, kommt ein {@link BlockContentError} mit der Stelle im JSON.
 */
export class SketchReader {
  readSketch(sketchValue: unknown, sketchPath: string): SketchContent {
    const sketchObject = requireObject(sketchValue, sketchPath)
    const width = requireNumber(sketchObject.width, sketchPath + '.width')
    const height = requireNumber(sketchObject.height, sketchPath + '.height')
    const originX = requireNumber(sketchObject.originX, sketchPath + '.originX')
    const originY = requireNumber(sketchObject.originY, sketchPath + '.originY')
    const unitLength = requireNumber(sketchObject.unitLength, sketchPath + '.unitLength')
    const axisMaxX = requireNumber(sketchObject.axisMaxX, sketchPath + '.axisMaxX')
    const axisMaxY = requireNumber(sketchObject.axisMaxY, sketchPath + '.axisMaxY')
    const description = requireTextOrEmpty(sketchObject.description, sketchPath + '.description')
    const coordinateSystem = new SketchCoordinateSystem(originX, originY, unitLength)
    const elementValues = requireList(sketchObject.elements, sketchPath + '.elements')
    const elements: SketchElement[] = []
    elementValues.forEach((elementValue, elementIndex) => {
      const element = this.readSketchElement(elementValue, sketchPath + '.elements[' + elementIndex + ']')
      elements.push(element)
    })
    return { width, height, coordinateSystem, axisMaxX, axisMaxY, description, elements }
  }

  private readSketchElement(elementValue: unknown, elementPath: string): SketchElement {
    const elementObject = requireObject(elementValue, elementPath)
    const elementType = requireText(elementObject.type, elementPath + '.type')
    if (elementType === 'POINT') {
      const position = this.readPosition(elementObject.position, elementPath + '.position')
      const label = readOptionalText(elementObject.label, elementPath + '.label')
      const hintName = readOptionalText(elementObject.hintName, elementPath + '.hintName')
      const hintDetail = readOptionalText(elementObject.hintDetail, elementPath + '.hintDetail')
      return { type: 'POINT', position, label, hintName, hintDetail }
    }
    if (elementType === 'SEGMENT') {
      const fromPosition = this.readPosition(elementObject.from, elementPath + '.from')
      const toPosition = this.readPosition(elementObject.to, elementPath + '.to')
      const label = requireTextOrEmpty(elementObject.label, elementPath + '.label')
      const labelSideText = requireText(elementObject.labelSide, elementPath + '.labelSide')
      if (labelSideText !== 'LEFT' && labelSideText !== 'RIGHT') {
        throw new BlockContentError(elementPath + '.labelSide: erwartet ist LEFT oder RIGHT.')
      }
      const highlightKey = this.readHighlightKey(elementObject.highlight, elementPath + '.highlight')
      return { type: 'SEGMENT', fromPosition, toPosition, label, labelSide: labelSideText, highlightKey }
    }
    if (elementType === 'ANGLE' || elementType === 'RIGHT_ANGLE') {
      const vertexPosition = this.readPosition(elementObject.vertex, elementPath + '.vertex')
      const firstLegEndPosition = this.readPosition(elementObject.firstLegEnd, elementPath + '.firstLegEnd')
      const secondLegEndPosition = this.readPosition(elementObject.secondLegEnd, elementPath + '.secondLegEnd')
      if (elementType === 'RIGHT_ANGLE') {
        return { type: 'RIGHT_ANGLE', vertexPosition, firstLegEndPosition, secondLegEndPosition }
      }
      const label = requireTextOrEmpty(elementObject.label, elementPath + '.label')
      const hintText = requireTextOrEmpty(elementObject.hint, elementPath + '.hint')
      const highlightKey = this.readHighlightKey(elementObject.highlight, elementPath + '.highlight')
      return { type: 'ANGLE', vertexPosition, firstLegEndPosition, secondLegEndPosition, label, hintText, highlightKey }
    }
    throw new BlockContentError(elementPath + '.type: unbekanntes Element "' + elementType + '"')
  }

  /** Die Farbe eines Elements: ein Platz der Palette; ohne Angabe keine. */
  private readHighlightKey(highlightValue: unknown, highlightPath: string): SketchHighlightKey | null {
    const highlightText = readOptionalText(highlightValue, highlightPath)
    if (highlightText === null) {
      return null
    }
    const highlightKey = SKETCH_HIGHLIGHT_KEYS.find((knownHighlightKey) => knownHighlightKey === highlightText)
    if (highlightKey === undefined) {
      throw new BlockContentError(highlightPath + ': unbekannte Farbe "' + highlightText + '"')
    }
    return highlightKey
  }

  private readPosition(positionValue: unknown, positionPath: string): SketchPosition {
    const positionObject = requireObject(positionValue, positionPath)
    const x = requireNumber(positionObject.x, positionPath + '.x')
    const y = requireNumber(positionObject.y, positionPath + '.y')
    return { x, y }
  }
}
