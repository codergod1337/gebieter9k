import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte an jeder Herleitung, mehrsprachig angelegt. Platzhalter stehen in geschweiften Klammern. */
export const DERIVATION_TEXTS = {
  /** Im Fuß der Box: wie weit die Herleitung gezeigt ist, z. B. „Schritt 2 von 3“. */
  stepProgress: { de: 'Schritt {step} von {stepCount}' },
  /** Der Knopf, der die nächste Umformung zeigt. */
  showNextStep: { de: 'Nächster Schritt' },
  /** Der Knopf, der die letzte gezeigte Umformung wieder wegnimmt. */
  showPreviousStep: { de: 'Schritt zurück' },
} satisfies Record<string, MultilingualText>
