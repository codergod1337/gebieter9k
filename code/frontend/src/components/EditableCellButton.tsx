import type { ReactNode } from 'react'

type EditableCellButtonProps = {
  /** Für Screenreader, z. B. „Name von fileName ändern“. */
  label: string
  disabled?: boolean
  onClick: () => void
  /** Der Wert, wie er in der Zelle steht. */
  children: ReactNode
}

/**
 * Ein Wert in einer Tabellenzelle, der per Klick ein kleines Popup zum Ändern öffnet ({@link EditValuePopup}): So wird
 * direkt in der Zeile geändert, ohne eigene Bearbeiten-Seite. Beim Zeigen bekommt er einen Rahmen (Theme). Global, weil
 * jede Tabelle ihn nutzen kann.
 */
export function EditableCellButton({ label, disabled = false, onClick, children }: EditableCellButtonProps) {
  return (
    <button type="button" className="editable-cell-button" aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
