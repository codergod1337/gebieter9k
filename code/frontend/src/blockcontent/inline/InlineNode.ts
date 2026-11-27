/**
 * Ein Stück eines Texts mit Auszeichnung, fertig zum Zeichnen: reiner Text, fett, kursiv, ein Link, eine Formel
 * mitten im Satz (ihr LaTeX) oder ein Verweis auf eine Gleichung des Inhalts (ihre feste Kennung).
 */
export type InlineNode =
  | { type: 'TEXT'; text: string }
  | { type: 'BOLD'; children: InlineNode[] }
  | { type: 'ITALIC'; children: InlineNode[] }
  | { type: 'LINK'; address: string; children: InlineNode[] }
  | { type: 'FORMULA'; latex: string }
  | { type: 'EQUATION_REFERENCE'; equationGuid: string }
