/**
 * Texte der Galerie-Seite, mehrsprachig angelegt wie überall seit 2026-11-11: je Sprachkürzel der Text, vorerst nur
 * Deutsch. Die Oberfläche nimmt den der eingestellten Sprache (`getTextInCurrentLanguage`). Platzhalter stehen in
 * geschweiften Klammern. Die Texte der Freigabe stehen in `galleryShareTexts.ts`.
 */
export const GALLERY_TEXTS = {
  // --- Reiter im Subheader des Profils, sobald eine Galerie offen ist ---
  tabImages: { de: 'Bilder' },
  tabShare: { de: 'Freigabe' },

  // --- Liste der Galerien im Profil; auf dem Handy als Tabelle (Nutzer 2026-11-20) ---
  listTitle: { de: 'Galerien' },
  listTitleOwn: { de: 'Deine Galerien' },
  listCountOne: { de: '1 Galerie' },
  listCountMany: { de: '{galleryCount} Galerien' },
  listCountOwnHint: { de: ', am Griff verschieben' },
  listCountSharedOne: { de: '1 gemeinsame Galerie eines anderen Users' },
  listCountSharedMany: { de: '{galleryCount} gemeinsame Galerien anderer User' },
  listCountSeparator: { de: ' · ' },
  listEmpty: { de: 'Noch keine Galerien.' },
  listPrivate: { de: 'Dieses Profil ist privat, seine Galerien sieht nur der Besitzer.' },
  columnGallery: { de: 'Galerie' },
  columnGalleryHint: { de: 'Der Titel öffnet die Galerie. Hinter dem „i“ steht ihre Beschreibung.' },
  descriptionHintLabel: { de: 'Beschreibung von {title}' },
  columnFileCount: { de: 'Bilder' },
  columnFileCountHint: { de: 'So viele Bilder der Galerie darfst du sehen.' },
  columnLastUploadedAt: { de: 'Letztes Bild' },
  columnLastUploadedAtHint: { de: 'Wann zuletzt ein Bild in die Galerie hochgeladen wurde.' },
  lastUploadedAtLabel: { de: 'Hochgeladen' },
  columnCreatedAt: { de: 'Erstellt' },
  columnCreatedAtHint: { de: 'Wann die Galerie angelegt wurde.' },
  createdAtLabel: { de: 'Erstellt' },
  columnVisibility: { de: 'Sichtbar für' },
  columnVisibilityHint: { de: 'Wer die Galerie in diesem Profil sieht.' },
  visibilityLabel: { de: 'Sichtbarkeit von {title}' },
  columnShares: { de: 'Freigaben' },
  columnSharesHint: {
    de: 'Freigaben über einen Link: Wer so einen Link hat, sieht die Bilder ohne Anmeldung. Der Klick führt zu den Freigaben der Galerie.',
  },
  noShares: { de: 'keine' },
  noValue: { de: '–' },
  editLabel: { de: '{title} bearbeiten' },
  deleteLabel: { de: '{title} löschen' },

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

  // --- Ein Bild groß, unter dem Subheader (GalleryImageViewer): die Leiste über dem Bild ---
  viewerBackToImages: { de: 'Zurück zu den Bildern' },
  viewerPrevious: { de: 'Voriges' },
  viewerNext: { de: 'Nächstes' },
  viewerDownload: { de: 'Herunterladen' },
}
