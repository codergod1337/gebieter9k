import { DEFAULT_LANGUAGE } from './activeLanguages.ts'
import type { MultilingualText } from './MultilingualText.ts'

/**
 * Der Text eines mehrsprachigen Texts in der Sprache der Oberfläche. Eine Sprachwahl gibt es noch nicht, deshalb ist
 * das immer die Standardsprache. Fehlt der Text dort, kommt ein leerer Text.
 */
export function getTextInCurrentLanguage(multilingualText: MultilingualText): string {
  const currentLanguageCode = DEFAULT_LANGUAGE.code
  const currentLanguageText = multilingualText[currentLanguageCode]
  if (currentLanguageText === undefined) {
    return ''
  }
  return currentLanguageText
}
