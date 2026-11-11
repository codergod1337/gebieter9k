import type { ReactNode } from 'react'

type BadgeLookPreviewProps = {
  /** das Badge mit den gerade eingegebenen Werten */
  children: ReactNode
}

/**
 * Die Live-Vorschau eines Badges, wie in der Vorlage: dasselbe Badge auf hellem und auf dunklem Grund, so sieht man
 * sofort, ob es überall trägt. Der Grund ist fest (base.css), nicht vom Theme.
 */
export function BadgeLookPreview({ children }: BadgeLookPreviewProps) {
  return (
    <div className="badge-look-preview">
      <div className="badge-look-preview-light">{children}</div>
      <div className="badge-look-preview-dark">{children}</div>
    </div>
  )
}
