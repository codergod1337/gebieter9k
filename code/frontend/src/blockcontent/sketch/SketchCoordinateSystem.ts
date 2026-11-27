import type { SketchPosition } from './SketchPosition.ts'

/**
 * Das Koordinatensystem einer Skizze: Es rechnet die Koordinaten des gezeichneten Systems in die Einheiten der Skizze
 * um (das Feld des SVG). Jede Skizze hat damit einen Nullpunkt und einen Maßstab, die „1“ liegt immer gleich weit vom
 * Nullpunkt (Nutzer 2026-11-27). Im gezeichneten System zeigt y nach oben, im SVG nach unten.
 */
export class SketchCoordinateSystem {
  /** Wo der Nullpunkt im Feld der Skizze liegt. */
  readonly originSketchX: number

  readonly originSketchY: number

  /** So viele Einheiten der Skizze ist die Strecke von 0 bis 1 lang. */
  readonly unitLength: number

  constructor(originSketchX: number, originSketchY: number, unitLength: number) {
    this.originSketchX = originSketchX
    this.originSketchY = originSketchY
    this.unitLength = unitLength
  }

  toSketchX(x: number): number {
    return this.originSketchX + x * this.unitLength
  }

  toSketchY(y: number): number {
    return this.originSketchY - y * this.unitLength
  }

  /** Der Winkel der Richtung vom einen Ort zum anderen gegen die x-Achse, im Bogenmaß, gegen den Uhrzeigersinn. */
  getDirectionRadians(fromPosition: SketchPosition, toPosition: SketchPosition): number {
    const horizontalDistance = toPosition.x - fromPosition.x
    const verticalDistance = toPosition.y - fromPosition.y
    return Math.atan2(verticalDistance, horizontalDistance)
  }
}
