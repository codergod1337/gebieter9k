/**
 * Die Werte des Feldes `status` einer Datei, wie das Backend sie aus `gebiter.file.status-*` liefert (Stammdaten). So
 * steht kein Wert fest im Frontend.
 */
export type FileStatusValueSet = {
  /** die Datei ist da, änderbar nach den Rechten */
  active: string
  /** lesbar und in der Suche, aber gesperrt */
  deactivated: string
  /** für normale User nur noch lesbar */
  archived: string
  /** weich gelöscht, nur der Admin */
  deleted: string
}
