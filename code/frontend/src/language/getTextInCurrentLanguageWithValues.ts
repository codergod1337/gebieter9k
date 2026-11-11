import { getTextInCurrentLanguage } from './getTextInCurrentLanguage.ts'
import type { MultilingualText } from './MultilingualText.ts'

/**
 * Der Text eines mehrsprachigen Texts in der Sprache der Oberfläche, mit eingesetzten Werten: Jeder Platzhalter in
 * geschweiften Klammern wird durch seinen Wert ersetzt, z. B. `{ de: 'und {count} weitere' }` mit `{ count: '12' }` zu
 * „und 12 weitere“. So steht je Sprache der ganze Satz da und jede Sprache stellt die Werte, wohin sie gehören. Ein
 * Platzhalter ohne Wert bleibt stehen, damit der Fehler auffällt.
 */
export function getTextInCurrentLanguageWithValues(
  multilingualText: MultilingualText,
  valuesByPlaceholder: Record<string, string>,
): string {
  let filledText = getTextInCurrentLanguage(multilingualText)
  for (const [placeholder, value] of Object.entries(valuesByPlaceholder)) {
    filledText = filledText.replaceAll('{' + placeholder + '}', value)
  }
  return filledText
}
