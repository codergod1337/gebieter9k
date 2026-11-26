import type { MathTerm } from './MathTerm.ts'

/** Eine Gleichung: links und rechts vom Gleichheitszeichen je ein Term, z. B. `cos φ = x / r`. */
export class Equation {
  readonly leftSide: MathTerm

  readonly rightSide: MathTerm

  constructor(leftSide: MathTerm, rightSide: MathTerm) {
    this.leftSide = leftSide
    this.rightSide = rightSide
  }
}
