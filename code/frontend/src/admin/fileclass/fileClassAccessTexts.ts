import type { MultilingualText } from '../../language/MultilingualText.ts'

/**
 * Die Texte zu den drei Schaltern einer FileClass (lesen, bearbeiten, hochladen) in der Matrix „FileClass-AR“ und im Tab
 * „FileClass“, mehrsprachig angelegt (Nutzer 2026-11-11). In der Matrix steht je Schalter ein Buchstabe: L lesen,
 * B bearbeiten, H hochladen.
 */
export const FILE_CLASS_ACCESS_TEXTS = {
  /** Spaltenkopf im Tab „FileClass“. */
  readHeader: { de: 'Lesen' },
  /** Spaltenkopf im Tab „FileClass“. */
  editHeader: { de: 'Bearbeiten' },
  /** Spaltenkopf im Tab „FileClass“. */
  uploadHeader: { de: 'Hochladen' },
  /** Pinsel der Matrix: nimmt jeden Zugriff. */
  brushNoneHint: { de: 'Pinsel: kein Zugriff' },
  /** Pinsel der Matrix: L. */
  brushReadHint: { de: 'Pinsel: nur lesen' },
  /** Pinsel der Matrix: LH. */
  brushReadUploadHint: { de: 'Pinsel: lesen und hochladen' },
  /** Pinsel der Matrix: LB. */
  brushReadEditHint: {
    de: 'Pinsel: lesen und bearbeiten. Bearbeiten wird noch nicht ausgewertet: Bis die Regel steht, bearbeitet der Autor seine eigene Datei.',
  },
  /** Pinsel der Matrix: LBH. */
  brushReadEditUploadHint: {
    de: 'Pinsel: lesen, bearbeiten und hochladen. Bearbeiten wird noch nicht ausgewertet: Bis die Regel steht, bearbeitet der Autor seine eigene Datei.',
  },
  /** Für Screenreader: was eine Zelle gerade erlaubt. */
  cellNone: { de: 'kein Zugriff' },
  cellRead: { de: 'lesen' },
  cellReadUpload: { de: 'lesen und hochladen' },
  cellReadEdit: { de: 'lesen und bearbeiten' },
  cellReadEditUpload: { de: 'lesen, bearbeiten und hochladen' },
} satisfies Record<string, MultilingualText>
