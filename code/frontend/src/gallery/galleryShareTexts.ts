/**
 * Alle Texte rund um die Freigabe einer Galerie über einen Link, mehrsprachig angelegt wie überall seit 2026-11-11: je
 * Sprachkürzel der Text, vorerst nur Deutsch. Die Oberfläche nimmt den der eingestellten Sprache
 * (`getTextInCurrentLanguage`). Platzhalter stehen in geschweiften Klammern.
 */
export const GALLERY_SHARE_TEXTS = {
  // --- in der eigenen Galerie ---
  /** Titel der Box im Reiter „Freigabe“ der eigenen Galerie. */
  boxTitle: { de: 'Freigaben von „{galleryTitle}“ über einen Link' },
  /** Der Knopf rechts im Kopf der Box und der Titel des Popups. */
  newShareButton: { de: 'neue Freigabe' },
  newSharePopupTitle: { de: 'Galerie über einen Link freigeben' },
  /** Erklärung über der Liste. */
  boxHint: {
    de: 'Wer den Link einer Freigabe hat, sieht die Bilder dieser Galerie ohne Anmeldung und kann sie herunterladen.',
  },
  noShares: { de: 'Diese Galerie ist über keinen Link freigegeben.' },
  /** Fuß der Box ohne das Recht zum Anlegen. */
  noCreateRight: { de: 'Neue Freigaben anlegen darf nur, wer das Recht FREIGABE hat oder Admin ist.' },

  // --- Spalten der Liste ---
  columnLabel: { de: 'Bezeichnung' },
  columnLabelHint: { de: 'Wofür die Freigabe ist. Nur du siehst sie.' },
  columnLink: { de: 'Link' },
  columnLinkHint: {
    de: 'Der Link zum Weitergeben. Wer ihn hat, sieht die Bilder dieser Galerie ohne Anmeldung, solange die Freigabe gilt.',
  },
  /** Der Kopierknopf in einer Zeile der Liste, für Screenreader. */
  copyLinkOfShareLabel: { de: 'Link von „{label}“ kopieren' },
  columnDuration: { de: 'Gilt' },
  columnDurationHint: { de: 'Dauerhaft, bis zu einem Zeitpunkt oder für eine Zahl von Aufrufen.' },
  columnAccessCount: { de: 'Aufrufe' },
  columnAccessCountHint: {
    de: 'Ein Aufruf: Ein Bild wird im Viewer geladen oder heruntergeladen. In einem ZIP zählt jedes Bild.',
  },
  columnFileCount: { de: 'Bilder' },
  columnFileCountHint: {
    de: 'In so vielen Bildern steht die Freigabe. Stehen zwei Zahlen da, weicht der Stand in der Suche ab: Dann die Freigabe löschen und neu anlegen.',
  },
  columnCreatedAt: { de: 'Angelegt' },
  columnCreatedAtHint: { de: 'Wann die Freigabe angelegt wurde.' },
  durationPermanent: { de: 'dauerhaft' },
  durationUntil: { de: 'bis {dateTime}' },
  durationExpired: { de: 'abgelaufen am {dateTime}' },
  durationAccessLimited: { de: 'für {maxAccessCount} Aufrufe' },
  durationAccessesUsedUp: { de: 'alle {maxAccessCount} Aufrufe verbraucht' },
  fileCountMismatch: { de: '{sharedFileCount} von {fileCount}' },

  // --- Löschen ---
  deleteLabel: { de: 'Freigabe „{label}“ löschen' },
  deleteTitle: { de: 'Freigabe löschen' },
  deleteQuestion: {
    de: 'Soll die Freigabe „{label}“ wirklich gelöscht werden? Ihr Link öffnet danach nichts mehr. Die Bilder bleiben.',
  },
  deletedToastTitle: { de: 'Freigabe gelöscht' },
  deletedToastText: { de: 'Der Link von „{label}“ öffnet nichts mehr.' },

  // --- geführtes Anlegen ---
  stepProgress: { de: 'Schritt {step} von {stepCount}' },
  stepLabelTitle: { de: 'Für wen ist die Freigabe?' },
  labelInputLabel: { de: 'Bezeichnung' },
  labelPlaceholder: { de: 'z. B. für Oma' },
  labelHint: { de: 'Daran erkennst du die Freigabe in deiner Liste wieder. Besucher sehen die Bezeichnung nicht.' },
  labelMissing: { de: 'Bitte gib eine Bezeichnung ein.' },
  stepDurationTitle: { de: 'Wie lange soll der Link gelten?' },
  durationChoicePermanent: { de: 'Dauerhaft, bis ich die Freigabe lösche' },
  durationChoiceUntil: { de: 'Bis zu einem Zeitpunkt' },
  durationChoiceAccessLimited: { de: 'Für eine Zahl von Aufrufen' },
  expiresAtInputLabel: { de: 'Bis wann?' },
  expiresAtMissing: { de: 'Bitte wähle, bis wann der Link gelten soll.' },
  expiresAtInPast: { de: 'Der Zeitpunkt muss in der Zukunft liegen.' },
  maxAccessCountInputLabel: { de: 'Wie viele Aufrufe?' },
  maxAccessCountHint: {
    de: 'Ein Aufruf: Ein Bild wird im Viewer geladen oder heruntergeladen. Die Kacheln ansehen zählt nicht.',
  },
  maxAccessCountInvalid: { de: 'Bitte gib eine ganze Zahl ab 1 ein.' },
  stepLinkTitle: { de: 'Der Link' },
  linkCreated: { de: 'Die Freigabe „{label}“ ist angelegt, sie steht in {fileCount} Bildern.' },
  linkStaysAvailable: {
    de: 'Den Link findest du jederzeit wieder: Er steht in der Liste der Freigaben dieser Galerie.',
  },
  linkInputLabel: { de: 'Link zum Weitergeben' },
  copyLinkLabel: { de: 'Link kopieren' },
  backButton: { de: 'Zurück' },
  nextButton: { de: 'Weiter' },
  cancelButton: { de: 'Abbrechen' },
  createButton: { de: 'Freigabe anlegen' },
  doneButton: { de: 'Fertig' },

  // --- Besucherseite ---
  visitorInvalid: { de: 'Diese Freigabe gibt es nicht, oder sie gilt nicht mehr.' },
  visitorNoFiles: { de: 'In dieser Galerie gibt es noch keine Bilder.' },
  visitorFileCountOne: { de: '1 Bild' },
  visitorFileCountMany: { de: '{fileCount} Bilder' },
  visitorValidUntil: { de: 'Link gültig bis {dateTime}' },
  visitorRemainingAccesses: { de: 'noch {remainingAccessCount} Aufrufe' },
  visitorDownloadAll: { de: 'Alle herunterladen' },
  visitorDownloadAllHint: {
    de: 'Lädt alle Bilder der Galerie als eine ZIP-Datei, in Originalgröße. Bei einer großen Galerie dauert das lange.',
  },
  visitorDownloadSelection: { de: 'Auswahl herunterladen ({selectedCount})' },
  visitorSelectPage: { de: 'Alle auf dieser Seite auswählen' },
  visitorUnselectAll: { de: 'Auswahl aufheben' },
  visitorSelectionTooLarge: {
    de: 'Eine Auswahl darf höchstens {maxFileCount} Bilder enthalten. Für mehr gibt es „Alle herunterladen“.',
  },
  visitorSelectLabel: { de: '{heading} auswählen' },
  visitorOpenLabel: { de: '{heading} groß ansehen' },
  visitorDownloadLabel: { de: '{heading} herunterladen' },
  visitorCheerUpLabel: { de: '{count} begeistert' },
  visitorCheerDownLabel: { de: '{count} angewidert' },
  visitorPagerLabel: { de: 'Seiten der Galerie' },
  signUpTitle: { de: 'Bewerten und kommentieren' },
  signUpText: { de: 'Melde dich doch kostenlos an, dann kannst du die Bilder bewerten und kommentieren.' },
  signUpButton: { de: 'Anmelden oder registrieren' },
  signUpClose: { de: 'Später' },
}
