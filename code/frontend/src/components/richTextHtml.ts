import { ACTIVE_LANGUAGES } from '../language/activeLanguages.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { sanitizeHtml } from './sanitizeHtml.ts'

/**
 * Das erlaubte HTML des Rich-Text-Editors, nach `richTextHtml.ts` der Vorlage, auf die Wünsche des Nutzers (2026-11-09)
 * beschnitten: fett, kursiv, Überschriften 1 bis 3, Absatz, Zeilenumbruch, Trennlinie; keine Farben, keine Bilder.
 * Dieselbe Liste wie `gebiter.rich-text.allowed-tags` im Backend, das beim Speichern noch einmal bereinigt.
 */
const RICH_TEXT_ALLOWED_TAG_NAMES = new Set(['P', 'DIV', 'BR', 'STRONG', 'B', 'EM', 'I', 'H1', 'H2', 'H3', 'HR'])

/** Ein Rich-Text trägt kein einziges Attribut: kein `onclick`, `style`, `href`, `src`. */
const RICH_TEXT_ALLOWED_ATTRIBUTE_NAMES = new Set<string>()

/**
 * Bereinigt HTML für Speichern und Anzeige über den gemeinsamen {@link sanitizeHtml}: Erlaubte Tags bleiben ohne jedes
 * Attribut, andere werden durch ihren Inhalt ersetzt, Code-Elemente fliegen ganz raus, ebenso Kommentare. Was immer im
 * Datenbestand liegt: mehr als diese Tags erreicht nie den DOM.
 */
export function sanitizeRichTextHtml(richTextHtml: string | null | undefined): string {
  if (richTextHtml === null || richTextHtml === undefined || richTextHtml === '') {
    return ''
  }
  return sanitizeHtml(richTextHtml, RICH_TEXT_ALLOWED_TAG_NAMES, RICH_TEXT_ALLOWED_ATTRIBUTE_NAMES)
}

/** Der sichtbare Text eines HTMLs, ohne Leerraum außen: für den Zeichenzähler und „steht etwas drin“. */
export function getRichTextPlainText(richTextHtml: string | null | undefined): string {
  if (richTextHtml === null || richTextHtml === undefined || richTextHtml === '') {
    return ''
  }
  const parsedDocument = new DOMParser().parseFromString(richTextHtml, 'text/html')
  const plainText = parsedDocument.body.textContent ?? ''
  return plainText.trim()
}

/** Steht etwas im HTML, ein Wort oder eine Trennlinie? */
export function hasRichTextContent(richTextHtml: string | null | undefined): boolean {
  const plainText = getRichTextPlainText(richTextHtml)
  if (plainText !== '') {
    return true
  }
  return /<hr\b/i.test(richTextHtml ?? '')
}

/**
 * Ein mehrsprachiger Rich-Text zum Speichern (Nutzer 2026-11-09: jeder Rich-Text ist mehrsprachig, vorerst nur Deutsch):
 * je aktiver Sprache bereinigt, Sprachen ohne Inhalt fallen weg; ohne jeden Inhalt `null`. So speichert das Backend nie
 * ein leeres `{"de": "<p></p>"}`; es prüft und bereinigt selbst noch einmal.
 */
export function sanitizeMultilingualRichText(multilingualRichText: MultilingualText): MultilingualText | null {
  const sanitizedMultilingualRichText: MultilingualText = {}
  let anyLanguageFilled = false
  for (const language of ACTIVE_LANGUAGES) {
    const languageHtml = multilingualRichText[language.code]
    const sanitizedHtml = sanitizeRichTextHtml(languageHtml)
    if (!hasRichTextContent(sanitizedHtml)) {
      continue
    }
    sanitizedMultilingualRichText[language.code] = sanitizedHtml
    anyLanguageFilled = true
  }
  if (!anyLanguageFilled) {
    return null
  }
  return sanitizedMultilingualRichText
}

/** Ist eine Sprache länger als `maxPlainTextLength` Zeichen sichtbaren Texts? Für Zähler und gesperrtes Speichern. */
export function isAnyRichTextLanguageTooLong(multilingualRichText: MultilingualText, maxPlainTextLength: number): boolean {
  for (const language of ACTIVE_LANGUAGES) {
    const languagePlainText = getRichTextPlainText(multilingualRichText[language.code])
    if (languagePlainText.length > maxPlainTextLength) {
      return true
    }
  }
  return false
}
