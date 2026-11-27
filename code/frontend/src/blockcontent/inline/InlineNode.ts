import type { MathTerm } from '../math/MathTerm.ts'

/**
 * Ein Stück eines Texts mit Auszeichnung, fertig zum Zeichnen: reiner Text, fett, kursiv, ein Link, eine Formel mitten
 * im Satz, oder eine Formel, die sich nicht lesen ließ (dann steht ihr getippter Text da und der Grund dazu).
 */
export type InlineNode =
  | { type: 'TEXT'; text: string }
  | { type: 'BOLD'; children: InlineNode[] }
  | { type: 'ITALIC'; children: InlineNode[] }
  | { type: 'LINK'; address: string; children: InlineNode[] }
  | { type: 'FORMULA'; term: MathTerm }
  | { type: 'PROBLEM'; text: string; message: string }
