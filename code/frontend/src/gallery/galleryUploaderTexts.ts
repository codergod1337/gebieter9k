/**
 * Texte zu den Uploadberechtigten einer Galerie (Nutzer 2026-11-22), mehrsprachig angelegt wie überall: je Sprachkürzel
 * der Text, vorerst nur Deutsch. Platzhalter stehen in geschweiften Klammern.
 */
export const GALLERY_UPLOADER_TEXTS = {
  // --- Box im Reiter „Freigabe“ der eigenen Galerie ---
  boxTitle: { de: 'Uploadberechtigte von „{galleryTitle}“' },
  boxHint: {
    de: 'Wer hier steht, darf Bilder in diese Galerie hochladen und sieht sie ganz, egal für wen sie sonst sichtbar ist. Jeder bearbeitet und löscht seine eigenen Bilder; du als Besitzer jedes Bild der Galerie.',
  },
  noUploaders: { de: 'Noch niemand. Nur du lädst in diese Galerie hoch.' },
  newUploaderButton: { de: 'neuer Uploadberechtigter' },
  columnUsers: { de: 'User' },
  columnUsersHint: { de: 'Wer in diese Galerie hochladen darf. Der Name führt auf sein Profil.' },
  columnFrameColor: { de: 'Rahmen' },
  columnFrameColorHint: {
    de: 'In dieser Farbe sind seine Bilder in der Galerie umrandet. Jeder wählt sie in seinem Profil (Zahnrad im Profilkopf).',
  },
  deleteLabel: { de: 'Uploadberechtigten austragen' },
  deleteQuestion: {
    de: 'Soll dieser User nicht mehr in die Galerie hochladen dürfen? Die Bilder, die er hochgeladen hat, bleiben in der Galerie.',
  },
  deletedToastTitle: { de: 'Ausgetragen' },
  deletedToastText: { de: 'Der User lädt nicht mehr in diese Galerie hoch. Seine Bilder sind geblieben.' },

  // --- Popup „neuer Uploadberechtigter“ ---
  newUploaderPopupTitle: { de: 'Neuer Uploadberechtigter' },
  searchLabel: { de: 'Wer soll in die Galerie hochladen dürfen?' },
  pickedLabel: { de: 'Gewählt' },
  pickOtherButton: { de: 'anderen wählen' },
  createdToastTitle: { de: 'Eingetragen' },
  createdToastText: { de: '{username} darf jetzt in „{galleryTitle}“ hochladen.' },

  // --- Legende über den Bildern einer gemeinsamen Galerie ---
  legendLabel: { de: 'Wer hat hochgeladen: die Farbe des Rahmens je User' },

  // --- Liste der Galerien im eigenen Profil: die Galerien, in die man hochladen darf ---
  sharedGalleryOwnerLabel: { de: 'von' },
  sharedGalleryMark: { de: 'gemeinsam' },
  sharedGalleryMarkHint: { de: 'Diese Galerie gehört einem anderen User. Du darfst Bilder in sie hochladen.' },
}
