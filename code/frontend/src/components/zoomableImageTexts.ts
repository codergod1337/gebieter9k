import type { MultilingualText } from '../language/MultilingualText.ts'

/** Die Texte zu {@link ZoomableImage}, mehrsprachig angelegt. */
export const ZOOMABLE_IMAGE_TEXTS = {
  /** Wie man das Bild bedient; steht dort, wo ein Modul das Bild zeigt (Hinweis in der Leiste, Fuß einer Box). */
  usageHint: {
    de: 'Ein Klick aufs Bild zeigt es in Originalgröße. Dort zoomt das Mausrad, die gedrückte rechte Maustaste verschiebt das Bild, und ein weiterer Klick passt es wieder ein.',
  },
  /** Für Screenreader: was hinter dem „i“ mit dem Hinweis steht. */
  usageHintLabel: { de: 'So bedienst du das Bild' },
} satisfies Record<string, MultilingualText>
