import type { MultilingualText } from '../../language/MultilingualText.ts'

/**
 * Alle Texte des Tabs „Rubriken“ (Rubriken des Gebietermarkts), mehrsprachig angelegt (Nutzer 2026-11-11): je
 * Sprachkürzel der Text, vorerst nur Deutsch. Eine weitere Sprache kommt hier dazu, je Text ein Eintrag; die Oberfläche
 * nimmt den der eingestellten Sprache (`getTextInCurrentLanguage`). Platzhalter stehen in geschweiften Klammern
 * (`getTextInCurrentLanguageWithValues`).
 */
export const SHOP_CATEGORY_TEXTS = {
  /** Beschriftung des Tabs im Subheader. */
  tabLabel: { de: 'Rubriken' },
  /** Titel der ContentBox. */
  boxTitle: { de: 'Rubriken des Gebietermarkts' },
  /** Der Knopf oben rechts. */
  newShopCategory: { de: 'neue Rubrik' },
  /** Titel des Popups zum Anlegen. */
  newShopCategoryPopupTitle: { de: 'Neue Rubrik' },
  /** Hinweis unter dem Key im Popup zum Anlegen. */
  newShopCategoryKeyHint: {
    de: 'Der feste Name der Rubrik, z. B. STICKER: Großbuchstaben, Ziffern und Unterstriche, Anfang und Ende ein Buchstabe. Ändert sich nie.',
  },
  /** Im Popup zum Anlegen: die Auswahl der FileClass, Pflicht. */
  newShopCategoryFileClassLabel: { de: 'FileClass' },
  newShopCategoryFileClassHint: {
    de: 'Pflicht: Jede Datei, die in diese Rubrik hochgeladen wird, bekommt diese FileClass. Beim Hochladen wird nichts gewählt.',
  },
  /** Spaltenkopf des Anzeigenamens. */
  displayNameHeader: { de: 'Rubrik' },
  /** Erklärung am Spaltenkopf des Anzeigenamens. */
  displayNameHeaderHint: {
    de: 'Wie die Rubrik im Markt heißt, mehrsprachig. Klick auf den Namen ändert ihn. Am Griff links verschiebst du die Zeile; so stehen die Rubriken auch im Markt.',
  },
  /** Spaltenkopf des Keys. */
  keyHeader: { de: 'Key' },
  /** Erklärung am Spaltenkopf des Keys. */
  keyHeaderHint: {
    de: 'Der feste Name der Rubrik (Key-Regel), z. B. STICKER. Damit verweist jeder Artikel auf seine Rubrik; er ändert sich nie.',
  },
  /** Spaltenkopf der FileClass. */
  fileClassHeader: { de: 'FileClass' },
  /** Erklärung am Spaltenkopf der FileClass. */
  fileClassHeaderHint: {
    de: 'Jede Rubrik hat genau eine FileClass: Jede Datei, die in die Rubrik hochgeladen wird, bekommt sie, beim Hochladen wird nichts gewählt. Ein Angebot einstellen kann dort, wer diese FileClass hochladen darf (Matrix „FileClass-AR“). Klick auf die Kachel ändert sie.',
  },
  /** Für Screenreader: die anklickbare FileClass einer Zeile. */
  changeFileClassLabel: { de: 'FileClass von {key} ändern' },
  /** Titel des Popups zum Ändern der FileClass. */
  fileClassPopupTitle: { de: 'FileClass von {key}' },
  /** Hinweis im Popup zum Ändern der FileClass. */
  fileClassPopupHint: {
    de: 'Gilt für alles, was ab jetzt in die Rubrik hochgeladen wird. Dateien, die schon in der Rubrik stehen, behalten ihre FileClass.',
  },
  /** Für Screenreader: der anklickbare Anzeigename einer Zeile. */
  renameLabel: { de: 'Anzeigename von {key} ändern' },
  /** Titel des Popups zum Ändern des Anzeigenamens. */
  renamePopupTitle: { de: 'Anzeigename von {key}' },
  /** Steht in der leeren Tabelle. */
  emptyText: { de: 'Es gibt noch keine Rubriken.' },
  /** Fuß der ContentBox. */
  footerCount: { de: '{count} Rubriken, am Griff links verschieben' },
  /** Name der Liste im Toast nach dem Verschieben. */
  listLabel: { de: 'Rubriken' },
} satisfies Record<string, MultilingualText>
