import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte des Editors für Inhalte aus Bausteinen, mehrsprachig angelegt. */
export const BLOCK_CONTENT_EDITOR_TEXTS = {
  /** Die Leiste: wie die linke Seite ein Element zeigt. */
  viewChoiceLabel: { de: 'Linke Seite zeigt' },
  viewElements: { de: 'Elemente' },
  viewJson: { de: 'JSON' },
  unreadable: { de: 'So lässt sich der Inhalt nicht anzeigen: {reason}' },
  /** Der Code eines Elements bzw. der Animationen. */
  jsonElementLabel: { de: 'Der Code dieses Elements' },
  jsonAnimationsLabel: { de: 'Animationen (Code)' },
  jsonInvalid: { de: 'Noch kein gültiges JSON.' },
  jsonElementProblem: { de: 'Ein Element ist ein Objekt mit "type".' },
  jsonAnimationsProblem: { de: 'Die Animationen sind eine Liste.' },
  /** Der gespeicherte Inhalt ist kein JSON-Objekt mit Elementen: Dann lässt er sich nur als Ganzes berichtigen. */
  contentUnavailable: { de: 'Der gespeicherte Text ist kein lesbares JSON mit Elementen. Bitte hier berichtigen.' },
  jsonInputLabel: { de: 'Der Inhalt als JSON' },
  equationCountOne: { de: '1 Gleichung' },
  equationCountMany: { de: '{equationCount} Gleichungen' },
  /** Die Liste der Elemente. */
  moveUp: { de: 'nach oben' },
  moveDown: { de: 'nach unten' },
  remove: { de: 'entfernen' },
  addElement: { de: 'Element' },
  /** Die Arten der Elemente. */
  contentBoxLabel: { de: 'ContentBox' },
  collapsibleLabel: { de: 'Aufklapper' },
  headingLabel: { de: 'Überschrift' },
  paragraphLabel: { de: 'Absatz' },
  hintLabel: { de: 'Hinweis' },
  listLabel: { de: 'Liste' },
  equationLabel: { de: 'Gleichung' },
  figureLabel: { de: 'Figur' },
  /** Felder der Elemente. */
  titleLabel: { de: 'Titel' },
  newContentBoxTitle: { de: 'Neue ContentBox' },
  newCollapsibleTitle: { de: 'Rechenweg' },
  headingText: { de: 'Text der Überschrift' },
  listOrdered: { de: 'nummeriert' },
  listItem: { de: 'Punkt der Liste' },
  addListItem: { de: 'Punkt' },
  equationNumber: { de: '({number})' },
  markupBold: { de: 'fett' },
  markupItalic: { de: 'kursiv' },
  markupLink: { de: 'Link' },
  markupFormula: { de: 'Formel im Satz' },
  markupEquationReference: { de: 'Verweis auf eine Gleichung' },
  equationReferenceTitle: { de: 'Auf welche Gleichung verweisen?' },
  equationReferenceCancel: { de: 'Abbrechen' },
  /** Figur. */
  figureHorizontal: { de: 'x von … bis' },
  figureVertical: { de: 'y von … bis' },
  figureLeft: { de: 'x am linken Rand' },
  figureRight: { de: 'x am rechten Rand' },
  figureBottom: { de: 'y am unteren Rand' },
  figureTop: { de: 'y am oberen Rand' },
  figureAspectRatio: { de: 'Breite : Höhe' },
  figureCode: { de: 'Die Figur als Text (JSXGraph, JessieCode)' },
  textHelp: {
    de: 'Text: **fett**, *kursiv*, [Text](https://adresse), $…$ für eine Formel im Satz (LaTeX; der Knopf mit dem x² öffnet das Formelfeld), [[equation:…]] für einen Verweis auf eine Gleichung (der Knopf mit dem # stellt sie zur Wahl). Ein \\ davor nimmt einem Zeichen die Bedeutung.',
  },
} satisfies Record<string, MultilingualText>
