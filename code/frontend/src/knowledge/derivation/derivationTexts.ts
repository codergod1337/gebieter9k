import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte an jeder Herleitung, mehrsprachig angelegt. Platzhalter stehen in geschweiften Klammern. */
export const DERIVATION_TEXTS = {
  /** Vor der ersten und der letzten Zeile: womit die Rechnung beginnt und was herauskommt. */
  startLabel: { de: 'Ausgang' },
  resultLabel: { de: 'Ergebnis' },
  /** Im Fuß der Box: wie viele Umformungen zwischen Ausgang und Ergebnis liegen. */
  transformationCountOne: { de: '1 Umformung' },
  transformationCountMany: { de: '{transformationCount} Umformungen' },
  /** Der Knopf, der den ganzen Rechenweg zwischen Ausgang und Ergebnis ein- bzw. wieder ausblendet. */
  showPath: { de: 'Rechenweg einblenden' },
  hidePath: { de: 'Rechenweg ausblenden' },
  /** Der Abspiel-Knopf an einer Umformung (Hoverlay und Screenreader). */
  playTransformation: { de: 'Diese Umformung ansehen' },
} satisfies Record<string, MultilingualText>
