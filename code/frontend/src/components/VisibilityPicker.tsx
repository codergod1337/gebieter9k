import { useCallback, useState } from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import { createPortal } from 'react-dom'
import type { Visibility } from '../users/Users.ts'
import { VISIBILITY_HINTS, VISIBILITY_ICON_CLASS_NAMES, VISIBILITY_LABELS, VISIBILITY_ORDER } from '../users/visibilityLabels.ts'
import { Hoverlay } from './Hoverlay.tsx'

type VisibilityPickerProps = {
  value: Visibility
  /** Ohne: nur Anzeige (wer nicht ändern darf). */
  onChange?: (changedVisibility: Visibility) => void
  disabled?: boolean
  ariaLabel: string
  /** Ein Hinweis unter der Auswahl, z. B. dass die Galerie ihn wieder überschreibt; `null`: keiner. */
  note?: string | null
}

/**
 * Wer etwas sieht, als kleines Pill (Nutzer 2026-11-09, statt der breiten Reiter): Symbol und Wort der Einstellungen
 * (🔒 Nur ich, 👥 Ich und meine Freunde, ✔ Alle User, 🌍 Alle). Wer ändern darf, klickt es an und wählt aus der Liste
 * mit Symbol, Wort und Erklärung; sonst sagt die Sprechblase, was es bedeutet. Aussehen im Theme (`.visibility-picker*`).
 * <p>
 * DIE eine Auswahl der Sichtbarkeit (Nutzer 2026-11-09: „eine Komponente für die gleichen Aufgaben“): Seite einer Datei,
 * Galerie, Profil-Einstellungen, Kontaktangaben. Die Liste hängt am offenen Popup, sonst an der Seite.
 */
export function VisibilityPicker({ value, onChange, disabled = false, ariaLabel, note = null }: VisibilityPickerProps) {
  // Wohin die Liste gehört: in ein offenes Popup (dort hält es den Fokus), sonst direkt an die Seite
  const [menuContainer, setMenuContainer] = useState<HTMLElement | null>(null)
  const handleDropdownElement = useCallback((dropdownElement: HTMLDivElement | null) => {
    if (dropdownElement === null) {
      return
    }
    const modalElement = dropdownElement.closest<HTMLElement>('.modal')
    setMenuContainer(modalElement ?? document.body)
  }, [])

  const pillContent = (
    <>
      <i className={VISIBILITY_ICON_CLASS_NAMES[value]} aria-hidden="true"></i>
      {VISIBILITY_LABELS[value]}
    </>
  )
  if (onChange === undefined) {
    return (
      <Hoverlay text={VISIBILITY_HINTS[value]}>
        <span className="visibility-picker-pill visibility-picker-pill-readonly" tabIndex={0} aria-label={ariaLabel}>
          {pillContent}
        </span>
      </Hoverlay>
    )
  }
  // Die Liste steht fest am Pill und hängt nicht in der Box: Eine ContentBox (overflow: hidden) schneidet sie sonst ab
  const menu = (
    <Dropdown.Menu className="visibility-picker-menu" popperConfig={{ strategy: 'fixed' }}>
        {VISIBILITY_ORDER.map((visibility) => (
          <Dropdown.Item key={visibility} eventKey={visibility} active={visibility === value} className="visibility-picker-option">
            <i className={VISIBILITY_ICON_CLASS_NAMES[visibility] + ' visibility-picker-option-icon'} aria-hidden="true"></i>
            <span className="visibility-picker-option-text">
              <span className="visibility-picker-option-label">{VISIBILITY_LABELS[visibility]}</span>
              <span className="visibility-picker-option-hint">{VISIBILITY_HINTS[visibility]}</span>
            </span>
          </Dropdown.Item>
        ))}
        {note !== null && <Dropdown.ItemText className="visibility-picker-note">{note}</Dropdown.ItemText>}
    </Dropdown.Menu>
  )
  return (
    <Dropdown
      ref={handleDropdownElement}
      className="visibility-picker"
      onSelect={(selectedKey) => selectedKey !== null && onChange(selectedKey as Visibility)}>
      <Dropdown.Toggle className="visibility-picker-pill" disabled={disabled} aria-label={ariaLabel}>
        {pillContent}
      </Dropdown.Toggle>
      {menuContainer !== null && createPortal(menu, menuContainer)}
    </Dropdown>
  )
}
