import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte einer Ebene der Gliederung: ihre Box, ihre Tabelle und ihre Popups. Platzhalter in geschweiften Klammern. */
export type KnowledgeSectionLevelTexts = {
  /** Titel der Box mit dem Namen des gewählten Punkts darüber (`{parent}`); bei den Rubriken ohne Platzhalter. */
  boxTitle: MultilingualText
  /** Titel der Box, solange darüber nichts gewählt ist; bei den Rubriken unbenutzt. */
  boxTitleWithoutParent: MultilingualText
  /** Statt der Tabelle, solange darüber nichts gewählt ist; bei den Rubriken unbenutzt. */
  parentMissing: MultilingualText
  emptyText: MultilingualText
  /** Der Knopf oben rechts und der Titel seines Popups. */
  newButton: MultilingualText
  newPopupTitle: MultilingualText
  newKeyHint: MultilingualText
  /** Spaltenkopf des Anzeigenamens und seine Erklärung. */
  displayNameHeader: MultilingualText
  displayNameHeaderHint: MultilingualText
  /** Im Fuß: wie viele es sind (`{count}`). */
  footerCount: MultilingualText
  /** Für den Toast nach dem Umsortieren. */
  listLabel: MultilingualText
  /** Der Knopf in der Zeile, der die Punkte darunter zeigt (`{count}`); bei den Unterkapiteln unbenutzt. */
  childrenButton: MultilingualText
  childrenHeader: MultilingualText
  childrenHeaderHint: MultilingualText
}

/** Die Texte des Reiters „Gliederung“ im Wissensmanager, mehrsprachig angelegt. */
export const KNOWLEDGE_SECTION_TEXTS = {
  /** Beschriftung des Reiters im Subheader. */
  tabLabel: { de: 'Gliederung' },
  /** Über den drei Boxen: wozu der Reiter da ist. */
  intro: {
    de: 'Die Gliederung der Wissensdatenbank: Rubriken, darin Kapitel, darin Unterkapitel. Hier steht zu jedem Key sein Anzeigename und sein Platz; die Seiten selbst tragen nur die Keys. Ein Klick auf einen Namen ändert ihn, am Griff links ändert sich die Reihenfolge, der Knopf „Darin“ zeigt darunter, was in einer Rubrik oder einem Kapitel steckt.',
  },
  /** Spaltenkopf des Keys und seine Erklärung, auf jeder Ebene gleich. */
  keyHeader: { de: 'Key' },
  keyHeaderHint: { de: 'Der Name in der Adresse und in den Seiten. Ein Klick ändert ihn.' },
  /** Den Key eines Punkts ändern: für Screenreader, Titel und Feld des Popups, Erklärung darunter (`{key}`). */
  changeKeyLabel: { de: 'Key {key} ändern' },
  changeKeyPopupTitle: { de: 'Key {key} ändern' },
  changeKeyInputLabel: { de: 'Neuer Key' },
  changeKeyHint: {
    de: 'Großbuchstaben, Ziffern und Unterstriche, Anfang und Ende ein Buchstabe. Alles, was darunter hängt, bekommt den neuen Key mit, und die Adressen ändern sich entsprechend.',
  },
  /** Für Screenreader und als Titel des Popups: den Anzeigenamen eines Punkts ändern (`{key}`). */
  renameLabel: { de: 'Anzeigename von {key} ändern' },
  renamePopupTitle: { de: 'Anzeigename von {key}' },
} satisfies Record<string, MultilingualText>

