import { DEFAULT_LANGUAGE } from './activeLanguages.ts'
import type { MultilingualText } from './MultilingualText.ts'

/**
 * Ein freiwilliger mehrsprachiger Text, z. B. eine Beschreibung: ohne Text in der Standardsprache `null`, sonst der Text
 * selbst. So speichert das Backend nie ein leeres `{"de": ""}`.
 */
export function getFilledMultilingualTextOrNull(multilingualText: MultilingualText): MultilingualText | null {
  const defaultLanguageText = multilingualText[DEFAULT_LANGUAGE.code] ?? ''
  if (defaultLanguageText.trim() === '') {
    return null
  }
  return multilingualText
}
