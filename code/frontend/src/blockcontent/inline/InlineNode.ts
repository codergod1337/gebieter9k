/**
 * Ein Stück eines Texts mit Auszeichnung, fertig zum Zeichnen: reiner Text, fett, kursiv, ein Link oder eine Formel
 * mitten im Satz (ihr LaTeX).
 */
export type InlineNode =
  | { type: 'TEXT'; text: string }
  | { type: 'BOLD'; children: InlineNode[] }
  | { type: 'ITALIC'; children: InlineNode[] }
  | { type: 'LINK'; address: string; children: InlineNode[] }
  | { type: 'FORMULA'; latex: string }
