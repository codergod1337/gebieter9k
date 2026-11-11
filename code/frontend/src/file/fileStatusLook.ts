import type { StatusLegendEntry } from '../components/StatusLegendMark.tsx'
import type { FileStatusValueSet } from './FileStatusValueSet.ts'

/**
 * Die Stände einer Datei (Feld `status`) mit Aussehen und Bedeutung, die Werte aus den Stammdaten (Nutzer 2026-11-09):
 * aktiv, deaktiviert, archiviert, gelöscht.
 */
export function getFileStatusLegend(fileStatusValueSet: FileStatusValueSet): StatusLegendEntry[] {
  return [
    {
      value: fileStatusValueSet.active,
      look: { tone: 'SUCCESS', iconClassName: 'bi bi-check2-circle', label: 'aktiv' },
      explanation: 'Die Datei ist da: Jeder, der sie sehen darf, findet sie; ändern nach den Rechten.',
    },
    {
      value: fileStatusValueSet.deactivated,
      look: { tone: 'WARNING', iconClassName: 'bi bi-lock-fill', label: 'deaktiviert' },
      explanation: 'Noch in der Suche und lesbar, aber gesperrt: Niemand ändert mehr etwas daran.',
    },
    {
      value: fileStatusValueSet.archived,
      look: { tone: 'NEUTRAL', iconClassName: 'bi bi-archive-fill', label: 'archiviert' },
      explanation: 'Abgelegt: Für normale User nur noch lesbar.',
    },
    {
      value: fileStatusValueSet.deleted,
      look: { tone: 'DANGER', iconClassName: 'bi bi-trash3-fill', label: 'gelöscht' },
      explanation: 'Weich gelöscht: Nur noch der Admin bekommt sie über seine Endpunkte und kann sie endgültig löschen.',
    },
  ]
}
