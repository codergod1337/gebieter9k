/** Ein Ziel einer FileClass, wie das Enum `FileClassDestination` im Backend: ein Upload-Weg mit eigenem Dropdown. */
export type FileClassDestination = 'GALLERY'

/** Alle Ziele in der Reihenfolge der Spalten. */
export const FILE_CLASS_DESTINATIONS: readonly FileClassDestination[] = ['GALLERY']

/** Wie ein Ziel heißt und was es bedeutet. */
export const FILE_CLASS_DESTINATION_LABELS: Record<FileClassDestination, { label: string; hint: string }> = {
  GALLERY: {
    label: 'Galerie',
    hint: 'Beim Hochladen in eine eigene Galerie im Profil steht diese FileClass im Dropdown.',
  },
}

/**
 * Eine Zuordnung „FileClass X wird am Ziel Y angeboten“, wie das Backend sie als JSON liefert.
 * Doku: `docu/entities/FileClassDestinationAssignment.md`
 */
export type FileClassDestinationAssignment = {
  id: number
  fileClassKey: string
  destination: FileClassDestination
}

/** Zum Anlegen: ohne `id`, die vergibt das Backend. */
export type NewFileClassDestinationAssignment = Omit<FileClassDestinationAssignment, 'id'>
