import type { ActiveLanguage } from '../language/activeLanguages.ts'

type LanguageFlagProps = {
  language: ActiveLanguage
}

/** Die Flagge einer Sprache (4:3, so hoch wie die Schrift), z. B. vor dem Eingabefeld eines mehrsprachigen Texts. */
export function LanguageFlag({ language }: LanguageFlagProps) {
  return <img src={language.flagImageUrl} alt={language.name} height={14} className="rounded-1" />
}