/** Die Rubriken: die oberste Ebene, z. B. Mathe, Physik, ML, Code. */
export const KNOWLEDGE_RUBRIC_TEXTS: KnowledgeSectionLevelTexts = {
  boxTitle: { de: 'Rubriken' },
  boxTitleWithoutParent: { de: 'Rubriken' },
  parentMissing: { de: '' },
  emptyText: { de: 'Noch keine Rubrik. Lege die erste an, z. B. MATHE.' },
  newButton: { de: 'neue Rubrik' },
  newPopupTitle: { de: 'Neue Rubrik' },
  newKeyHint: {
    de: 'Der Name der Rubrik in der Adresse, z. B. MATHE: Großbuchstaben, Ziffern und Unterstriche, Anfang und Ende ein Buchstabe. Lässt sich später ändern.',
  },
  displayNameHeader: { de: 'Rubrik' },
  displayNameHeaderHint: { de: 'Der Name, unter dem die Rubrik überall steht. Ein Klick ändert ihn.' },
  footerCount: { de: '{count} Rubriken' },
  listLabel: { de: 'Rubriken' },
  childrenButton: { de: '{count} Kapitel' },
  childrenHeader: { de: 'Darin' },
  childrenHeaderHint: { de: 'Zeigt darunter die Kapitel dieser Rubrik.' },
}

/** Die Kapitel einer Rubrik, z. B. in Mathe: Grundlagen, Analysis 1, Lineare Algebra. */
export const KNOWLEDGE_CHAPTER_TEXTS: KnowledgeSectionLevelTexts = {
  boxTitle: { de: 'Kapitel in {parent}' },
  boxTitleWithoutParent: { de: 'Kapitel' },
  parentMissing: { de: 'Wähle oben eine Rubrik über ihren Knopf „Darin“: Dann stehen hier ihre Kapitel.' },
  emptyText: { de: 'Diese Rubrik hat noch kein Kapitel.' },
  newButton: { de: 'neues Kapitel' },
  newPopupTitle: { de: 'Neues Kapitel in {parent}' },
  newKeyHint: {
    de: 'Der Name des Kapitels in der Adresse, z. B. GRUNDLAGEN: Großbuchstaben, Ziffern und Unterstriche, Anfang und Ende ein Buchstabe. Eindeutig in seiner Rubrik, lässt sich später ändern.',
  },
  displayNameHeader: { de: 'Kapitel' },
  displayNameHeaderHint: { de: 'Der Name, unter dem das Kapitel überall steht. Ein Klick ändert ihn.' },
  footerCount: { de: '{count} Kapitel' },
  listLabel: { de: 'Kapitel' },
  childrenButton: { de: '{count} Unterkapitel' },
  childrenHeader: { de: 'Darin' },
  childrenHeaderHint: { de: 'Zeigt darunter die Unterkapitel dieses Kapitels.' },
}

/** Die Unterkapitel eines Kapitels, die unterste Ebene der Gliederung. */
export const KNOWLEDGE_SUB_CHAPTER_TEXTS: KnowledgeSectionLevelTexts = {
  boxTitle: { de: 'Unterkapitel in {parent}' },
  boxTitleWithoutParent: { de: 'Unterkapitel' },
  parentMissing: { de: 'Wähle oben ein Kapitel über seinen Knopf „Darin“: Dann stehen hier seine Unterkapitel.' },
  emptyText: { de: 'Dieses Kapitel hat noch kein Unterkapitel.' },
  newButton: { de: 'neues Unterkapitel' },
  newPopupTitle: { de: 'Neues Unterkapitel in {parent}' },
  newKeyHint: {
    de: 'Der Name des Unterkapitels in der Adresse, z. B. KOORDINATEN: Großbuchstaben, Ziffern und Unterstriche, Anfang und Ende ein Buchstabe. Eindeutig in seinem Kapitel, lässt sich später ändern.',
  },
  displayNameHeader: { de: 'Unterkapitel' },
  displayNameHeaderHint: { de: 'Der Name, unter dem das Unterkapitel überall steht. Ein Klick ändert ihn.' },
  footerCount: { de: '{count} Unterkapitel' },
  listLabel: { de: 'Unterkapitel' },
  childrenButton: { de: '' },
  childrenHeader: { de: '' },
  childrenHeaderHint: { de: '' },
}
