import { useMemo } from 'react'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { sanitizeRichTextHtml } from './richTextHtml.ts'

type RichTextViewProps = {
  /** Mehrsprachiger Rich-Text aus dem {@link MultilingualRichTextEditor}, je Sprachkürzel das HTML. */
  richText: MultilingualText
  className?: string
}

/**
 * Einen Rich-Text anzeigen, nach der Vorlage: in der Sprache der Oberfläche und vorher durch den Sanitizer, mehr als
 * seine Tags erreicht den DOM nie, gleich was in der Datenbank steht. Überschriften, Absätze und Trennlinie gestaltet
 * `.rich-text-view`.
 */
export function RichTextView({ richText, className }: RichTextViewProps) {
  const currentLanguageHtml = getTextInCurrentLanguage(richText)
  const sanitizedHtml = useMemo(() => sanitizeRichTextHtml(currentLanguageHtml), [currentLanguageHtml])
  let viewClassName = 'rich-text-view'
  if (className !== undefined) {
    viewClassName = 'rich-text-view ' + className
  }
  const innerHtml = { __html: sanitizedHtml }
  return <div className={viewClassName} dangerouslySetInnerHTML={innerHtml} />
}
