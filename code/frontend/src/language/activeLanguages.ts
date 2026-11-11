import germanFlagImageUrl from 'flag-icons/flags/4x3/de.svg'
import type { LanguageCode } from './MultilingualText.ts'

/** Eine Sprache, die die Oberfläche anbietet. */
export type ActiveLanguage = {
  code: LanguageCode
  /** Name der Sprache in ihrer eigenen Sprache. */
  name: string
  /**
   * Die Flagge aus `flag-icons`, einzeln eingebunden. Das CSS des Pakets würde alle rund 270 Flaggen ins Bundle
   * holen, wir brauchen nur die der aktiven Sprachen.
   */
  flagImageUrl: string
}

/**
 * Die aktiven Sprachen. Die erste ist die Standardsprache und muss zu `gebiter.language.default-code` im Backend
 * passen. Vorerst nur Deutsch: Jede Eingabe eines mehrsprachigen Texts zeigt je Sprache eine Zeile mit Flagge, eine
 * neue Sprache kommt also nur hier dazu (Kürzel in `LanguageCode`, Flagge importieren, Eintrag anfügen).
 */
export const ACTIVE_LANGUAGES: ActiveLanguage[] = [{ code: 'de', name: 'Deutsch', flagImageUrl: germanFlagImageUrl }]

/** Die Standardsprache: die erste der aktiven Sprachen. */
export const DEFAULT_LANGUAGE: ActiveLanguage = ACTIVE_LANGUAGES[0]
