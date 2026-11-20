/**
 * Texte der Galerie-Seite, mehrsprachig angelegt wie überall seit 2026-11-11: je Sprachkürzel der Text, vorerst nur
 * Deutsch. Die Oberfläche nimmt den der eingestellten Sprache (`getTextInCurrentLanguage`). Platzhalter stehen in
 * geschweiften Klammern. Die Texte der Freigabe stehen in `galleryShareTexts.ts`.
 */
export const GALLERY_TEXTS = {
  // --- Reiter im Subheader des Profils, sobald eine Galerie offen ist ---
  tabImages: { de: 'Bilder' },
  tabShare: { de: 'Freigabe' },

  // --- Hochladen: der Knopf rechts im Kopf der Galerie und sein Popup ---
  newImagesButton: { de: 'neue Bilder' },
  uploadPopupTitle: { de: 'Neue Bilder für „{title}“' },
  uploadPopupDone: { de: 'Fertig' },
  uploadPopupStillUploading: {
    de: 'Es laden noch Bilder hoch. Schließt du jetzt, brechen sie ab und müssen von vorn hochgeladen werden.',
  },
  uploadPopupKeepUploading: { de: 'Weiter hochladen' },
  uploadPopupCloseAnyway: { de: 'Abbrechen und schließen' },

  // --- Filter nach Hashtags über den Kacheln ---
  tagFilterLabel: { de: 'Nach Hashtags filtern' },
  /** Ein Schalter für Screenreader, z. B. „#strand, 12 Bilder“. */
  tagToggleLabel: { de: '{tag}, {fileCount} Bilder' },
  tagFilterReset: { de: 'alle Bilder zeigen' },
  noImagesWithSelectedTags: { de: 'Kein Bild dieser Galerie trägt einen der gewählten Hashtags.' },
  sortingPausedWhileFiltered: {
    de: 'Solange ein Hashtag gewählt ist, lässt sich die Reihenfolge der Bilder nicht ändern.',
  },
}
