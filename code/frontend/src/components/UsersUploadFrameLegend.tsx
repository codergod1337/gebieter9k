import { UsersGuidName } from './UsersGuidName.tsx'
import { UsersUploadFrameSwatch } from './UsersUploadFrameSwatch.tsx'

type UsersUploadFrameLegendProps = {
  /** Die User der Legende in ihrer Reihenfolge, jeder einmal. */
  usersGuids: string[]
  /** Für Screenreader, z. B. „Wer hat hochgeladen“. */
  label: string
  /** Der Name der Seite, von der aus man ein Profil öffnet, für „Zurück zu …“. */
  originLabel: string
}

/**
 * Die Legende zu farbigen Rahmen (Nutzer 2026-11-22): je User sein Farbfeld ({@link UsersUploadFrameSwatch}) und sein
 * Name ({@link UsersGuidName}, führt auf sein Profil). So sieht man über den Bildern einer gemeinsamen Galerie, welche
 * Farbe wem gehört. Lage in `base.css` (`.upload-frame-legend`).
 */
export function UsersUploadFrameLegend({ usersGuids, label, originLabel }: UsersUploadFrameLegendProps) {
  return (
    <ul className="upload-frame-legend" aria-label={label}>
      {usersGuids.map((usersGuid) => (
        <li key={usersGuid} className="upload-frame-legend-entry">
          <UsersUploadFrameSwatch usersGuid={usersGuid} />
          <UsersGuidName usersGuid={usersGuid} originLabel={originLabel} />
        </li>
      ))}
    </ul>
  )
}
