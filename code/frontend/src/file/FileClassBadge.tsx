import { Hoverlay } from '../components/Hoverlay.tsx'
import type { ReactNode } from 'react'
import { LookBadge } from '../badge/LookBadge.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { FileClass } from './FileClass.ts'
import { FileClassHint } from './FileClassHint.tsx'

type FileClassBadgeProps = {
  fileClass: FileClass
  /** Statt des Anzeigenamens, z. B. mit markierter Fundstelle in der Auswahl. */
  children?: ReactNode
  /** Beschreibung und Key der FileClass als Sprechblase über der Kachel ({@link FileClassHint}), z. B. auf der Seite einer Datei. */
  showDescription?: boolean
}

/**
 * Eine Dateiart als Kachel: ihr Symbol und ihr Anzeigename im Aussehen aus den Daten (`badgeLook`: Verlauf, Struktur,
 * Effekte, Farben). Überall, wo eine FileClass steht, dieselbe Kachel: Auswahl, Listen, Seite einer Datei, Admin.
 */
export function FileClassBadge({ fileClass, children, showDescription = false }: FileClassBadgeProps) {
  const displayNameText = getTextInCurrentLanguage(fileClass.displayName)
  let badgeText: ReactNode = displayNameText
  if (children !== undefined) {
    badgeText = children
  }
  const badge = (
    <LookBadge look={fileClass.badgeLook} shape="tile">
      {badgeText}
    </LookBadge>
  )
  if (!showDescription) {
    return badge
  }
  return (
    <Hoverlay text={<FileClassHint fileClass={fileClass} />}>
      <span className="file-class-badge-described" tabIndex={0}>
        {badge}
      </span>
    </Hoverlay>
  )
}
