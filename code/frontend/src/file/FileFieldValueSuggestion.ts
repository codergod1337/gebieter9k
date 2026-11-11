/** Ein Vorschlag der Feldwert-Suche (`FileFieldValueSuggestion` im Backend): der vorhandene Wert und an wie vielen Dateien er steht. */
export type FileFieldValueSuggestion = {
  value: string
  fileCount: number
}
