import type { MultilingualText } from '../../language/MultilingualText.ts'

/**
 * Alle Texte der Stimmen einer Datei (Smileys und ihre Sprechblase), mehrsprachig angelegt (Nutzer 2026-11-11): je
 * Sprachkürzel der Text, vorerst nur Deutsch. Eine weitere Sprache kommt hier dazu, je Text ein Eintrag, z. B.
 * `{ de: 'Begeistert', en: 'Thrilled' }`; die Oberfläche nimmt den der eingestellten Sprache
 * (`getTextInCurrentLanguage`). Platzhalter stehen in geschweiften Klammern (`getTextInCurrentLanguageWithValues`).
 */
export const FILE_CHEER_TEXTS = {
  /** Bezeichnung der Stimme „hoch“, in der Sprechblase und für Screenreader. */
  upLabel: { de: 'Begeistert' },
  /** Bezeichnung der Stimme „runter“. */
  downLabel: { de: 'Angewidert' },
  /** Hinweis am Smiley, mit dem der User noch nicht gestimmt hat. */
  clickGivesCheer: { de: 'Ein Klick gibt deine Stimme.' },
  /** Hinweis am Smiley mit der eigenen Stimme. */
  clickTakesCheerBack: { de: 'Deine Stimme. Ein Klick nimmt sie zurück.' },
  /** Unter der Liste, wenn es mehr Stimmen gibt als genannte User. */
  furtherUsers: { de: 'und {count} weitere' },
  /** Der Knopf, der alle User einer Richtung nachlädt. */
  loadAllUsers: { de: 'Alle laden' },
  /** Fortschritt, solange alle User nachgeladen werden. */
  loadingAllUsers: { de: '{loadedCount} von {totalCount} geladen …' },
  /** Für Screenreader: ein Smiley mit seiner Zahl. */
  buttonLabel: { de: '{label}, {count} Stimmen' },
  /** Für Screenreader: der Smiley mit der eigenen Stimme. */
  ownButtonLabel: { de: '{label}, {count} Stimmen, deine Stimme' },
  /** Für Screenreader: die beiden Smileys zusammen. */
  barLabel: { de: 'Bewertung der Datei' },
} satisfies Record<string, MultilingualText>
